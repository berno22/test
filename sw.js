const CACHE_NAME = 'starlite-logos-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_LOGOS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache =>
        Promise.all(urls.map(url =>
          fetch(url)
            .then(res => { if (res.ok) return cache.put(url, res); })
            .catch(() => {})
        ))
      )
    );
  }
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('/logos/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
