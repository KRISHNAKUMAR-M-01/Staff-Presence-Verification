import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Coffee, Radio, Repeat, X, UserPlus, Loader2 } from 'lucide-react';
import api from '../services/api';
import SoftBeacon from '../components/SoftBeacon';
import ProfilePictureUploader from '../components/ProfilePictureUploader';
import Avatar from '../components/Avatar';

const StaffOverview = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ classesToday: 0, attendanceRate: 0, pendingLeaves: 0, unreadNotifications: 0 });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [recentAttendance, setRecentAttendance] = useState([]);
    
    // Swap Logic States
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [selectedClassForSwap, setSelectedClassForSwap] = useState(null);
    const [swapReason, setSwapReason] = useState('');
    const [freeStaff, setFreeStaff] = useState([]);
    const [loadingFree, setLoadingFree] = useState(false);
    const [showFreeStaffPanel, setShowFreeStaffPanel] = useState(false);

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState(user.staff_id?.profile_picture || null);

    const fetchData = async () => {
        try {
            const timetable = await api.get('/staff/my-timetable');
            const attendance = await api.get('/staff/my-attendance');
            const leaves = await api.get('/staff/my-leaves');
            const notifs = await api.get('/staff/notifications/unread-count');

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const todayClasses = timetable.data.filter(t => t.day_of_week === today);
            const approvedLeaves = leaves.data.filter(l => l.status === 'approved');

            const isOnApprovedLeave = (dateStr) => {
                const d = new Date(dateStr);
                d.setHours(0, 0, 0, 0);
                return approvedLeaves.some(l => {
                    const start = new Date(l.start_date); start.setHours(0, 0, 0, 0);
                    const end   = new Date(l.end_date);   end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                });
            };

            const excusedRecords = attendance.data.filter(a => isOnApprovedLeave(a.date));
            const activeRecords  = attendance.data.filter(a => !isOnApprovedLeave(a.date));
            const presentClasses = activeRecords.filter(a => ['Present', 'Late'].includes(a.status)).length;

            const rate = activeRecords.length > 0
                ? Math.round((presentClasses / activeRecords.length) * 100)
                : 0;

            setStats({
                classesToday: todayClasses.length,
                attendanceRate: rate,
                leaveDaysCount: excusedRecords.length,
                pendingLeaves: leaves.data.filter(l => l.status === 'pending').length,
                unreadNotifications: notifs.data.count
            });

            setTodaySchedule(todayClasses);
            setRecentAttendance(attendance.data.slice(0, 5));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();

        // Fetch latest profile picture
        api.get('/staff/me').then(res => {
            if (res.data?.staff_id?.profile_picture) {
                setProfilePicture(res.data.staff_id.profile_picture);
            }
        }).catch(() => {});
    }, []);

    const handleSwapRequest = async () => {
        if (!swapReason) return alert('Please enter a reason');
        try {
            const res = await api.post('/staff/swap-request', {
                classroom_id: selectedClassForSwap.classroom_id?._id || selectedClassForSwap.classroom_id,
                reason: swapReason
            });
            alert(res.data.message);
            setShowSwapModal(false);
            setSwapReason('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send swap request');
        }
    };

    const findFreeStaff = async () => {
        setLoadingFree(true);
        setShowFreeStaffPanel(true);
        try {
            const res = await api.get('/staff/find-free-staff');
            setFreeStaff(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingFree(false); }
    };

    const requestSubstitution = async (targetStaffId) => {
        try {
            // Using a simple logic: the backend finds the latest approved swap-request automatically
            const res = await api.post('/staff/request-substitution', {
                target_staff_id: targetStaffId,
                swap_request_id: 'auto' 
            });
            alert('Substitution request sent successfully!');
        } catch (err) { alert(err.response?.data?.error || 'No approved swap request found. Contact admin first.'); }
    };

    const statItems = [
        { label: 'Classes Today', value: stats.classesToday, icon: <Calendar size={24} />, color: '#097969', accent: 'linear-gradient(135deg, #e6fcf5 0%, #c3fae8 100%)' },
        { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, subLabel: `${stats.leaveDaysCount} sessions excused on leave`, icon: <CheckCircle size={24} />, color: '#0891b2', accent: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' }
    ];

    return (
        <div className="section section-fade">
            <div className="section-header-flex" style={{ alignItems: 'flex-start', gap: '24px' }}>
                {/* Profile Picture + Info */}
                <div className="staff-profile-header">
                    <ProfilePictureUploader
                        staffName={user.name}
                        currentPicture={profilePicture}
                        onUpdate={setProfilePicture}
                        size={80}
                    />
                    <div>
                        <h2 className="section-title" style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '4px', color: '#0f172a' }}>{user.name}</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {user.staff_id?.department || 'Staff Member'}
                        </p>
                        <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f0fdf4', borderRadius: '20px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Live System Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                {statItems.map((item, id) => (
                    <div className="stat-card" key={id} style={{
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '40%',
                            height: '100%',
                            background: item.accent,
                            opacity: 0.15,
                            clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)'
                        }}></div>

                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{
                                background: item.accent,
                                color: item.color,
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                {item.icon}
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div className="stat-value" style={{ fontSize: '42px', fontWeight: '800', color: '#1e293b' }}>{item.value}</div>
                            <div className="stat-label" style={{ fontWeight: '700', color: '#64748b', fontSize: '13px' }}>{item.label}</div>
                            {item.subLabel && (
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: item.color, 
                                    fontWeight: '600', 
                                    marginTop: '4px',
                                    background: `${item.color}10`,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-block'
                                }}>
                                    {item.subLabel}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Swap & Search Panel */}
            <div className="grid-adaptive-300" style={{ marginBottom: '32px' }}>
                {/* Virtual Beacon Panel */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Radio size={16} color="#097969" />
                        </div>
                        Check-in (Soft Beacon)
                    </h3>
                    <SoftBeacon />
                </div>

                {/* Find Substitute Panel */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus size={16} color="#2563eb" />
                        </div>
                        Find Free Staff
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>If you have an urgent swap approved by Admin, you can request a free staff member to take your class.</p>
                    <button 
                        onClick={findFreeStaff}
                        style={{ width: '100%', padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Search Available Personnel
                    </button>

                    {showFreeStaffPanel && (
                        <div style={{ marginTop: '16px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {loadingFree ? <div style={{ textAlign: 'center' }}><Loader2 className="animate-spin" size={20} /></div> : 
                             freeStaff.length > 0 ? freeStaff.map(s => (
                                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Avatar name={s.name} picturePath={s.profile_picture} size={32} />
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.name}</span>
                                    </div>
                                    <button onClick={() => requestSubstitution(s._id)} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Request</button>
                                </div>
                             )) : <div style={{ fontSize: '12px', textAlign: 'center', color: '#94a3b8' }}>No free staff found right now.</div>
                            }
                        </div>
                    )}
                </div>
            </div>

            <div className="responsive-grid schedule-grid">
                {/* Today's Schedule Card */}
                <div className="summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={18} color="#0d9488" />
                            </div>
                            Today's Schedule
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {todaySchedule.length > 0 ? todaySchedule.map((cls, i) => (
                            <div key={i} style={{
                                padding: '16px 20px',
                                background: '#f8fafc',
                                borderRadius: '18px',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{cls.room_name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{cls.subject || 'Academic Session'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#097969', background: '#e6fcf5', padding: '4px 12px', borderRadius: '8px' }}>
                                        {cls.start_time} - {cls.end_time}
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedClassForSwap(cls); setShowSwapModal(true); }}
                                        title="Request Urgent Swap"
                                        style={{ background: 'white', border: '1.5px solid #e2e8f0', padding: '8px', borderRadius: '10px', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <Repeat size={16} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                                <div style={{ marginBottom: '16px', display: 'inline-flex', padding: '12px', background: 'white', borderRadius: '12px', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                                    <Coffee size={24} />
                                </div>
                                <div style={{ fontWeight: '700', color: '#475569' }}>Clear Schedule</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>No classes assigned for you today.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="summary-card">
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={18} color="#0ea5e9" />
                        </div>
                        Recent Attendance
                    </h3>

                    <div className="activity-list">
                        {recentAttendance.map((item, i) => {
                            const diffMs = (item.last_seen_time && item.check_in_time) ?
                                new Date(item.last_seen_time) - new Date(item.check_in_time) : 0;
                            const mins = Math.floor(diffMs / (1000 * 60));
                            const hrs = Math.floor(mins / 60);
                            const m = mins % 60;
                            const duration = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;

                            return (
                                <div key={i} className="activity-item">
                                    <div className="activity-date">
                                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="activity-main">
                                        <div className="activity-room">{item.classroom_id?.room_name}</div>
                                        <div className="activity-time">
                                            {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {item.last_seen_time && ` → `}
                                            {item.last_seen_time && new Date(item.last_seen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="activity-meta">
                                        <div className="activity-duration">{duration}</div>
                                        <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Swap Request Modal */}
            {showSwapModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '28px', maxWidth: 'min(440px, 100%)', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}>
                        <div className="modal-compact">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Urgent Swap Request</h3>
                                <button onClick={() => setShowSwapModal(false)} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20}/></button>
                            </div>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>Requesting a swap for your class in <strong style={{ color: '#0f172a' }}>{selectedClassForSwap?.room_name}</strong>. Provide a reason for the Admin's approval.</p>
                            
                            <textarea 
                                placeholder="E.g. I have an urgent meeting with a parent / Medical emergency..." 
                                value={swapReason}
                                onChange={(e) => setSwapReason(e.target.value)}
                                style={{ width: '100%', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '16px', minHeight: '120px', marginTop: '20px', outline: 'none', fontSize: '14px', fontWeight: '500' }}
                            />
                            
                            <button 
                                onClick={handleSwapRequest}
                                style={{ width: '100%', marginTop: '24px', padding: '16px', background: '#097969', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(9, 121, 105, 0.3)' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Send Request to Admin
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
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                .stat-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            `}} />
        </div>
    );
};

export default StaffOverview;
