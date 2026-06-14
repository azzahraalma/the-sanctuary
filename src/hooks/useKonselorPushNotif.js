import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const VAPID_PUBLIC_KEY = "BN-PviJ5JII1B_2G4pr5Zgye_joel1AoNJObBxVRpxj1ZnZfEjzxAg_xSJiqlgnZP-ZedXESATvOsfPQBp06yNw";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function useKonselorPushNotif(konselorId, konselorEmail) {
  const [status, setStatus]   = useState("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!konselorId) return;

    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg      = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();

        if (cancelled) return;

        if (existing) {
          if (konselorEmail) {
            const subJson = existing.toJSON();
            await supabase
              .from("push_subscriptions")
              .upsert(
                {
                  email:         konselorEmail.toLowerCase(),
                  konselor_id:   konselorId,
                  role:          "konselor",
                  endpoint:      subJson.endpoint,
                  p256dh:        subJson.keys?.p256dh,
                  auth:          subJson.keys?.auth,
                },
                { onConflict: "email" }
              );
          }
          setStatus("subscribed");
        } else {
          setStatus("unsubscribed");
        }
      } catch (err) {
        console.error("Konselor SW init error:", err);
        if (!cancelled) setStatus("unsubscribed");
      }
    })();

    return () => { cancelled = true; };
  }, [konselorId, konselorEmail]);

  const subscribe = useCallback(async () => {
    if (!konselorId || !konselorEmail) return;
    setLoading(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg  = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();

      if (perm === "denied") { setStatus("denied"); return; }
      if (perm !== "granted") return; 

      const sub     = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const subJson = sub.toJSON();

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            email:       konselorEmail.toLowerCase(),
            konselor_id: konselorId,
            role:        "konselor",
            endpoint:    subJson.endpoint,
            p256dh:      subJson.keys?.p256dh,
            auth:        subJson.keys?.auth,
          },
          { onConflict: "email" }
        );

      if (error) throw error;
      setStatus("subscribed");
    } catch (err) {
      console.error("Konselor push subscribe error:", err);
      setStatus("unsubscribed");
    } finally {
      setLoading(false);
    }
  }, [konselorId, konselorEmail]);

  const unsubscribe = useCallback(async () => {
    if (!konselorEmail) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("email", konselorEmail.toLowerCase());

      setStatus("unsubscribed");
    } catch (err) {
      console.error("Konselor push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [konselorEmail]);

  return { status, loading, subscribe, unsubscribe };
}