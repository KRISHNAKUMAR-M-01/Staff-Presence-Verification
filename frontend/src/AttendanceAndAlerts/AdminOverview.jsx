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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '40px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Recent Activity</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Live log of staff check-ins and movements</p>
                </div>
                <div style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '12px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#097969', animation: 'pulse 2s infinite' }}></div>
                    Last {recentAttendance.length} updates
                </div>
            </div>

            <div className="responsive-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {recentAttendance.map((item, i) => {
                    const lastSeen = new Date(item.last_seen_time || item.check_in_time);
                    const isStale = (new Date() - lastSeen) > 5 * 60 * 1000;
                    const displayStatus = (item.status === 'Tracking' && isStale) ? 'Session Ended' : item.status;

                    // Logic for duration text
                    let durationText = '';
                    const diffMs = lastSeen - new Date(item.check_in_time);
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    if (diffMins > 0) {
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        durationText = h > 0 ? `${h}h ${m}m` : `${m}m total`;
                    }

                    const isOnline = displayStatus === 'Tracking';

                    return (
                        <div key={i} className="activity-card" style={{
                            background: isOnline ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
                            borderRadius: '24px',
                            padding: '24px',
                            border: '1px solid',
                            borderColor: isOnline ? '#bbf7d0' : '#f1f5f9',
                            boxShadow: isOnline
                                ? '0 20px 25px -5px rgba(22, 163, 74, 0.05), 0 8px 10px -6px rgba(22, 163, 74, 0.05)'
                                : '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Status Glow for Tracking */}
                            {isOnline && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0) 70%)',
                                    pointerEvents: 'none'
                                }}></div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '16px',
                                        background: isOnline ? '#dcfce7' : '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid',
                                        borderColor: isOnline ? '#86efac' : '#e2e8f0',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <User size={24} color={isOnline ? '#166534' : '#64748b'} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '17px', color: '#0f172a', letterSpacing: '-0.02em' }}>{item.staff_name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Computer Science</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: isOnline ? '#16a34a' : '#f1f5f9',
                                    color: isOnline ? '#ffffff' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.02em',
                                    boxShadow: isOnline ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none'
                                }}>
                                    {isOnline && <div className="dot-pulse"></div>}
                                    {displayStatus}
                                </div>
                            </div>

                            <div style={{
                                background: isOnline ? 'rgba(255, 255, 255, 0.6)' : '#f8fafc',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '20px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                border: '1px solid',
                                borderColor: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isOnline ? '#ffffff' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                                            <MapPin size={14} color="#16a34a" />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{item.room_name}</span>
                                    </div>
                                    {durationText && (
                                        <span style={{ fontSize: '11px', color: isOnline ? '#166534' : '#64748b', fontWeight: '700', background: isOnline ? '#dcfce7' : '#e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>
                                            {durationText}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} color="#94a3b8" />
                                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>
                                            {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div style={{ width: '1px', height: '10px', background: '#e2e8f0' }}></div>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                                        {new Date(item.check_in_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .activity-card:hover {
                        transform: translateY(-8px) scale(1.02);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
                        border-color: #cbd5e1;
                    }
                    .dot-pulse {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background-color: #ffffff;
                        animation: pulse-white 1.5s infinite;
                    }
                    @keyframes pulse-white {
                        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
                        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.7; }
                        100% { transform: scale(0.95); opacity: 1; }
                `}} />

                {recentAttendance.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f8fafc',
                        borderRadius: '24px',
                        border: '2px dashed #e2e8f0'
                    }}>
                        <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <Clock size={24} color="#94a3b8" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No Recent Activity</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Once staff members are detected, their movements will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOverview;
