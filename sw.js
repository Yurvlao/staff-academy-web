'use strict';
const RELEASE = 'bfd8ef34da394647db0d';
const PREFIX = 'staff-academy-' + new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi, '_') + '-';
const CACHE = PREFIX + RELEASE;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './progress.js', './learning.js', './legacy-map.js', './pwa.js', './pwa.css', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    // Failed installation leaves the active worker and its complete cache intact.
    await cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
  }));
});
self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const legacyNetlify = new URL(self.registration.scope).pathname === '/' && self.location.origin.endsWith('.netlify.app');
    await Promise.all(keys.filter(key => (key.startsWith(PREFIX) && key !== CACHE) || (legacyNetlify && key === 'staff-trainer-v4')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  url.search = ''; url.hash = '';
  const appRoot = new URL('./', self.registration.scope).href;
  const index = new URL('./index.html', self.registration.scope).href;
  if (!assetURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Coherent release cache; build embeds a new worker version for every asset change.
    const key = event.request.mode === 'navigate' && (url.href === appRoot || url.href === index) ? index : url.href;
    return (await cache.match(key)) || fetch(event.request);
  })());
});
