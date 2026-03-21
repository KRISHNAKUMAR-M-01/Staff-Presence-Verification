import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
    BarChart2,
    Calendar,
    Clipboard,
    Plane,
    Bell,
    X
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

// Module Imports
import StaffOverview from '../AttendanceAndAlerts/StaffOverview';
import MyAttendance from '../AttendanceAndAlerts/MyAttendance';
import MyLeaves from '../StaffAdministration/MyLeaves';
import MyTimetable from '../StaffAdministration/MyTimetable';
import CustomSelect from '../components/CustomSelect';

const StaffDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    // Swap Modal State
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [classrooms, setClassrooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [swapReason, setSwapReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadUnreadCount = async () => {
        try {
            const res = await api.get('/staff/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch (e) { console.error(e); }
    };

    const toggleNotifs = async () => {
        if (!showNotifs) {
            try {
                const res = await api.get('/staff/notifications');
                setNotifs(res.data);
            } catch (e) { console.error(e); }
        }
        setShowNotifs(!showNotifs);
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/staff/notifications/${id}/read`);
            loadUnreadCount();
            const res = await api.get('/staff/notifications');
            setNotifs(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSwapRequest = async () => {
        if (!selectedRoomId || !swapReason) return alert('Please select a room and provide a reason.');
        setSubmitting(true);
        try {
            const res = await api.post('/staff/swap-request', {
                classroom_id: selectedRoomId,
                reason: swapReason
            });
            alert(res.data.message);
            setShowSwapModal(false);
            setSwapReason('');
            setSelectedRoomId('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        loadUnreadCount();
        const loadClassrooms = async () => {
            try {
                const res = await api.get('/staff/classrooms');
                setClassrooms(res.data);
            } catch (e) { console.error(e); }
        };
        loadClassrooms();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const headerActions = (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginRight: '8px' }}>
            <button
                onClick={() => setShowSwapModal(true)}
                style={{
                    background: '#e6fcf5',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#097969',
                    fontSize: '13px',
                    fontWeight: '700',
                    transition: 'all 0.2s'
                }}
            >
                Swap Class
            </button>

            <div style={{ position: 'relative' }}>
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
                            <button onClick={() => setShowNotifs(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={14}/></button>
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
                                    
                                    {n.type === 'substitution_request' && !n.is_read && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                api.post('/staff/accept-substitution', { swap_request_id: n.related_data.swapRequestId })
                                                    .then(res => {
                                                        alert(res.data.message);
                                                        markAsRead(n._id);
                                                    }).catch(err => alert(err.response?.data?.error || 'Failed'));
                                            }}
                                            style={{ marginTop: '8px', padding: '6px 14px', background: '#097969', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Accept Substitution
                                        </button>
                                    )}

                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                </div>
                            )) : <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No notifications</div>}
                        </div>
                    </div>
                )}
            </div>
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
            brandColor="#097969"
            headerActions={headerActions}
        >
            <Routes>
                <Route index element={<StaffOverview />} />
                <Route path="timetable" element={<MyTimetable />} />
                <Route path="attendance" element={<MyAttendance />} />
                <Route path="leaves" element={<MyLeaves />} />
                <Route path="*" element={<Navigate to="/staff" />} />
            </Routes>

            {showSwapModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Urgent Swap Request</h3>
                                <button onClick={() => setShowSwapModal(false)} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20}/></button>
                            </div>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>Request permission for an urgent swap. On approval, you can search for substitutes.</p>
                            
                                <CustomSelect 
                                    label="Select Classroom"
                                    options={classrooms.map(c => ({ label: c.room_name, value: c._id }))}
                                    value={selectedRoomId}
                                    onChange={setSelectedRoomId}
                                    placeholder="Choose room..."
                                    required
                                />

                            <div style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>Reason for Urgency</label>
                                <textarea 
                                    placeholder="E.g. Medical emergency, urgent family matter..."
                                    value={swapReason}
                                    onChange={(e) => setSwapReason(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', minHeight: '100px', outline: 'none', fontSize: '14px', fontWeight: '500' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button onClick={() => setShowSwapModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#f1f5f9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>Cancel</button>
                                <button 
                                    onClick={handleSwapRequest}
                                    style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: '#097969', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(9, 121, 105, 0.3)' }}
                                >
                                    {submitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StaffDashboard;
