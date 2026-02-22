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
                {recentAttendance.map((item, i) => (
                    <div key={i} className="activity-card" style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Status Accent Bar */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: item.status.toLowerCase() === 'tracking' ? '#097969' : '#d97706',
                            opacity: 0.8
                        }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <User size={20} color="#64748b" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>{item.staff_name}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Member</div>
                                </div>
                            </div>
                            <div style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: item.status.toLowerCase() === 'tracking' ? '#ecfdf5' : '#fffbeb',
                                color: item.status.toLowerCase() === 'tracking' ? '#065f46' : '#92400e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {item.status.toLowerCase() === 'tracking' && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>}
                                {item.status}
                            </div>
                        </div>

                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <MapPin size={12} color="#097969" />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{item.room_name}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <Clock size={12} color="#64748b" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                        {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>
                                        {new Date(item.check_in_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .activity-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.1);
                        border-color: #e2e8f0;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.7; }
                        100% { transform: scale(0.95); opacity: 1; }
                    }
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
