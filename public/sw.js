const CACHE_NAME = 'unity-shell-v2';
const SHELL_PATHS = ['/', '/offline.html', '/unity-icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_PATHS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('unity-shell-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  // NEVER cache authenticated requests, personal information, media or invitation URLs.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/join/') || url.pathname === '/ws') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/offline.html') || Response.error();
    }));
    return;
  }
  if (url.pathname.startsWith('/assets/') || SHELL_PATHS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    })());
  }
});

self.addEventListener('push', event => {
  let data = { title: 'Unity Call', body: 'You have a Unity update.' };
  try { if (event.data) data = event.data.json(); } catch { /* Invalid push payload */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Unity Call', {
      body: data.body || 'Open Unity Call',
      tag: data.tag || 'unity',
      data: { url: '/' },
      silent: false
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/chats'));
});
