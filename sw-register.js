if ('serviceWorker' in navigator) {
    window.addEventListener('load',  () => {
        navigator.serviceWorker.register('./sw.js', {
            scope: '/tatar-trainee-js-app/'
        })
            .then(registration => {
                console.log("Service Worker registration completed ...");
            });
    });
}
