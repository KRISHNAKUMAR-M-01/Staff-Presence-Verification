// ============================================================
// SERVICE WORKER — Push Notifications + Soft Beacon
// ============================================================

const BEACON_API_URL = 'http://127.0.0.1:5000/api/staff/soft-beacon';

// ---- IndexedDB helpers (SWs cannot use localStorage) -------
const DB_NAME    = 'SoftBeaconDB';
const STORE_NAME = 'config';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
        req.onsuccess       = e => resolve(e.target.result);
        req.onerror         = e => reject(e.target.error);
    });
}
async function idbGet(key) {
    const db = await openDB();
    return new Promise(resolve => {
        db.transaction(STORE_NAME, 'readonly')
          .objectStore(STORE_NAME).get(key)
          .onsuccess = e => resolve(e.target.result);
    });
}
async function idbSet(key, value) {
    const db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = resolve;
    });
}
async function idbDelete(key) {
    const db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = resolve;
    });
}

// ---- Heartbeat sender --------------------------------------
async function sendHeartbeat() {
    const config = await idbGet('beacon');
    if (!config || !config.active || !config.classroom_id || !config.token) return;

    try {
        const res = await fetch(BEACON_API_URL, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`
            },
            body:      JSON.stringify({ classroom_id: config.classroom_id }),
            keepalive: true   // survives page close
        });

        if (!res.ok) {
            // Token expired or server error — auto-stop the beacon
            if (res.status === 401 || res.status === 403) {
                await idbDelete('beacon');
                broadcastToClients({ type: 'BEACON_TOKEN_EXPIRED' });
                return;
            }
        }

        const data = await res.json();

        // Update last-sent timestamp
        await idbSet('beacon', { ...config, lastSent: Date.now() });

        // Broadcast status update to all open tabs
        broadcastToClients({
            type:               'BEACON_UPDATE',
            attendance_status:  data.attendance_status,
            duration_minutes:   data.duration_minutes ?? 0,
            beacon_status:      data.status
        });

        console.log('[SW Beacon] ❤️ Heartbeat OK:', data.attendance_status);
    } catch (err) {
        console.error('[SW Beacon] Heartbeat error:', err.message);
    }
}

function broadcastToClients(message) {
    self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage(message))
    );
}

// ---- Messages from page ------------------------------------
self.addEventListener('message', async event => {
    const { type, config } = event.data || {};

    if (type === 'BEACON_START') {
        await idbSet('beacon', {
            active:      true,
            classroom_id: config.classroom_id,
            token:        config.token,
            lastSent:     0
        });
        // First heartbeat immediately
        await sendHeartbeat();
        event.source?.postMessage({ type: 'BEACON_STARTED' });
        console.log('[SW Beacon] 🟢 Started for classroom:', config.classroom_id);
    }

    if (type === 'BEACON_STOP') {
        await idbDelete('beacon');
        broadcastToClients({ type: 'BEACON_STOPPED' });
        console.log('[SW Beacon] 🔴 Stopped.');
    }

    if (type === 'BEACON_GET_STATUS') {
        const cfg = await idbGet('beacon');
        event.source?.postMessage({
            type:         'BEACON_STATUS',
            active:       !!(cfg?.active),
            classroom_id: cfg?.classroom_id || null,
            lastSent:     cfg?.lastSent     || 0
        });
    }
});

// ---- Keepalive fetch interception --------------------------
// The page pings /sw-keepalive every ~25s.
// The SW intercepts it, sends a heartbeat if 30s have passed,
// and keeps itself from being terminated.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.pathname === '/sw-keepalive') {
        event.respondWith(
            (async () => {
                const config = await idbGet('beacon');
                if (config?.active) {
                    const now     = Date.now();
                    const elapsed = now - (config.lastSent || 0);
                    if (elapsed >= 30000) {
                        // Extend SW lifetime during this async work
                        event.waitUntil(sendHeartbeat());
                    }
                }
                return new Response(
                    JSON.stringify({ active: !!(config?.active) }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })()
        );
        return; // Don't fall through to push/notification handlers
    }
});

// ---- Lifecycle --------------------------------------------
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

// ============================================================
// PUSH NOTIFICATIONS (existing functionality — unchanged)
// ============================================================

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body:  data.body,
            icon:  data.icon  || '/logo192.png',
            badge: '/logo192.png',
            data:  data.data  || {}
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data.url || '/';
    event.waitUntil(clients.openWindow(url));
});
