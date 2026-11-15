// やることガントチャート 用 Service Worker
// 通知表示（showNotification）と、PWAインストール適格性を満たすための最小構成です。
// オフラインキャッシュ等は行わず、常にネットワークへそのまま流します。

const CACHE = 'gantt-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 起動の高速化：自分のファイル（index.html・アイコン等）とFirebaseのSDKは、
// 前回の保存分をすぐ返し、裏で最新版を取得して次回に反映する（stale-while-revalidate）。
// それ以外（Firebase通信・Google認証など）はそのままネットワークへ流す。
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isOwn = url.origin === self.location.origin;
  const isFirebaseSdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!isOwn && !isFirebaseSdk) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    if (cached) { event.waitUntil(network); return cached; }
    return network;
  })());
});

// 通知タップ時にアプリを前面に表示
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
