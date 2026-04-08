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

    const [freeStaff, setFreeStaff] = useState([]);
    const [searching, setSearching] = useState(false);

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

    const findFreeStaff = async (roomId) => {
        if (!roomId) return;
        setSearching(true);
        try {
            const res = await api.get('/staff/find-free-staff');
            setFreeStaff(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleRoomChange = (roomId) => {
        setSelectedRoomId(roomId);
        findFreeStaff(roomId);
    };

    const handlePeerRequest = async (targetStaffId) => {
        if (!swapReason) return alert('Please provide a reason for the substitution.');
        setSubmitting(true);
        try {
            const res = await api.post('/api/staff/request-substitution', {
                target_staff_id: targetStaffId,
                classroom_id: selectedRoomId,
                reason: swapReason
            });
            alert(res.data.message);
            setShowSwapModal(false);
            setSwapReason('');
            setSelectedRoomId('');
            setFreeStaff([]);
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
                <span>Assign Substitute</span>
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
                        position: window.innerWidth <= 768 ? 'fixed' : 'absolute',
                        top: window.innerWidth <= 768 ? '70px' : '50px',
                        right: window.innerWidth <= 768 ? '16px' : '0',
                        left: window.innerWidth <= 768 ? '16px' : 'auto',
                        width: window.innerWidth <= 768 ? 'auto' : '320px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        zIndex: 1001,
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '28px', maxWidth: 'min(500px, 100%)', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                        <div className="modal-compact" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Find Substitute</h3>
                                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Search for free colleagues to cover your class</p>
                                </div>
                                <button onClick={() => setShowSwapModal(false)} style={{ border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><X size={20}/></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <CustomSelect 
                                    label="Select Your Classroom"
                                    options={classrooms.map(c => ({ label: c.room_name, value: c._id }))}
                                    value={selectedRoomId}
                                    onChange={handleRoomChange}
                                    placeholder="Which class needs cover?"
                                    required
                                />

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>Reason for Urgency</label>
                                    <textarea 
                                        placeholder="Reason for requesting substitution..."
                                        value={swapReason}
                                        onChange={(e) => setSwapReason(e.target.value)}
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', minHeight: '80px', outline: 'none', fontSize: '14px', fontWeight: '500', resize: 'none' }}
                                    />
                                </div>

                                {selectedRoomId && (
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Available Staff (Free Now)</h4>
                                        
                                        {searching ? (
                                            <div style={{ textAlign: 'center', padding: '10px', color: '#64748b', fontSize: '14px' }}>Searching...</div>
                                        ) : freeStaff.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {freeStaff.map(s => (
                                                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{s.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{s.department}</div>
                                                        </div>
                                                        <button 
                                                            disabled={submitting}
                                                            onClick={() => handlePeerRequest(s._id)}
                                                            style={{ padding: '8px 16px', background: '#097969', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            Request
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '10px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>No free staff found for this slot.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setShowSwapModal(false)} style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px', border: 'none', background: '#f1f5f9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StaffDashboard;
