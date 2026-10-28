'use strict';
const RELEASE = 'fbd283ad0ac88d8553a9';
const PREFIX = 'staff-academy-' + new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi, '_') + '-';
const CACHE = PREFIX + RELEASE;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './progress.js', './learning.js', './formula.js', './question-bank.js', './coffee-core.js', './coffee-visual.js', './coffee-ui.js', './coffee.css', './course-core.js', './course-data.js', './theory-mvp-data.js', './course-ui.js', './course.css', './navigation.js', './navigation.css', './assessment-bank.js', './testing-core.js', './testing-ui.js', './cocktails.js', './mix-core.js', './mixology.js', './mixology.css', './images/cocktail-missing.svg', './assets/cocktails/na-blueberry.webp', './assets/cocktails/na-sagan.webp', './assets/cocktails/sunset.webp', './assets/cocktails/forest.webp', './assets/cocktails/summer.webp', './assets/cocktails/gimlet.webp', './assets/cocktails/tundra.webp', './assets/cocktails/cranberry.webp', './assets/cocktails/unknown.webp', './assets/cocktails/fjord.webp', './assets/cocktails/south.webp', './assets/cocktails/negroni.webp', './images/na-blueberry.webp', './images/na-sagan.webp', './images/sunset.webp', './images/forest.webp', './images/summer.webp', './images/gimlet.webp', './images/tundra.webp', './images/cranberry.webp', './images/unknown.webp', './images/fjord.webp', './images/south.webp', './legacy-map.js', './pwa.js', './pwa.css', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
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
