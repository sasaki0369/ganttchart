// やることガントチャート 用 Service Worker
// 通知表示（showNotification）と、PWAインストール適格性を満たすための最小構成です。
// オフラインキャッシュ等は行わず、常にネットワークへそのまま流します。

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ブラウザのPWAインストール判定には「fetchイベントを制御しているService Worker」が
// 必要なため、キャッシュはせずそのままネットワークに流すだけのハンドラを用意する
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
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
