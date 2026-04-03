import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(val =>
    val && val !== 'undefined' && typeof val === 'string' && val.trim() !== ''
);

let messaging = null;

if (isFirebaseConfigured) {
    try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
} else {
    console.warn('Firebase configuration is incomplete. Please add Firebase credentials to .env file.');
}

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('userToken')}`,
});

/**
 * Initialize Firebase Cloud Messaging
 * Registers service worker and requests notification permission
 * @param {string} userType - 'user' or 'captain'
 */
export const initFCM = async (userType = 'user') => {
    try {
        if (!messaging) {
            console.error('Firebase messaging not initialized. Check your .env configuration.');
            return null;
        }

        // Register service worker for background notifications
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get device token using VAPID key
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
            console.log('FCM Token generated:', token);
            // Send token to backend
            await registerDeviceToken(token, userType);
            return token;
        } else {
            console.log('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error initializing FCM:', error);
        return null;
    }
};

/**
 * Register device token with backend
 * @param {string} token - Firebase device token
 * @param {string} userType - 'user' or 'captain'
 */
export const registerDeviceToken = async (token, userType = 'user') => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/help/register-user-device`,
            { deviceToken: token },
            { headers: getAuthHeaders() }
        );
        console.log('Device token registered:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error registering device token:', error);
    }
};

/**
 * Listen for incoming messages (foreground only)
 */
export const listenToMessages = (onMessageReceived) => {
    if (!messaging) {
        console.error('Firebase messaging not initialized');
        return;
    }

    onMessage(messaging, (payload) => {
        console.log('[Foreground Message] Received:', payload);

        // Extract notification data
        if (payload.notification) {
            const { title, body } = payload.notification;
            const data = payload.data || {};

            const notification = {
                title,
                body,
                data,
            };

            // Call the callback with notification data
            if (onMessageReceived) {
                onMessageReceived(notification);
            }
        }
    });
};

// Handle notification click events
export const handleNotificationClick = (notification, navigate, acceptHelpRequest) => {
    if (notification?.data?.action === "open_help_request") {
        const helpRequestData = {
            helpRequestId: notification.data.help_request_id,
            requesterName: notification.data.requester_name,
            requesterLocation: {
                type: "Point",
                coordinates: [
                    parseFloat(notification.data.requester_location_lng),
                    parseFloat(notification.data.requester_location_lat),
                ],
            },
            acceptorsCount: 0,
        };

        // Trigger acceptHelpRequest and navigate to HelpInProgressPanel
        acceptHelpRequest(helpRequestData);
        navigate("/help-in-progress");
    }
};

export default messaging;
