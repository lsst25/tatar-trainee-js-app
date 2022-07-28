const VERSION = 'v5';

self.addEventListener('install', event => event.waitUntil(installServiceWorker()));
self.addEventListener('fetch', event => event.respondWith(cacheThenNetwork(event)));
self.addEventListener('activate', () => activateSW());

async function activateSW() {

    console.log('Service Worker activated');

    const cacheKeys = await caches.keys();

    cacheKeys.forEach(cacheKey => {
        if (cacheKey !== VERSION ) {
            caches.delete(cacheKey);
        }
    });
}


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
        'https://lsst25.github.io/tatar-trainee-js-app/',
        'index.html',
        'app.js',
        'style.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        'https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXg.woff2',
        'https://api.punkapi.com/v2/beers',
        'https://fonts.googleapis.com/css2?family=Lato&family=Montserrat:wght@100;400&family=Playfair+Display&display=swap',
        'https://lsst25.github.io/tatar-trainee-js-app/sw-register.js',
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
