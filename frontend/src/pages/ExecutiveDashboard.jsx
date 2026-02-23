import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Bell, Search, LogOut, MapPin, Clock, BookOpen, Phone, Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import '../styles/Dashboard.css';

const ExecutiveDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [staffStatus, setStaffStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);

    useEffect(() => {
        fetchStaffStatus();
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchStaffStatus();
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchStaffStatus = async () => {
        try {
            const response = await api.get('/executive/staff-status');
            setStaffStatus(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching staff status:', error);
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/staff/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/staff/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const toggleNotifs = async () => {
        if (!showNotifs) {
            await fetchNotifications();
        }
        setShowNotifs(!showNotifs);
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/staff/notifications/${id}/read`);
            fetchUnreadCount();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMeetingRequest = async () => {
        if (!selectedStaff) return;

        setSendingRequest(true);
        try {
            const response = await api.post('/executive/meet', {
                staffId: selectedStaff._id
            });

            alert(`Meeting request sent successfully${response.data.coveredBy ? `. Class will be covered by ${response.data.coveredBy}` : ''}`);
            setShowMeetingModal(false);
            setSelectedStaff(null);
        } catch (error) {
            console.error('Error sending meeting request:', error);
            alert('Failed to send meeting request: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingRequest(false);
        }
    };

    const openMeetingModal = (staff) => {
        setSelectedStaff(staff);
        setShowMeetingModal(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredStaff = staffStatus.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
            case 'Tracking': return '#097969';
            case 'Late': return '#f59e0b';
            case 'Absent': return '#dc2626';
            case 'Left': return '#64748b';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
            case 'Tracking': return <CheckCircle size={16} />;
            case 'Late': return <AlertCircle size={16} />;
            case 'Absent': return <XCircle size={16} />;
            case 'Left': return <Clock size={16} />;
            default: return null;
        }
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'principal': return 'Principal';
            case 'secretary': return 'Secretary';
            case 'director': return 'Director of Academy';
            default: return role;
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', animation: 'fadeIn 0.6s ease-out' }}>
            {/* Top Navigation - Refined & Institutional */}
            <nav style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #f1f5f9',
                padding: '10px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Executive Portal
                    </h2>
                    <div style={{
                        background: '#0d745e',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                    }}>
                        {getRoleName(user?.role)}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {/* Live Indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#f1f5f9',
                        padding: '8px 20px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#1e293b'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        System Sync
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div onClick={toggleNotifs} style={{ position: 'relative', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#097969', color: 'white', fontSize: '10px', fontWeight: '700', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {showNotifs && (
                            <div style={{ position: 'absolute', top: '48px', right: '0', width: '320px', background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', zIndex: 1000, overflow: 'hidden' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: '800', fontSize: '15px' }}>Notifications</div>
                                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No new notifications</div>
                                    ) : notifications.map(n => (
                                        <div key={n._id} onClick={() => markAsRead(n._id)} style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', background: n.is_read ? 'transparent' : '#f0fdf9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{n.title}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>{n.message}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1.5px', height: '32px', background: '#e2e8f0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{user?.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>Administrative Access</div>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            <LogOut size={16} />
                            <span className="logout-text">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div style={{ padding: '40px 32px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Header Section - Refined */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ padding: '4px 10px', background: '#f0fdf9', color: '#097969', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Real-time Intelligence
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '20px', fontSize: '11px', color: '#475569', fontWeight: '800' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#097969', animation: 'pulse 2s infinite' }}></div>
                                Live Feed Active
                            </div>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Staff Command Center</h1>
                        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px', fontWeight: '600' }}>Welcome back, {user?.name}. Monitoring presence across all campus departments.</p>
                    </div>
                    <div className="search-wrapper" style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                background: 'white',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                outline: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            className="form-input"
                        />
                    </div>
                </div>

                {/* Dashboard Metrics - Standardized */}
                <div className="stats-grid" style={{ marginBottom: '48px' }}>
                    {[
                        { label: 'Total Staff', value: staffStatus.length, icon: <Users size={22} />, color: '#0f172a', accent: '#f1f5f9' },
                        { label: 'Verified Present', value: staffStatus.filter(s => s.currentStatus === 'Present' || s.currentStatus === 'Tracking').length, icon: <CheckCircle size={22} />, color: '#097969', accent: '#e6fcf9' },
                        { label: 'Late Entries', value: staffStatus.filter(s => s.currentStatus === 'Late').length, icon: <AlertCircle size={22} />, color: '#d97706', accent: '#fffbeb' },
                        { label: 'Absent/Left', value: staffStatus.filter(s => s.currentStatus === 'Absent' || s.currentStatus === 'Left').length, icon: <XCircle size={22} />, color: '#dc2626', accent: '#fef2f2' }
                    ].map((card, i) => (
                        <div key={i} className="stat-card" style={{
                            borderLeft: `6px solid ${card.color}`,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '32px 24px'
                        }}>
                            {/* Live Badge in Top Right */}
                            <div className="stat-badge" style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                color: card.color,
                                backgroundColor: card.accent,
                                fontWeight: '800',
                                letterSpacing: '0.05em'
                            }}>
                                LIVE
                            </div>

                            <div className="stat-icon-wrapper" style={{ color: card.color, backgroundColor: card.accent, margin: '0 auto' }}>
                                {card.icon}
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <div className="stat-value" style={{ fontSize: '48px', marginBottom: '8px' }}>{card.value}</div>
                                <div className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Personnel Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    {filteredStaff.map((staff) => {
                        const isOnline = staff.currentStatus === 'Tracking' || staff.currentStatus === 'Present';
                        const isAbsent = staff.currentStatus === 'Absent';
                        const isLate = staff.currentStatus === 'Late';
                        const isLeft = staff.currentStatus === 'Left';

                        const getTheme = () => {
                            if (isAbsent) return { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={14} /> };
                            if (isLate) return { bg: '#fffbeb', color: '#d97706', icon: <AlertCircle size={14} /> };
                            if (isLeft) return { bg: '#f1f5f9', color: '#64748b', icon: <Clock size={14} /> };
                            return { bg: '#f0f9ff', color: '#0ea5e9', icon: <Clock size={14} /> };
                        };
                        const theme = getTheme();

                        return (
                            <div key={staff._id} style={{
                                background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                            }} className="staff-card-hover">
                                <div style={{ padding: '24px', flex: 1 }}>
                                    {/* Card Top: Profile & Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{staff.name}</h3>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>{staff.department}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {theme.icon}
                                            {staff.currentStatus}
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '0 -24px 20px', padding: '20px 24px 0' }}>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {/* Expected Row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Clock size={16} color="#94a3b8" />
                                                <div style={{ fontSize: '14px', color: '#64748b' }}>
                                                    Expected: <span style={{ color: '#1e293b', fontWeight: '700' }}>{staff.expectedLocation || 'No Class Assigned'}</span>
                                                </div>
                                            </div>

                                            {/* Location Pill Row */}
                                            <div style={{
                                                background: staff.isCorrectLocation ? '#f0fdf4' : (isLeft ? '#f8fafc' : '#fff1f2'),
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                border: `1px solid ${staff.isCorrectLocation ? '#dcfce7' : (isLeft ? '#e2e8f0' : '#ffe4e6')}`
                                            }}>
                                                <MapPin size={16} color={staff.isCorrectLocation ? '#097969' : (isLeft ? '#94a3b8' : '#dc2626')} />
                                                <div style={{ fontSize: '14px', color: staff.isCorrectLocation ? '#065f46' : (isLeft ? '#64748b' : '#991b1b'), fontWeight: '700' }}>
                                                    {isAbsent ? 'Not on Campus' : isLeft ? 'Off Campus (Signal Lost)' : `Currently in ${staff.currentLocation}`}
                                                </div>
                                            </div>

                                            {/* Time Row */}
                                            {staff.lastSeen && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Clock size={16} color="#94a3b8" />
                                                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                                                        Last seen: {new Date(staff.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => openMeetingModal(staff)}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px' }}
                                    >
                                        <Phone size={16} />
                                        Initiate Request
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal - Redesigned for Premium Look */}
            {showMeetingModal && selectedStaff && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '28px', maxWidth: '480px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '32px 32px 24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#097969', marginBottom: '24px' }}>
                                <Phone size={24} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>Request Meeting</h2>
                            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                                Are you sure you want to request an immediate meeting with <strong style={{ color: '#0f172a' }}>{selectedStaff.name}</strong>?
                            </p>
                        </div>
                        <div style={{ padding: '0 32px 32px', display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowMeetingModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleMeetingRequest} style={{ flex: 1, padding: '14px', background: '#097969', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {sendingRequest ? <div className="loader-small"></div> : 'Confirm Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .staff-card-hover {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .staff-card-hover:hover { 
                    transform: translateY(-8px) scale(1.01); 
                    box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12); 
                    border-color: #0d745e40; 
                }
                .staff-card-hover::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -150%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    transition: all 0.8s ease;
                }
                .staff-card-hover:hover::after {
                    left: 150%;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loader-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
            `}} />
        </div>
    );
};

export default ExecutiveDashboard;
