self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/logo192.png',
            badge: '/logo192.png',
            data: data.data || {}
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data.url || '/';

    event.waitUntil(
        clients.openWindow(url)
    );
});
