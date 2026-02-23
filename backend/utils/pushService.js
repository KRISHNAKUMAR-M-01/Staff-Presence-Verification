const webpush = require('web-push');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
    console.error('❌ Web Push VAPID keys are missing in .env file');
}

const sendPushNotification = async (subscription, payload) => {
    try {
        if (!subscription) return;

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );
        console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error);
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription has expired or is no longer valid
            return { error: 'stale', details: error };
        }
    }
};

module.exports = { sendPushNotification };
