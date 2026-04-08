// Firebase Cloud Messaging Service Worker
// Handles background notifications when app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration — values must match your Netlify env vars
const firebaseConfig = {
    apiKey: "AIzaSyDf9z8k_1OIQQfGbyIR5nnEdRz9sFamjUg",
    authDomain: "ridehailing-521dd.firebaseapp.com",
    projectId: "ridehailing-521dd",
    storageBucket: "ridehailing-521dd.firebasestorage.app",
    messagingSenderId: "266809832322",
    appId: "1:266809832322:web:cc9178e95a9614b10cd59b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Handle background notifications
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/favicon.ico',
        data: payload.data,
        tag: 'help-request',
        requireInteraction: true, // Keep notification until user interacts
        actions: [
            {
                action: 'accept',
                title: 'Accept Help'
            },
            {
                action: 'ignore',
                title: 'Ignore'
            }
        ]
    };

    return self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);

    event.notification.close();

    if (event.action === 'accept') {
        // Open app with accept action
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Check if app is already open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('/') && 'focus' in client) {
                        // Post message to app with accept action
                        client.postMessage({
                            action: 'accept_help',
                            data: event.notification.data
                        });
                        return client.focus();
                    }
                }
                // If app not open, open it with query params so the page can parse request data
                if (clients.openWindow) {
                    const params = new URLSearchParams({
                        action: 'accept_help',
                        help_request_id: event.notification.data?.help_request_id || '',
                        requester_name: event.notification.data?.requester_name || '',
                        requester_location_lat: event.notification.data?.requester_location_lat || '',
                        requester_location_lng: event.notification.data?.requester_location_lng || ''
                    });
                    return clients.openWindow(`/?${params.toString()}`);
                }
            })
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[firebase-messaging-sw.js] Notification closed');
});
