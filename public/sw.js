const CACHE_NAME = 'trustall-v6';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.svg', '/icon-512.svg', '/favicon.ico', '/robots.txt'];

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDX-XgxZm4RwVNNdZMYwZK-wN5jPgA7u2k',
  authDomain: 'trustall-technology-limited.firebaseapp.com',
  projectId: 'trustall-technology-limited',
  storageBucket: 'trustall-technology-limited.firebasestorage.app',
  messagingSenderId: '155302285805',
  appId: '1:155302285805:web:c6ec674dd11ce5c32b17e4',
});

firebase.messaging().onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  const actionUrl = data.actionUrl || data.click_action || '/';
  const badgeCount = Number.parseInt(data.unreadCount || '1', 10);
  const options = {
    body: body || 'New notification',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'trustall-notification',
    data: { url: actionUrl },
    requireInteraction: data.priority === 'high',
  };

  self.registration.showNotification(title || 'Trustall', options);
  if (Number.isFinite(badgeCount) && typeof self.registration.setAppBadge === 'function') {
    self.registration.setAppBadge(badgeCount).catch(() => {});
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  const isStaticAssetRequest = event.request.url.startsWith(self.location.origin + '/assets/') || event.request.url.includes('.js') || event.request.url.includes('.css');

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok && isStaticAssetRequest) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('/index.html');
          return Response.error();
        });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => client.url.startsWith(self.location.origin));
      if (existing) return existing.navigate(url).then((client) => client?.focus());
      return self.clients.openWindow(url);
    })
  );
});
