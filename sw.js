/* ─────────────────────────────────────────────────────────────────
   sw.js  —  Service Worker for Web Push Notifications
   The Sanctuary — letakkan file ini di folder /public/
───────────────────────────────────────────────────────────────── */

const CACHE_NAME = "sanctuary-v1";

// ── Install ──────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ── Push Event — muncul saat Supabase Edge Function kirim notif ──
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "The Sanctuary", body: event.data.text() };
  }

  const title   = payload.title ?? "The Sanctuary 🌱";
  const options = {
    body:    payload.body  ?? "Kamu punya pesan baru",
    icon:    payload.icon  ?? "/icon-192.png",   // ganti sesuai asset kamu
    badge:   payload.badge ?? "/badge-72.png",
    tag:     payload.tag   ?? "sanctuary-notif", // replace notif sejenis
    renotify: true,
    data: {
      url: payload.url ?? "/dashboard",
    },
    actions: payload.actions ?? [
      { action: "buka",  title: "Buka" },
      { action: "tutup", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "tutup") return;

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Kalau tab Sanctuary sudah terbuka, fokus ke sana
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Kalau belum ada tab, buka baru
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});