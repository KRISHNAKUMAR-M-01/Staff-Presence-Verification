// ============================================================
// SERVICE WORKER — Static Caching + Push Notifications + Soft Beacon
// ============================================================

const CACHE_NAME = 'spv-portal-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap'
];

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
        await idbSet('beacon', { ...config, lastSent: Date.now() });
        broadcastToClients({
            type:               'BEACON_UPDATE',
            attendance_status:  data.attendance_status,
            duration_minutes:   data.duration_minutes ?? 0,
            beacon_status:      data.status
        });
    } catch (err) {
        console.error('[SW Beacon] Heartbeat error:', err.message);
    }
}

function broadcastToClients(message) {
    self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage(message))
    );
}

// ---- Lifecycle & Caching --------------------------------------------
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching static assets...');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ---- Fetch & Hybrid Strategy --------------------------------------------
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Keepalive / Soft Beacon heartbeats
    if (url.pathname === '/sw-keepalive') {
        event.respondWith(
            (async () => {
                const config = await idbGet('beacon');
                if (config?.active) {
                    const now     = Date.now();
                    const elapsed = now - (config.lastSent || 0);
                    if (elapsed >= 30000) {
                        event.waitUntil(sendHeartbeat());
                    }
                }
                return new Response(JSON.stringify({ active: !!(config?.active) }), { headers: { 'Content-Type': 'application/json' } });
            })()
        );
        return;
    }

    // 2. Cache-First for Fonts and Symbols
    if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(networkResponse => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. Network-First for App Components (Dynamic updates)
    // Avoid caching /api/ or dev-server specific files
    if (url.pathname.startsWith('/api/') || url.pathname.includes('chrome-extension')) {
        return;
    }

    // Default Cache Strategy for Images/Statics
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// ---- Messages & Push ------------------------------------
self.addEventListener('message', async event => {
    const { type, config } = event.data || {};
    if (type === 'BEACON_START') {
        await idbSet('beacon', { active: true, classroom_id: config.classroom_id, token: config.token, lastSent: 0 });
        await sendHeartbeat();
        event.source?.postMessage({ type: 'BEACON_STARTED' });
    }
    if (type === 'BEACON_STOP') {
        await idbDelete('beacon');
        broadcastToClients({ type: 'BEACON_STOPPED' });
    }
    if (type === 'BEACON_GET_STATUS') {
        const cfg = await idbGet('beacon');
        event.source?.postMessage({ type: 'BEACON_STATUS', active: !!(cfg?.active), classroom_id: cfg?.classroom_id || null, lastSent: cfg?.lastSent || 0 });
    }
});

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body:  data.body,
                icon:  data.icon  || '/favicon.svg',
                badge: '/favicon.svg',
                data:  data.data  || {}
            };
            event.waitUntil(self.registration.showNotification(data.title, options));
        } catch (e) {
            console.error('[SW Push] Error parsing payload:', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
