import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Util: base64url encode ────────────────────────────────────────
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── Util: import VAPID private key ───────────────────────────────
async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

// ── Buat JWT untuk VAPID Auth ─────────────────────────────────────
async function makeVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 3600, sub: subject }))
  );
  const sigInput = new TextEncoder().encode(`${header}.${payload}`);
  const key = await importPrivateKey(privateKeyB64);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, sigInput);
  return `${header}.${payload}.${base64UrlEncode(sig)}`;
}

// ── Kirim satu push ke endpoint ───────────────────────────────────
async function sendOnePush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const url    = new URL(subscription.endpoint);
  const origin = `${url.protocol}//${url.host}`;
  const jwt    = await makeVapidJwt(origin, vapidSubject, vapidPrivate);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type":  "application/octet-stream",
      "Authorization": `vapid t=${jwt},k=${vapidPublic}`,
      "TTL":           "86400",
    },
    body: new TextEncoder().encode(payload),
  });

  if (res.ok || res.status === 201) return { ok: true };
  const text = await res.text().catch(() => "");
  return { ok: false, status: res.status, error: text };
}

// ── Handler utama ─────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { email, tipe, title, body: msgBody, url = "/dashboard" } = body;

    const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;
    const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Ambil subscribers — filter by email & preferensi tipe
    let query = supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, email");

    if (email) query = query.eq("email", email);

    // Filter berdasarkan preferensi (pengingat_sesi / komunitas / pesan_langsung)
    if (tipe) {
      const { data: prefs } = await supabase
        .from("preferensi_notif")
        .select("email")
        .eq(tipe, true);
      const allowedEmails = (prefs ?? []).map((p: { email: string }) => p.email);
      if (allowedEmails.length === 0) {
        return new Response(JSON.stringify({ sent: 0, note: "Tidak ada subscriber dengan preferensi ini" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      query = query.in("email", allowedEmails);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({ title, body: msgBody, url });
    const results = await Promise.allSettled(
      (subs ?? []).map((s) =>
        sendOnePush(
          { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
          payload,
          VAPID_PUBLIC,
          VAPID_PRIVATE,
          VAPID_SUBJECT
        )
      )
    );

    const sent   = results.filter((r) => r.status === "fulfilled" && (r.value as { ok: boolean }).ok).length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, total: results.length }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});