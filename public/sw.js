self.addEventListener("push", (event) => {
  let data = { title: "RMS", body: "Platform notification", url: "/" };
  try {
    data = { ...data, ...JSON.parse(event.data?.text() ?? "{}") };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
