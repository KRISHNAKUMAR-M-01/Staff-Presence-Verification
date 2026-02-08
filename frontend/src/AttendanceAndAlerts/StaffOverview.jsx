import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import api from '../services/api';

const StaffOverview = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
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
            <div className="section-header" style={{ marginBottom: '32px' }}>
                <h2 className="section-title">Staff Portal</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Welcome back, {user.name}. Here's your shift summary.</p>
            </div>

            <div className="stats-grid">
                {statItems.map((item, id) => (
                    <div className="stat-card" key={id}>
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                                {item.icon}
                            </div>
                            <div className="stat-badge" style={{ color: item.color, backgroundColor: `${item.color}10` }}>
                                Today
                            </div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <div className="stat-value">{item.value}</div>
                            <div className="stat-label">{item.label}</div>
                        </div>
                        <div className="stat-footer">
                            <span className="stat-trend" style={{ color: item.color }}>• Active</span>
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

export default StaffOverview;
