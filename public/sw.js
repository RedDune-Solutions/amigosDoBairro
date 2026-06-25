// Service worker — Web Push (Os Amigos do Bairro)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Os Amigos do Bairro", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Os Amigos do Bairro";
  const options = {
    body: data.body || "",
    icon: "/logo-transp.png",
    badge: "/logo-transp.png",
    data: { url: data.url || "/app" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
