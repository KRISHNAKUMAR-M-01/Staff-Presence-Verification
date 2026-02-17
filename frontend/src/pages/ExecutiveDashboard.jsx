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
            case 'Present': return '#097969';
            case 'Late': return '#f59e0b';
            case 'Absent': return '#dc2626';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <CheckCircle size={16} />;
            case 'Late': return <AlertCircle size={16} />;
            case 'Absent': return <XCircle size={16} />;
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
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Navigation Bar */}
            <nav style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>
                        Executive Portal
                    </h2>
                    <span style={{
                        background: 'linear-gradient(135deg, #097969 0%, #065f54 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        {getRoleName(user?.role)}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <Bell size={20} color="#64748b" />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#097969',
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
                    </div>
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{user?.name}</span>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                            e.currentTarget.style.borderColor = '#fecaca';
                        }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                        Staff Status Overview
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                        Real-time presence and location tracking for all staff members
                    </p>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ position: 'relative', maxWidth: '500px' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search by name or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 44px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#097969';
                                e.target.style.boxShadow = '0 0 0 3px rgba(9, 121, 105, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Statistics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={24} color="#64748b" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
                                {staffStatus.length}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Staff</p>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#ecfdf5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={24} color="#097969" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
                                {staffStatus.filter(s => s.currentStatus === 'Present').length}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Present</p>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={24} color="#f59e0b" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
                                {staffStatus.filter(s => s.currentStatus === 'Late').length}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Late</p>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <XCircle size={24} color="#dc2626" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
                                {staffStatus.filter(s => s.currentStatus === 'Absent').length}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Absent</p>
                        </div>
                    </div>
                </div>

                {/* Staff Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px'
                }}>
                    {filteredStaff.length === 0 ? (
                        <div style={{
                            gridColumn: '1 / -1',
                            background: 'white',
                            padding: '48px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>No staff members found</p>
                        </div>
                    ) : (
                        filteredStaff.map((staff) => (
                            <div key={staff._id} style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}>
                                {/* Header */}
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                                            {staff.name}
                                        </h3>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: getStatusColor(staff.currentStatus),
                                            background: `${getStatusColor(staff.currentStatus)}15`,
                                            flexShrink: 0
                                        }}>
                                            {getStatusIcon(staff.currentStatus)}
                                            {staff.currentStatus}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{staff.department}</p>
                                </div>

                                {/* Details */}
                                <div style={{ display: 'grid', gap: '8px', marginBottom: '14px', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {staff.currentLocation}
                                        </span>
                                    </div>
                                    {staff.lastSeen && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: '13px', color: '#475569' }}>
                                                {new Date(staff.lastSeen).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    {staff.activeClass && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'start',
                                            gap: '8px',
                                            padding: '10px',
                                            background: '#f8fafc',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <BookOpen size={14} color="#097969" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                                                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>
                                                    {staff.activeClass.subject}
                                                </div>
                                                <div style={{ color: '#64748b' }}>
                                                    {staff.activeClass.room} • {staff.activeClass.startTime} - {staff.activeClass.endTime}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => openMeetingModal(staff)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '10px 16px',
                                        background: '#097969',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        width: '100%'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#065f54'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#097969'}
                                >
                                    <Phone size={14} />
                                    Request Meeting
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Meeting Request Modal */}
            {showMeetingModal && selectedStaff && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setShowMeetingModal(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>
                                Request Meeting
                            </h2>
                            <button
                                onClick={() => setShowMeetingModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    padding: '0',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#475569' }}>
                                Send a meeting request to <strong style={{ color: '#0f172a' }}>{selectedStaff.name}</strong>?
                            </p>
                            {selectedStaff.activeClass && (
                                <div style={{
                                    padding: '16px',
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
                                        This staff member is currently teaching:
                                    </p>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e' }}>
                                        <strong>{selectedStaff.activeClass.subject}</strong> in <strong>{selectedStaff.activeClass.room}</strong>
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
                                        A free staff member will be automatically assigned to cover this class.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowMeetingModal(false)}
                                disabled={sendingRequest}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    color: '#475569',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMeetingRequest}
                                disabled={sendingRequest}
                                style={{
                                    padding: '10px 20px',
                                    background: '#097969',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: sendingRequest ? 0.6 : 1
                                }}
                            >
                                {sendingRequest ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboard;
