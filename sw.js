// Service worker for Iun's Word Study (PWA).
// The deploy workflow replaces __BUILD_VERSION__, so every deploy installs a fresh worker and cache.
const CACHE_NAME = 'spell-__BUILD_VERSION__';
const APP_SHELL = ['./', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
// Third-party files the page needs to render (styles, icons, fonts), kept for offline use.
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key.startsWith('spell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // The page itself: always try the network first so updates (and the auto-reload check) see the
    // latest version; fall back to the cached copy when offline.
    if (request.mode === 'navigate') {
        const shellKey = new URL('./', self.registration.scope).href;
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(shellKey, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(shellKey))
        );
        return;
    }

    if (url.origin === self.location.origin) {
        // version.json drives the auto-reload check and the manifests decide how the app is installed:
        // always fetch these from the network.
        if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js') || url.pathname.endsWith('.webmanifest')) return;
        event.respondWith(
            caches.match(request).then(cached => {
                const network = fetch(request).then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                });
                return cached || network;
            })
        );
        return;
    }

    if (CDN_HOSTS.includes(url.hostname)) {
        // Serve the cached copy at once and refresh it in the background.
        event.respondWith(
            caches.match(request).then(cached => {
                const network = fetch(request).then(response => {
                    if (response.ok || response.type === 'opaque') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                }).catch(() => cached);
                return cached || network;
            })
        );
    }
    // Everything else (e.g. the Gemini API) goes straight to the network.
});
