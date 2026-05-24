// BugPulse Service Worker
const CACHE = 'bugpulse-sw-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'BugPulse', body: e.data.text() }; }

  const title   = data.title || 'BugPulse';
  const options = {
    body:    data.body || '',
    icon:    data.icon || 'https://cdn.octathorpeweb.com/v1/webstore/hitwicket-logo.png',
    badge:   'https://cdn.octathorpeweb.com/v1/webstore/hitwicket-logo.png',
    tag:     data.tag  || 'bugpulse',
    data:    { url: data.url || '/', bugId: data.bugId || '' },
    actions: data.bugId ? [{ action: 'open', title: 'Open Bug' }] : [],
    requireInteraction: data.critical || false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus existing tab if open
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (e.notification.data?.bugId) {
            client.postMessage({ type: 'OPEN_BUG', bugId: e.notification.data.bugId });
          }
          return;
        }
      }
      // Open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
