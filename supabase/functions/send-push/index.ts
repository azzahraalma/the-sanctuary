import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad), (c) =>
    c.charCodeAt(0)
  );
}


async function importEcPrivateKey(b64: string): Promise<CryptoKey> {
  const raw = b64urlDecode(b64);
  return crypto.subtle.importKey(
    "pkcs8",
    raw.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function makeVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);

  const header  = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64urlEncode(enc.encode(JSON.stringify({ aud: audience, exp: now + 3600, sub: subject })));

  const key = await importEcPrivateKey(privateKeyB64);
  const sig  = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(`${header}.${payload}`)
  );

  return `${header}.${payload}.${b64urlEncode(sig)}`;
}

async function encryptPayload(
  plaintext: string,
  p256dhB64: string,
  authB64: string
): Promise<{ ciphertext: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
  const enc        = new TextEncoder();
  const authSecret = b64urlDecode(authB64);

  const receiverPubKey = await crypto.subtle.importKey(
    "raw",
    b64urlDecode(p256dhB64).buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const senderPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeyPair.publicKey)
  );

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: receiverPubKey },
    senderKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const receiverPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", receiverPubKey)
  );

  const prkKey = await crypto.subtle.importKey("raw", authSecret, "HKDF", false, ["deriveBits"]);
  
  const authInfo = concat(
    enc.encode("WebPush: info\0"),
    receiverPubRaw,
    senderPublicRaw
  );

  const prkHmacKey = await crypto.subtle.importKey(
    "raw", sharedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkHmacKey, concat(authInfo, new Uint8Array([1])))
  );

  const cekInfo = concat(
    enc.encode("Content-Encoding: aesgcm\0"),
    new Uint8Array([0]),
    new Uint8Array([0, 65]),    
    receiverPubRaw,
    new Uint8Array([0, 65]),    
    senderPublicRaw
  );

  const nonceInfo = concat(
    enc.encode("Content-Encoding: nonce\0"),
    new Uint8Array([0]),
    new Uint8Array([0, 65]),
    receiverPubRaw,
    new Uint8Array([0, 65]),
    senderPublicRaw
  );

  const saltHmacKey = await crypto.subtle.importKey(
    "raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const prkHmac2 = await crypto.subtle.importKey(
    "raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const cekRaw   = new Uint8Array((await crypto.subtle.sign("HMAC", prkHmac2, concat(cekInfo,   new Uint8Array([1])))).slice(0, 16));
  const nonceRaw = new Uint8Array((await crypto.subtle.sign("HMAC", prkHmac2, concat(nonceInfo, new Uint8Array([1])))).slice(0, 12));

  const cek = await crypto.subtle.importKey(
    "raw", cekRaw, { name: "AES-GCM" }, false, ["encrypt"]
  );

  const data = enc.encode(plaintext);
  const padded = new Uint8Array(2 + data.byteLength);
  padded.set([0, 0], 0);   // pad length = 0
  padded.set(data, 2);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonceRaw }, cek, padded)
  );

  return { ciphertext: encrypted, serverPublicKey: senderPublicRaw, salt };
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.byteLength, 0);
  const out  = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.byteLength; }
  return out;
}


async function sendOnePush(
  sub:          { endpoint: string; p256dh: string; auth: string },
  payloadStr:   string,
  vapidPublic:  string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const { ciphertext, serverPublicKey, salt } = await encryptPayload(
    payloadStr,
    sub.p256dh,
    sub.auth
  );

  const url    = new URL(sub.endpoint);
  const origin = `${url.protocol}//${url.host}`;
  const jwt    = await makeVapidJwt(origin, vapidSubject, vapidPrivate);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Type":     "application/octet-stream",
      "Content-Encoding": "aesgcm",
      "Encryption":       `salt=${b64urlEncode(salt)}`,
      "Crypto-Key":       `dh=${b64urlEncode(serverPublicKey)};p256ecdsa=${vapidPublic}`,
      "Authorization":    `vapid t=${jwt},k=${vapidPublic}`,
      "TTL":              "86400",
    },
    body: ciphertext,
  });

  if (res.ok || res.status === 201) return { ok: true };
  const text = await res.text().catch(() => "");
  return { ok: false, status: res.status, error: text };
}

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

    let query = supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, email");

    if (email) query = query.eq("email", email);

    if (tipe) {
      const prefsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/preferensi_notif?select=email&${tipe}=eq.true`,
        {
          headers: {
            apikey:        SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const prefs: { email: string }[] = await prefsRes.json();
      const allowedEmails = prefs.map((p) => p.email);

      if (allowedEmails.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, note: "Tidak ada subscriber dengan preferensi ini" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      query = query.in("email", allowedEmails);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, total: 0, note: "Tidak ada subscriber" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const payload = JSON.stringify({ title, body: msgBody, url });

    const results = await Promise.allSettled(
      subs.map((s) =>
        sendOnePush(
          { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
          payload,
          VAPID_PUBLIC,
          VAPID_PRIVATE,
          VAPID_SUBJECT
        )
      )
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && !r.value.ok) {
        const st = r.value.status;
        if (st === 410 || st === 404) {
          console.warn(`Subscription expired untuk ${subs[i].email}, menghapus...`);
          await supabase.from("push_subscriptions").delete().eq("email", subs[i].email);
        } else {
          console.error(`Gagal kirim ke ${subs[i].email}: ${r.value.status} — ${r.value.error}`);
        }
      }
    }

    const sent   = results.filter((r) => r.status === "fulfilled" && (r.value as { ok: boolean }).ok).length;
    const failed = results.length - sent;

    return new Response(
      JSON.stringify({ sent, failed, total: results.length }),
      {
        headers: {
          "Content-Type":                "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});