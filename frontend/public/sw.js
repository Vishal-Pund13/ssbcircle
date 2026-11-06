// SSBCircle service worker — phone notifications only. It does not cache
// pages, so it can never serve a stale version of the site.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// A push from the server: { title, body, url, tag }
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: e.data && e.data.text() }; }
  const title = data.title || 'SSBCircle';
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || undefined,          // a newer alert for the same thread replaces the older one
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  }));
});

// Tapping the notification opens (or focuses) the right page
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const tab of tabs) {
      if (tab.url.startsWith(self.location.origin)) {
        await tab.focus();
        return tab.navigate(url);
      }
    }
    return self.clients.openWindow(url);
  })());
});
