const VAPID_PUBLIC_KEY = 'BACHwC0NuUob0AesgYvvyKSf2K2oseyrSESMN3yuvImJ9lxVMDAKtJOEcZvb1CG3tOaMONxmfDdPNsxmvS0cMeo';

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered with scope:', registration.scope);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
};

export const subscribeToPush = async (registration) => {
    try {
        // Explicitly request permission
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);

        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return null;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
    }
};

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const saveSubscription = async (subscription, token) => {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/subscribe`, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Subscription saved to backend');
    } catch (error) {
        console.error('Error saving subscription:', error);
    }
};
