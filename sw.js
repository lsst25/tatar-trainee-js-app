const VERSION = 'v3';

self.addEventListener('install', event => event.waitUntil(installServiceWorker()));
self.addEventListener('fetch', event => event.respondWith(cacheThenNetwork(event)));

async function cacheThenNetwork(event) {

    const cache = await caches.open(VERSION);

    const cachedResponse = await cache.match(event.request);

    if (cachedResponse) {
        console.log('Serving From Cache: ' + event.request.url);
        return cachedResponse;
    }

    const networkResponse = await fetch(event.request);

    console.log('Calling network: ' + event.request.url);

    return networkResponse;
}


async function installServiceWorker() {

    console.log("Service Worker installation started ");

    const cache = await caches.open(VERSION);

    return cache.addAll([
        'index.html',
        'app.js',
        'style.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        'https://api.punkapi.com/v2/beers',
    ]);
}
