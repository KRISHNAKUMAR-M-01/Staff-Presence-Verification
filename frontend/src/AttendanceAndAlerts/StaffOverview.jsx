import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Coffee } from 'lucide-react';
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
        { label: 'Classes Today', value: stats.classesToday, icon: <Calendar size={24} />, color: '#097969', accent: 'linear-gradient(135deg, #e6fcf5 0%, #c3fae8 100%)' },
        { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: <CheckCircle size={24} />, color: '#0891b2', accent: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' }
    ];

    return (
        <div className="section" style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div className="section-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 className="section-title" style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px', color: '#0f172a' }}>Staff Overview</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Welcome back, <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{user.name}</span>. Here's your shift summary.</p>
                </div>
                <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                    Live System Active
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
                        </div>
                    </div>
                ))}
            </div>

            <div className="responsive-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '32px' }}>
                {/* Today's Schedule Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '28px',
                    padding: '32px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.04)'
                }}>
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
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#097969', background: '#e6fcf5', padding: '4px 12px', borderRadius: '8px' }}>
                                        {cls.start_time} - {cls.end_time}
                                    </div>
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
                <div style={{
                    background: 'white',
                    borderRadius: '28px',
                    padding: '32px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={18} color="#0ea5e9" />
                        </div>
                        Recent Attendance
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentAttendance.map((item, i) => {
                            const diffMs = (item.last_seen_time && item.check_in_time) ?
                                new Date(item.last_seen_time) - new Date(item.check_in_time) : 0;
                            const mins = Math.floor(diffMs / (1000 * 60));
                            const hrs = Math.floor(mins / 60);
                            const m = mins % 60;
                            const duration = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;

                            return (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 60px 100px',
                                    alignItems: 'center',
                                    padding: '16px',
                                    borderBottom: i === recentAttendance.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    gap: '12px'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{item.classroom_id?.room_name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                                            {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {item.last_seen_time && ` → `}
                                            {item.last_seen_time && new Date(item.last_seen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                                        {duration}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={`status-badge status-${item.status.toLowerCase()}`} style={{
                                            padding: '6px 12px',
                                            fontSize: '10px',
                                            borderRadius: '8px',
                                            boxShadow: 'none',
                                            border: '1px solid currentColor'
                                        }}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .stat-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: default; }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            `}} />
        </div>
    );
};

export default StaffOverview;
