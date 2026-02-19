import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, Plane, User, MapPin, Clock } from 'lucide-react';
import api from '../services/api';

const AdminOverview = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ totalStaff: 0, totalClassrooms: 0, presentToday: 0, lateToday: 0, pendingLeaves: 0 });
    const [recentAttendance, setRecentAttendance] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await api.get('/admin/dashboard-stats');
                setStats(statsData.data);
                const attendanceData = await api.get('/admin/attendance');
                setRecentAttendance(attendanceData.data.slice(0, 6)); // Show top 6
            } catch (err) { console.error(err); }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const statItems = [
        { label: 'Present Today', value: stats.presentToday, icon: <Clipboard size={22} />, color: '#097969', accent: '#e6fcf9' },
        { label: 'Late Today', value: stats.lateToday, icon: <AlertCircle size={22} />, color: '#d97706', accent: '#fffbeb' },
        { label: 'Pending Leaves', value: stats.pendingLeaves, icon: <Plane size={22} />, color: '#097969', accent: '#e6fcf9' }
    ];

    return (
        <div className="section">
            <div className="section-header" style={{ marginBottom: '32px' }}>
                <h2 className="section-title" style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Welcome back, {user.name}. Here's what's happening today.</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                {statItems.map((item, id) => (
                    <div className="stat-card" key={id} style={{ borderLeft: `4px solid ${item.color}` }}>
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{ color: item.color, backgroundColor: item.accent }}>
                                {item.icon}
                            </div>
                            <div className="stat-badge" style={{ color: item.color, backgroundColor: item.accent }}>
                                Live Update
                            </div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div className="stat-value" style={{ fontSize: '32px' }}>{item.value}</div>
                            <div className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', opacity: 0.8 }}>{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Recent Activity</h3>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Last {recentAttendance.length} check-ins</span>
            </div>

            <div className="responsive-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
            }}>
                {recentAttendance.map((item, i) => (
                    <div key={i} className="form-card" style={{
                        margin: 0,
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={16} color="#64748b" />
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.staff_name}</span>
                            </div>
                            <span className={`status-badge status-${item.status.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {item.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} color="#94a3b8" />
                            <span style={{ fontSize: '12px', color: '#475569' }}>{item.room_name}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                            <Clock size={12} color="#94a3b8" />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {recentAttendance.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>
                        No recent activity recorded today.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminOverview;
