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
        'https://api.punkapi.com/v2/beers?page=1&per_page=25',
        'https://images.punkapi.com/v2/keg.png',
        'https://images.punkapi.com/v2/2.png',
        'https://images.punkapi.com/v2/6.png',
        'https://images.punkapi.com/v2/7.png',
        'https://images.punkapi.com/v2/5.png',
        'https://images.punkapi.com/v2/4.png',
        'https://images.punkapi.com/v2/8.png',
        'https://images.punkapi.com/v2/10.png',
        'https://images.punkapi.com/v2/12.png',
        'https://images.punkapi.com/v2/9.png',
        'https://images.punkapi.com/v2/13.png',
        'https://images.punkapi.com/v2/14.png',
        'https://images.punkapi.com/v2/15.png',
        'https://images.punkapi.com/v2/17.png',
        'https://images.punkapi.com/v2/16.png',
        'https://images.punkapi.com/v2/19.png',
        'https://images.punkapi.com/v2/24.png',
        'https://images.punkapi.com/v2/18.png',
        'https://images.punkapi.com/v2/22.png',
        'https://images.punkapi.com/v2/23.png',
        'https://images.punkapi.com/v2/25.png',
    ]);
}
