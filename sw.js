const CACHE_NAME = "sanctuary-sw-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});


self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "The Sanctuary", body: event.data.text() };
    }
  }

  const title   = data.title   ?? "The Sanctuary";
  const options = {
    body:    data.body    ?? "Ada notifikasi baru untukmu.",
    icon:    data.icon    ?? "/logo192.png",   
    badge:   data.badge   ?? "/badge.png",     
    tag:     data.tag     ?? "sanctuary-notif",
    data:    { url: data.url ?? "/" },
    requireInteraction: data.requireInteraction ?? false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});