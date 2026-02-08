import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
    BarChart2,
    Calendar,
    Clipboard,
    Plane,
    Bell
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

// Module Imports
import StaffOverview from '../AttendanceAndAlerts/StaffOverview';
import MyAttendance from '../AttendanceAndAlerts/MyAttendance';
import MyLeaves from '../StaffAdministration/MyLeaves';
import MyTimetable from '../StaffAdministration/MyTimetable';

const StaffDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    const loadUnreadCount = async () => {
        const res = await api.get('/staff/notifications/unread-count');
        setUnreadCount(res.data.count);
    };

    const toggleNotifs = async () => {
        if (!showNotifs) {
            const res = await api.get('/staff/notifications');
            setNotifs(res.data);
        }
        setShowNotifs(!showNotifs);
    };

    const markAsRead = async (id) => {
        await api.put(`/staff/notifications/${id}/read`);
        loadUnreadCount();
        const res = await api.get('/staff/notifications');
        setNotifs(res.data);
    };

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const headerActions = (
        <div style={{ position: 'relative', marginRight: '8px' }}>
            <button
                onClick={toggleNotifs}
                style={{
                    background: '#f8fafc',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                <Bell size={20} color="#64748b" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '700',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showNotifs && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: 'min(320px, calc(100vw - 32px))',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    zIndex: 1000,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700' }}>Notifications</span>
                        <button onClick={() => setShowNotifs(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifs.length > 0 ? notifs.map(n => (
                            <div
                                key={n._id}
                                onClick={() => markAsRead(n._id)}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: n.is_read ? 'transparent' : '#f0fdf4',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{n.title}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{n.message}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                        )) : <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No notifications</div>}
                    </div>
                </div>
            )}
        </div>
    );

    const navItems = [
        { label: 'Dashboard', path: '/staff', icon: <BarChart2 size={20} /> },
        { label: 'My Timetable', path: '/staff/timetable', icon: <Calendar size={20} /> },
        { label: 'My Attendance', path: '/staff/attendance', icon: <Clipboard size={20} /> },
        { label: 'Leave Requests', path: '/staff/leaves', icon: <Plane size={20} /> },
    ];

    return (
        <DashboardLayout
            title="Staff Portal"
            userName={user.name}
            navItems={navItems}
            themeClass="staff-theme"
            brandColor="#10b981"
            headerActions={headerActions}
        >
            <Routes>
                <Route index element={<StaffOverview />} />
                <Route path="timetable" element={<MyTimetable />} />
                <Route path="attendance" element={<MyAttendance />} />
                <Route path="leaves" element={<MyLeaves />} />
                <Route path="*" element={<Navigate to="/staff" />} />
            </Routes>
        </DashboardLayout>
    );
};

export default StaffDashboard;
