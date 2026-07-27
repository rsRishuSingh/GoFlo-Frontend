// Firebase Cloud Messaging Service Worker
// Handles background notifications when app is not in focus
// Config is injected dynamically from the main app — no hardcoded values needed.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase will be initialized once we receive config from the main app
let isFirebaseInitialized = false;

/**
 * Initialize Firebase with config received from the main app.
 * This avoids hardcoding credentials in the service worker.
 */
function initializeFirebase(config) {
    if (isFirebaseInitialized) return;

    try {
        firebase.initializeApp(config);
        isFirebaseInitialized = true;
        console.log('[firebase-messaging-sw.js] Firebase initialized with dynamic config');

        // Set up background message handler after initialization
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
    } catch (error) {
        console.error('[firebase-messaging-sw.js] Firebase initialization error:', error);
    }
}

// Listen for config message from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        console.log('[firebase-messaging-sw.js] Received Firebase config from main app');
        initializeFirebase(event.data.config);
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);

    event.notification.close();

    // If user explicitly clicked the "Ignore" action button, just close it.
    if (event.action === 'ignore') {
        return;
    }

    // For both "Accept" action and tapping the notification body, open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('/') && 'focus' in client) {
                    // Post message to app to open the help request
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
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[firebase-messaging-sw.js] Notification closed');
});
