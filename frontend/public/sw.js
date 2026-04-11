// No-op fetch handler — required by Chrome to consider this site installable as a PWA.
// Without it, Android Chrome falls back to shortcut mode (letter icon) instead of "Install app".
self.addEventListener("fetch", () => {})

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}

  const title = data.title ?? "StockMind Alert"
  const options = {
    body: data.body ?? "",
    icon: "/icon-dark-32x32.png",
    badge: "/icon-dark-32x32.png",
    data: { url: data.url },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? "/"
  event.waitUntil(clients.openWindow(url))
})
