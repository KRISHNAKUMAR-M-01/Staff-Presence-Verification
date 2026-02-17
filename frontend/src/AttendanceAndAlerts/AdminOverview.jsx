import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, Plane } from 'lucide-react';
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
                setRecentAttendance(attendanceData.data.slice(0, 5));
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

            <div className="stats-grid">
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

            <h3 className="card-title">Recent Activity</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Classroom</th>
                            <th>Check-in Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentAttendance.map((item, i) => (
                            <tr key={i}>
                                <td>{item.staff_name}</td>
                                <td>{item.room_name}</td>
                                <td>{new Date(item.check_in_time).toLocaleTimeString()}</td>
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
    );
};

export default AdminOverview;
