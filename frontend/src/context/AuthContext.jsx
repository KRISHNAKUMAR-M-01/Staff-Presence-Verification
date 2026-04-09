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
                localStorage.clear(); // Clear corrupt data
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
    };

    const logout = async () => {
        // 1. Clear Local State IMMEDIATELY (Instant UI response)
        localStorage.clear();
        setToken(null);
        setUser(null);

        // 2. Stop Service Worker Beacon
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'BEACON_STOP' });
        }

        // 3. Inform Server in background (Don't await it, so user isn't stuck)
        try {
            api.post('/auth/logout').catch(err => console.error('Silent Logout Failed:', err));
        } catch (err) {
            // Catching potential synchronous errors in background call
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
