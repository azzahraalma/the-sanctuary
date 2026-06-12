self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "The Sanctuary", body: event.data.text() };
  }

  const title   = payload.title ?? "The Sanctuary";
  const options = {
    body:    payload.body  ?? "Kamu punya pesan baru",
    icon:    payload.icon  ?? "/icon-192.png",   
    badge:   payload.badge ?? "/badge-72.png",
    tag:     payload.tag   ?? "sanctuary-notif", 
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "tutup") return;

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});