import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
    BarChart2,
    Calendar,
    Clipboard,
    Plane,
    Bell,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const StaffOverview = () => {
    const [stats, setStats] = useState({ classesToday: 0, attendanceRate: 0, pendingLeaves: 0, unreadNotifications: 0 });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [recentAttendance, setRecentAttendance] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const timetable = await api.get('/staff/my-timetable');
                const attendance = await api.get('/staff/my-attendance');
                const leaves = await api.get('/staff/my-leaves');
                const notifs = await api.get('/staff/notifications/unread-count');

                // Process stats
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = days[new Date().getDay()];
                const todayClasses = timetable.data.filter(t => t.day_of_week === today);

                const presentClasses = attendance.data.filter(a => a.status === 'Present').length;
                const rate = attendance.data.length > 0 ? Math.round((presentClasses / attendance.data.length) * 100) : 0;

                setStats({
                    classesToday: todayClasses.length,
                    attendanceRate: rate,
                    pendingLeaves: leaves.data.filter(l => l.status === 'pending').length,
                    unreadNotifications: notifs.data.count
                });

                setTodaySchedule(todayClasses);
                setRecentAttendance(attendance.data.slice(0, 5));
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    const statItems = [
        { label: 'Classes Today', value: stats.classesToday, icon: <Calendar size={22} />, color: '#4f46e5' },
        { label: 'My Attendance', value: `${stats.attendanceRate}%`, icon: <CheckCircle size={22} />, color: '#10b981' }
    ];

    return (
        <div className="section">
            <h2 className="section-title">Welcome Back</h2>
            <div className="stats-grid">
                {statItems.map((item, id) => (
                    <div className="stat-card" key={id}>
                        <div className="stat-icon-wrapper" style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                            {item.icon}
                        </div>
                        <div>
                            <div className="stat-value">{item.value}</div>
                            <div className="stat-label">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <h3 className="card-title">Today's Schedule</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Room</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaySchedule.length > 0 ? todaySchedule.map((cls, i) => (
                                    <tr key={i}>
                                        <td>{cls.classroom_id.room_name}</td>
                                        <td>{cls.start_time} - {cls.end_time}</td>
                                    </tr>
                                )) : <tr><td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No classes today</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="card-title">Recent Attendance</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAttendance.map((item, i) => (
                                    <tr key={i}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyAttendance = () => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/staff/my-attendance');
            setAttendance(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">My Attendance Records</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Room</th><th>Check-in</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {attendance.map((a, i) => (
                            <tr key={i}>
                                <td>{new Date(a.date).toLocaleDateString()}</td>
                                <td>{a.classroom_id?.room_name}</td>
                                <td>{new Date(a.check_in_time).toLocaleTimeString()}</td>
                                <td><span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MyTimetable = () => {
    const [timetable, setTimetable] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/staff/my-timetable');
            setTimetable(res.data);
        };
        fetch();
    }, []);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="section">
            <h2 className="section-title">My Weekly Schedule</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Day</th><th>Room</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                        {days.map(day => {
                            const slots = timetable.filter(t => t.day_of_week === day);
                            if (slots.length === 0) return null;
                            return slots.map((s, i) => (
                                <tr key={`${day}-${i}`}>
                                    {i === 0 && <td rowSpan={slots.length} style={{ fontWeight: '700', color: '#4f46e5' }}>{day}</td>}
                                    <td>{s.classroom_id?.room_name}</td>
                                    <td>{s.start_time} - {s.end_time}</td>
                                </tr>
                            ));
                        })}
                        {timetable.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>No schedule assigned</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MyLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [isSingleDay, setIsSingleDay] = useState(true);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', leave_type: 'Personal Leave', reason: '' });

    const fetchLeaves = async () => {
        const res = await api.get('/staff/my-leaves');
        setLeaves(res.data);
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (isSingleDay) {
                data.end_date = data.start_date;
            }
            await api.post('/staff/leave', data);
            alert('Leave request submitted successfully!');
            setFormData({ start_date: '', end_date: '', leave_type: 'Personal Leave', reason: '' });
            fetchLeaves();
        } catch (err) { alert('Failed to submit leave request'); }
    };

    return (
        <div className="section">
            <h2 className="section-title">Leave Management</h2>

            <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="card-title" style={{ marginBottom: 0 }}>Step 1: Application Type</h3>
                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                        <button
                            onClick={() => setIsSingleDay(true)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: isSingleDay ? 'white' : 'transparent', boxShadow: isSingleDay ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                        >Single Day</button>
                        <button
                            onClick={() => setIsSingleDay(false)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: !isSingleDay ? 'white' : 'transparent', boxShadow: !isSingleDay ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                        >Date Range</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="responsive-grid" style={{ gridTemplateColumns: isSingleDay ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '16px' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '11px', color: '#64748b' }}>Reason for Leave</label>
                            <select className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.leave_type} onChange={e => setFormData({ ...formData, leave_type: e.target.value })} required>
                                <option>Personal Leave</option>
                                <option>Medical Leave</option>
                                <option>Duty Leave</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '11px', color: '#64748b' }}>{isSingleDay ? 'Select Date' : 'Start Date'}</label>
                            <input type="date" className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                        </div>

                        {!isSingleDay && (
                            <div className="form-group">
                                <label style={{ fontSize: '11px', color: '#64748b' }}>End Date</label>
                                <input type="date" className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
                            </div>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: '#64748b' }}>Additional Comments</label>
                        <textarea className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '60px' }} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Explain Briefly..." required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Submit Request</button>
                </form>
            </div>

            <h3 className="card-title" style={{ marginTop: '32px' }}>Request History</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Start Date</th><th>End Date</th><th>Type</th><th>Reason</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {leaves.map((l, i) => (
                            <tr key={i}>
                                <td>{new Date(l.start_date).toLocaleDateString()}</td>
                                <td>{new Date(l.end_date).toLocaleDateString()}</td>
                                <td>{l.leave_type}</td>
                                <td>{l.reason}</td>
                                <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                            </tr>
                        ))}
                        {leaves.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No leave requests found</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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
