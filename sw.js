const VERSION = 'v3';

self.addEventListener('install', event => event.waitUntil(installServiceWorker()));


async function installServiceWorker() {

    console.log("Service Worker installation started ");

    const cache = await caches.open(VERSION);

    return cache.addAll([
        'tatar-trainee-js-app/',
        'index.html',
        'app.js',
        'style.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        'https://api.punkapi.com/v2/beers',
    ]);
}
