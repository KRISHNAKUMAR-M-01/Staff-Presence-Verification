import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'https://staff-presence-backend.onrender.com') + '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle token expiration/invalidation
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Prevent redirect loops on the login page itself
            if (window.location.pathname !== '/login') {
                const token = localStorage.getItem('token');
                if (token) {
                    // Fire-and-forget server logout to release the session lock
                    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://staff-presence-backend.onrender.com') + '/api';
                    fetch(`${baseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        keepalive: true
                    }).catch(() => {});
                }
                
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
