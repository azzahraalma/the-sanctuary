/* ─────────────────────────────────────────────────────────────────
   src/hooks/usePushNotif.js
   Custom hook — urus subscribe/unsubscribe Web Push
   Simpan subscription ke tabel push_subscriptions di Supabase
───────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const VAPID_PUBLIC_KEY = "BN-PviJ5JII1B_2G4pr5Zgye_joel1AoNJObBxVRpxj1ZnZfEjzxAg_xSJiqlgnZP-ZedXESATvOsfPQBp06yNw";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotif(userEmail) {
  const [status, setStatus]   = useState(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return "idle";
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return "unsupported";
    }
    if (Notification.permission === "denied") {
      return "denied";
    }
    return "idle";
  });
  const [loading, setLoading] = useState(false);

  // Cek status awal saat mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    let active = true;
    (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (active) {
          setStatus(existing ? "subscribed" : "unsubscribed");
        }
      } catch (err) {
        console.error("SW check error:", err);
        if (active) {
          setStatus("unsubscribed");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Subscribe
  const subscribe = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready; // ✅ pakai reg dari .ready

      const perm = await Notification.requestPermission();
      if (perm === "denied") { setStatus("denied"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            email:    userEmail,
            endpoint: subJson.endpoint,
            p256dh:   subJson.keys?.p256dh,
            auth:     subJson.keys?.auth,
          },
          { onConflict: "email" }
        );

      if (error) throw error;
      setStatus("subscribed");
    } catch (err) {
      console.error("Push subscribe error:", err);
      setStatus("unsubscribed");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase.from("push_subscriptions").delete().eq("email", userEmail);
      setStatus("unsubscribed");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  return { status, loading, subscribe, unsubscribe };
}