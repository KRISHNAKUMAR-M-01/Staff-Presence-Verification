import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Bell, Search, LogOut, MapPin, Clock, BookOpen, Phone, Users, CheckCircle, AlertCircle, XCircle, ChevronLeft, Plane, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot, Building2 } from 'lucide-react';
import '../styles/Dashboard.css';
import LeaveManagement from '../StaffAdministration/LeaveManagement';
import AttendanceReports from '../AttendanceAndAlerts/AttendanceReports';

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
    const [selectedDept, setSelectedDept] = useState(null);
    const [view, setView] = useState('status'); // 'status', 'leaves', 'attendance'
    const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
    const [approvedLeavesCount, setApprovedLeavesCount] = useState(0);
    const [rejectedLeavesCount, setRejectedLeavesCount] = useState(0);

    useEffect(() => {
        fetchStaffStatus();
        fetchNotifications();
        fetchUnreadCount();
        loadPendingLeaves();

        const interval = setInterval(() => {
            fetchStaffStatus();
            fetchUnreadCount();
            loadPendingLeaves();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadPendingLeaves = async () => {
        try {
            const response = await api.get('/admin/leaves');
            const data = response.data || [];
            
            // Exclude leaves whose end_date has already passed (expired/stale)
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            const validData = data.filter(l => new Date(l.end_date) >= todayMidnight || l.status === 'approved' || l.status === 'rejected');

            // For Executives, we care about 'pending' status
            const isExecutiveRole = ['principal', 'secretary', 'director'].includes(user?.role);
            const statusToWatch = isExecutiveRole ? 'pending' : 'approved_by_principal';
            
            const pending = validData.filter(l => l.status === statusToWatch).length;
            const approved = validData.filter(l => l.status === 'approved').length;
            const rejected = validData.filter(l => l.status === 'rejected').length;
            
            setPendingLeavesCount(pending);
            setApprovedLeavesCount(approved);
            setRejectedLeavesCount(rejected);
        } catch (error) {
            console.error('Error fetching leave stats:', error);
        }
    };

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

    const filteredStaff = staffStatus.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = !selectedDept || staff.department === selectedDept;
        return matchesSearch && matchesDept;
    });

    const departments = [...new Set(staffStatus.map(s => s.department))].sort();

    const getDeptColor = (dept) => {
        const colors = {
            "Aeronautical Engineering": "#0284c7", // Sky Blue
            "Agricultural Engineering": "#059669", // Emerald
            "Artificial Intelligence and Data Science": "#7c3aed", // Violet
            "Automobile Engineering": "#dc2626", // Red
            "Biomedical Engineering": "#db2777", // Pink
            "Chemical Engineering": "#d97706", // Amber
            "Civil Engineering": "#92400e", // Brown
            "Computer Science and Business Systems": "#4f46e5", // Indigo
            "Computer Science and Engineering": "#2563eb", // Blue
            "Electrical and Electronics Engineering": "#eab308", // Yellow
            "Electronics and Communication Engineering": "#e11d48", // Rose
            "Information Technology": "#0891b2", // Cyan
            "Mechanical Engineering": "#475569", // slate
            "Mechatronics Engineering": "#c026d3", // Fuchsia
        };
        return colors[dept] || "#097969";
    };

    const getDeptIcon = (dept) => {
        const deptColor = getDeptColor(dept);
        const iconProps = { size: 24, color: deptColor };
        switch (dept) {
            case "Aeronautical Engineering": return <Plane {...iconProps} />;
            case "Agricultural Engineering": return <Sprout {...iconProps} />;
            case "Artificial Intelligence and Data Science": return <Brain {...iconProps} />;
            case "Automobile Engineering": return <Car {...iconProps} />;
            case "Biomedical Engineering": return <Activity {...iconProps} />;
            case "Chemical Engineering": return <FlaskConical {...iconProps} />;
            case "Civil Engineering": return <Compass {...iconProps} />;
            case "Computer Science and Business Systems": return <Code {...iconProps} />;
            case "Computer Science and Engineering": return <Monitor {...iconProps} />;
            case "Electrical and Electronics Engineering": return <Zap {...iconProps} />;
            case "Electronics and Communication Engineering": return <Cpu {...iconProps} />;
            case "Information Technology": return <Globe {...iconProps} />;
            case "Mechanical Engineering": return <Settings {...iconProps} />;
            case "Mechatronics Engineering": return <Bot {...iconProps} />;
            default: return <Building2 {...iconProps} />;
        }
    };

    const statsStaff = selectedDept ? staffStatus.filter(s => s.department === selectedDept) : staffStatus;
    const currentDeptColor = selectedDept ? getDeptColor(selectedDept) : "#097969";

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
            {/* Top Navigation */}
            <nav className="dashboard-nav" style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #f1f5f9',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Executive Portal
                    </h2>
                    <div style={{
                        background: currentDeptColor,
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        transition: 'background-color 0.4s ease'
                    }}>
                        {getRoleName(user?.role)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    <button 
                        onClick={() => setView('status')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: view === 'status' ? 'white' : 'transparent',
                            color: view === 'status' ? '#0f172a' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: view === 'status' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Personnel Status
                    </button>
                    <button 
                        onClick={() => setView('leaves')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: view === 'leaves' ? 'white' : 'transparent',
                            color: view === 'leaves' ? '#0f172a' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: view === 'leaves' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        Leave Management
                        {pendingLeavesCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-4px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: '800',
                                minWidth: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                            }}>
                                {pendingLeavesCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setView('attendance')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: view === 'attendance' ? 'white' : 'transparent',
                            color: view === 'attendance' ? '#0f172a' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: view === 'attendance' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Attendance Reports
                    </button>
                </div>

                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="sync-status" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f1f5f9',
                        padding: '8px 16px',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#1e293b'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        System Sync
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div onClick={toggleNotifs} style={{ position: 'relative', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#097969', color: 'white', fontSize: '9px', fontWeight: '700', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {showNotifs && (
                            <div className="notifs-dropdown" style={{ position: 'absolute', top: '40px', right: '0', width: '300px', background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', zIndex: 1000, overflow: 'hidden' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: '800', fontSize: '14px' }}>Notifications</div>
                                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>No new notifications</div>
                                    ) : notifications.map(n => (
                                        <div key={n._id} onClick={() => markAsRead(n._id)} style={{ padding: '12px 20px', borderBottom: '1px solid #f8fafc', background: n.is_read ? 'transparent' : '#f0fdf9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{n.title}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>{n.message}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="nav-divider" style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-info" style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.01em' }}>{user?.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Admin Access</div>
                        </div>
                        <button onClick={handleLogout} className="logout-btn" style={{ padding: '8px 14px' }}>
                            <LogOut size={14} />
                            <span className="logout-text">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div style={{ padding: '40px 32px', maxWidth: '1600px', margin: '0 auto' }}>
                {view === 'status' && (
                    <div className="section-header-flex" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '16px', 
                        flexWrap: 'wrap', 
                        gap: '12px' 
                    }}>
                        <div className="header-title-group" style={{ flex: '0 1 auto', minWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ padding: '4px 10px', background: '#f0fdf9', color: '#097969', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Real-time Intelligence
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '20px', fontSize: '10px', color: '#475569', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#097969', animation: 'pulse 2s infinite' }}></div>
                                    Live Feed Active
                                </div>
                            </div>
                            <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Staff Command Center</h1>
                            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>
                                {selectedDept ? (
                                    <span>Monitoring staff in <span style={{ color: '#0f172a', fontWeight: '900' }}>{selectedDept}</span></span>
                                ) : `Welcome back, ${user?.name}. Global tracking active.`}
                            </p>
                        </div>

                        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: '0 1 auto', justifyContent: 'flex-end' }}>
                            {selectedDept && (
                                <button
                                    onClick={() => setSelectedDept(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 18px',
                                        background: 'white',
                                        border: `1.5px solid ${currentDeptColor}20`,
                                        borderRadius: '14px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#475569',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </button>
                            )}
                            <div className="search-container" style={{ position: 'relative', flex: '1 1 300px' }}>
                                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <input
                                    type="text"
                                    placeholder="Search Personnel..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 44px',
                                        background: 'white',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '14px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        outline: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard Metrics */}
                {view === 'status' && (
                    <div className="stats-grid dashboard-stats-grid" style={{
                        marginBottom: '32px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, 320px)',
                        gap: '24px',
                        justifyContent: 'flex-start'
                    }}>
                        {[
                            { label: 'Live Tracking Staffs', value: statsStaff.filter(s => s.currentStatus === 'Present' || s.currentStatus === 'Tracking').length, icon: <Activity size={24} />, color: '#097969', accent: '#e6fcf9' },
                            { label: 'Absent on Leave', value: statsStaff.filter(s => s.currentStatus === 'On Leave').length, icon: <Plane size={24} />, color: '#d97706', accent: '#fffbeb' }
                        ].map((card, i) => (
                            <div key={i} className="stat-card" style={{
                                borderLeft: `6px solid ${card.color}`,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '40px 32px'
                            }}>
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
                                <div className="stat-icon-wrapper" style={{ 
                                    width: '56px',
                                    height: '56px',
                                    color: i === 0 && selectedDept ? currentDeptColor : card.color, 
                                    backgroundColor: i === 0 && selectedDept ? `${currentDeptColor}15` : card.accent, 
                                    margin: '0 auto' 
                                }}>
                                    {i === 0 && selectedDept ? getDeptIcon(selectedDept) : React.cloneElement(card.icon, { size: 28 })}
                                </div>
                                <div style={{ marginTop: '28px' }}>
                                    <div className="stat-value" style={{ fontSize: '56px', marginBottom: '10px', color: '#0f172a' }}>{card.value}</div>
                                    <div className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '13px', fontWeight: '800', color: '#64748b' }}>{card.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Personnel Grid / Department Grid */}
                {view === 'status' ? (
                    <>
                        {!selectedDept && !searchTerm ? (
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                                {departments.map(dept => (
                                    <div
                                        key={dept}
                                        className="form-card"
                                        onClick={() => setSelectedDept(dept)}
                                        style={{
                                            margin: 0,
                                            cursor: 'pointer',
                                            padding: '32px',
                                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            border: '1.5px solid #f1f5f9',
                                            background: 'white',
                                            borderRadius: '24px',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                            e.currentTarget.style.borderColor = '#09796940';
                                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.05)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = '#f1f5f9';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '20px',
                                                background: `${getDeptColor(dept)}10`,
                                                color: getDeptColor(dept),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 4px 12px ${getDeptColor(dept)}15`
                                            }}>
                                                {getDeptIcon(dept)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '16px', letterSpacing: '-0.01em', marginBottom: '4px' }}>{dept}</div>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={14} color={getDeptColor(dept)} />
                                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>{staffStatus.filter(s => s.department === dept).length}</span> Staff
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            right: '-20px',
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: getDeptColor(dept),
                                            opacity: 0.05
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                                {filteredStaff.map((staff) => {
                                    const isAbsent = staff.currentStatus === 'Absent';
                                    const isLate = staff.currentStatus === 'Late';
                                    const isLeft = staff.currentStatus === 'Left';

                                    const getTheme = () => {
                                        if (staff.currentStatus === 'On Leave') return { bg: '#f0f9ff', color: '#0ea5e9', icon: <Plane size={14} /> };
                                        if (isAbsent) return { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={14} /> };
                                        if (isLate) return { bg: '#fffbeb', color: '#d97706', icon: <AlertCircle size={14} /> };
                                        if (isLeft) return { bg: '#f1f5f9', color: '#64748b', icon: <Clock size={14} /> };
                                        return { bg: '#f0fdf4', color: '#097969', icon: <CheckCircle size={14} /> };
                                    };
                                    const theme = getTheme();

                                    return (
                                        <div key={staff._id} style={{
                                            background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                                        }} className="staff-card-hover">
                                            <div style={{ padding: '24px', flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${getDeptColor(staff.department)}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getDeptColor(staff.department) }}>
                                                            {getDeptIcon(staff.department)}
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <Clock size={16} color="#94a3b8" />
                                                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                                                                Expected: <span style={{ color: '#1e293b', fontWeight: '700' }}>{staff.expectedLocation || 'No Class Assigned'}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{
                                                            background: staff.isCorrectLocation ? '#f0fdf4' : (isLeft ? '#f8fafc' : '#fff1f2'),
                                                            padding: '10px 14px',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            border: `1px solid ${staff.isCorrectLocation ? '#dcfce7' : (isLeft ? '#e2e8f0' : '#ffe4e6')}`
                                                        }}>
                                                            <MapPin size={16} color={staff.currentStatus === 'On Leave' ? '#0ea5e9' : (staff.isCorrectLocation ? '#097969' : (isLeft ? '#94a3b8' : '#dc2626'))} />
                                                            <div style={{ fontSize: '14px', color: staff.currentStatus === 'On Leave' ? '#0369a1' : (staff.isCorrectLocation ? '#065f46' : (isLeft ? '#64748b' : '#991b1b')), fontWeight: '700' }}>
                                                                {staff.currentStatus === 'On Leave' ? 'Officially on Leave' : (isAbsent ? 'Not on Campus' : isLeft ? 'Off Campus (Signal Lost)' : `Currently in ${staff.currentLocation}`)}
                                                            </div>
                                                        </div>

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
                        )}
                    </>
                ) : view === 'leaves' ? (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <LeaveManagement />
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <AttendanceReports />
                    </div>
                )}
            </div>

            {/* Modal */}
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

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .section-header-flex h1 {
                    word-break: break-word;
                }

                .staff-card-hover {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }

                .staff-card-hover:hover { 
                    transform: translateY(-8px) scale(1.01); 
                    box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12); 
                    border-color: #e2e8f0; 
                }

                @media (max-width: 1024px) {
                    .dashboard-stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
                    }
                }

                @media (max-width: 768px) {
                    nav.dashboard-nav {
                        padding: 12px 16px !important;
                        justify-content: center !important;
                    }
                    
                    .view-switcher {
                        order: 3;
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .nav-actions {
                        width: 100%;
                        justify-content: space-between !important;
                        margin-top: 8px;
                    }

                    .dashboard-stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }

                    .section-header-flex {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }

                    .header-actions {
                        width: 100% !important;
                        justify-content: flex-start !important;
                    }

                    .search-container {
                        width: 100% !important;
                        flex: none !important;
                    }

                    .responsive-grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .logout-text {
                        display: none;
                    }
                }

                @keyframes spin { to { transform: rotate(360deg); } }
                .loader-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
            `}} />
        </div>
    );
};

export default ExecutiveDashboard;
