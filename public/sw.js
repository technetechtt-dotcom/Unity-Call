self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Unity Call', body: 'You have a new Unity update.' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Unity Call', {
      body: data.body || 'Open Unity Call',
      tag: data.tag || 'unity',
      silent: false
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/chats'));
});
