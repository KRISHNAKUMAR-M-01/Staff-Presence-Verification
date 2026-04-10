import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error('Failed to parse user data:', err);
                localStorage.clear();
            }
        }
        setLoading(false);

        // --- NEW: TAB CLOSE DETECTION ---
        const handleTabClose = () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Match the exact base URL logic used in services/api.js
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://staff-presence-backend.onrender.com';
                const logoutUrl = `${baseUrl}/api/auth/logout`;
                
                fetch(logoutUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    keepalive: true
                }).catch(() => {}); // Silently fail on tab close
            }
        };

        window.addEventListener('beforeunload', handleTabClose);
        return () => window.removeEventListener('beforeunload', handleTabClose);
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        // Capture the token before it gets wiped out
        const currentToken = token || localStorage.getItem('token');

        // 1. Clear local session IMMEDIATELY for instant UI feedback
        localStorage.clear();
        setToken(null);
        setUser(null);

        // 2. Stop the beacon in the background
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'BEACON_STOP' });
        }

        // 3. Sync with server in the background (don't wait for it)
        if (currentToken) {
            api.post('/auth/logout', {}, {
                headers: { Authorization: `Bearer ${currentToken}` }
            }).catch(err => console.error('Background logout sync failed:', err));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
