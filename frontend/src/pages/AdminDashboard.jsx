import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
    BarChart2,
    MapPin,
    Users,
    Home,
    Calendar,
    Clipboard,
    Plane,
    AlertCircle
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

// Sub-pages (could be separate files, but defining here for speed)
const Overview = () => {
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
        { label: 'Present Today', value: stats.presentToday, icon: <Clipboard size={22} />, color: '#10b981' },
        { label: 'Late Today', value: stats.lateToday, icon: <AlertCircle size={22} />, color: '#f59e0b' },
        { label: 'Pending Leaves', value: stats.pendingLeaves, icon: <Plane size={22} />, color: '#3b82f6' }
    ];

    return (
        <div className="section">
            <h2 className="section-title">Dashboard Overview</h2>
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

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [formData, setFormData] = useState({ name: '', beacon_uuid: '', department: '', email: '', password: '' });

    const loadStaff = async () => {
        const res = await api.get('/admin/staff');
        setStaff(res.data);
    };

    useEffect(() => { loadStaff(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/staff', {
                name: formData.name,
                beacon_uuid: formData.beacon_uuid,
                department: formData.department
            });
            if (res.data.id) {
                await api.post('/admin/register-user', {
                    email: formData.email,
                    password: formData.password,
                    role: 'staff',
                    staff_id: res.data.id,
                    name: formData.name
                });
                alert('Staff registered successfully!');
                setFormData({ name: '', beacon_uuid: '', department: '', email: '', password: '' });
                loadStaff();
            }
        } catch (err) { alert('Registration failed'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this staff member?')) {
            await api.delete(`/admin/staff/${id}`);
            loadStaff();
        }
    };

    return (
        <div className="section">
            <h2 className="section-title">Manage Staff</h2>
            <div className="form-card">
                <h3 className="card-title">Register New Staff</h3>
                <form onSubmit={handleSubmit}>
                    <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}>
                        <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Beacon UUID (AA:BB:CC...)" value={formData.beacon_uuid} onChange={e => setFormData({ ...formData, beacon_uuid: e.target.value })} required />
                        <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                        <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Initial Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn-primary">Register Staff</button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Name</th><th>UUID</th><th>Dept</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {staff.map(s => (
                            <tr key={s._id}>
                                <td>{s.name}</td>
                                <td>{s.beacon_uuid}</td>
                                <td>{s.department}</td>
                                <td><button className="btn-danger" onClick={() => handleDelete(s._id)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StaffLocations = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/staff-locations');
            setLocations(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">Staff Locations</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Dept</th><th>Expected</th><th>Actual</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {locations.map((loc, i) => (
                            <tr key={i}>
                                <td>{loc.staff_name}</td>
                                <td>{loc.department}</td>
                                <td>{loc.expected_location}</td>
                                <td>{loc.actual_location}</td>
                                <td className={loc.is_correct_location ? 'location-correct' : 'location-incorrect'}>
                                    {loc.is_correct_location ? 'Correct' : 'Not Present'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ClassroomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [esp32Id, setEsp32Id] = useState('');

    const loadRooms = async () => {
        const res = await api.get('/admin/classrooms');
        setRooms(res.data);
    };

    useEffect(() => { loadRooms(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/admin/classrooms', { room_name: roomName, esp32_id: esp32Id });
        setRoomName(''); setEsp32Id('');
        loadRooms();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete classroom?')) {
            await api.delete(`/admin/classrooms/${id}`);
            loadRooms();
        }
    };

    return (
        <div className="section">
            <h2 className="section-title">Classrooms</h2>
            <div className="form-card">
                <h3 className="card-title">Add Classroom</h3>
                <form onSubmit={handleSubmit} className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                    <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Room Name" value={roomName} onChange={e => setRoomName(e.target.value)} required />
                    <input className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="ESP32 ID" value={esp32Id} onChange={e => setEsp32Id(e.target.value)} required />
                    <button type="submit" className="btn-primary">Add Room</button>
                </form>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Room Name</th><th>ESP32 ID</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {rooms.map(r => (
                            <tr key={r._id}>
                                <td>{r.room_name}</td>
                                <td>{r.esp32_id}</td>
                                <td><button className="btn-danger" onClick={() => handleDelete(r._id)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TimetableManagement = () => {
    const [timetable, setTimetable] = useState([]);
    const [staff, setStaff] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({ staff_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:00' });

    const fetchData = async () => {
        const [tRes, sRes, rRes] = await Promise.all([
            api.get('/admin/timetable'),
            api.get('/admin/staff'),
            api.get('/admin/classrooms')
        ]);
        setTimetable(tRes.data);
        setStaff(sRes.data);
        setRooms(rRes.data);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/timetable', formData);
            setFormData({ ...formData, staff_id: '', classroom_id: '' });
            fetchData();
        } catch (err) { alert('Failed to add timetable entry'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this entry?')) {
            await api.delete(`/admin/timetable/${id}`);
            fetchData();
        }
    };

    return (
        <div className="section">
            <h2 className="section-title">Schedule Management</h2>
            <div className="form-card">
                <h3 className="card-title">Assign New Slot</h3>
                <form onSubmit={handleSubmit}>
                    <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '20px' }}>
                        <select className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })} required>
                            <option value="">Select Staff</option>
                            {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <select className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.classroom_id} onChange={e => setFormData({ ...formData, classroom_id: e.target.value })} required>
                            <option value="">Select Room</option>
                            {rooms.map(r => <option key={r._id} value={r._id}>{r.room_name}</option>)}
                        </select>
                        <select className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: e.target.value })} required>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="time" className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required />
                        <input type="time" className="form-group" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn-primary">Add Schedule Slot</button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Room</th><th>Day</th><th>Time</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {timetable.map((t, i) => (
                            <tr key={i}>
                                <td>{t.staff_name}</td>
                                <td>{t.room_name}</td>
                                <td>{t.day_of_week}</td>
                                <td>{t.start_time} - {t.end_time}</td>
                                <td><button className="btn-danger" onClick={() => handleDelete(t.id)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AttendanceReports = () => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/attendance');
            setAttendance(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">Attendance Reports</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Room</th><th>Check-in</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {attendance.map((a, i) => (
                            <tr key={i}>
                                <td>{a.staff_name}</td>
                                <td>{a.room_name}</td>
                                <td>{new Date(a.check_in_time).toLocaleString()}</td>
                                <td><span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);

    const loadLeaves = async () => {
        const res = await api.get('/admin/leaves');
        setLeaves(res.data);
    };

    useEffect(() => { loadLeaves(); }, []);

    const handleAction = async (id, status) => {
        const notes = window.prompt(`Add notes for ${status}:`);
        try {
            await api.put(`/admin/leaves/${id}`, { status, admin_notes: notes });
            loadLeaves();
        } catch (err) { alert('Failed to update leave'); }
    };

    return (
        <div className="section">
            <h2 className="section-title">Leave Requests</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Period</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {leaves.map((l, i) => (
                            <tr key={i}>
                                <td>{l.staff_id?.name}<div style={{ fontSize: '11px', color: '#64748b' }}>{l.staff_id?.department}</div></td>
                                <td>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                                <td>{l.reason}</td>
                                <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                                <td>
                                    {l.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(l._id, 'approved')}>Approve</button>
                                            <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(l._id, 'rejected')}>Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/alerts');
            setAlerts(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">System Alerts</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Time</th><th>Staff</th><th>Room</th><th>Message</th></tr>
                    </thead>
                    <tbody>
                        {alerts.map((al, i) => (
                            <tr key={i}>
                                <td>{new Date(al.timestamp).toLocaleString()}</td>
                                <td>{al.staff_name}</td>
                                <td>{al.room_name}</td>
                                <td style={{ color: '#ef4444', fontWeight: '500' }}>{al.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    const loadUnreadCount = async () => {
        try {
            const res = await api.get('/staff/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch (err) { console.error(err); }
    };

    const toggleNotifs = async () => {
        if (!showNotifs) {
            try {
                const res = await api.get('/staff/notifications');
                setNotifs(res.data);
            } catch (err) { console.error(err); }
        }
        setShowNotifs(!showNotifs);
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/staff/notifications/${id}/read`);
            loadUnreadCount();
            const res = await api.get('/staff/notifications');
            setNotifs(res.data);
        } catch (err) { console.error(err); }
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
                <AlertCircle size={20} color="#64748b" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#4f46e5',
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
                        <span style={{ fontWeight: '700' }}>Admin Alerts</span>
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
                                    backgroundColor: n.is_read ? 'transparent' : '#f5f3ff',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{n.title}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{n.message}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                        )) : <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No alerts</div>}
                    </div>
                </div>
            )}
        </div>
    );

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: <BarChart2 size={20} /> },
        { label: 'Staff Locations', path: '/admin/locations', icon: <MapPin size={20} /> },
        { label: 'Manage Staff', path: '/admin/staff', icon: <Users size={20} /> },
        { label: 'Classrooms', path: '/admin/classrooms', icon: <Home size={20} /> },
        { label: 'Timetable', path: '/admin/timetable', icon: <Calendar size={20} /> },
        { label: 'Attendance', path: '/admin/attendance', icon: <Clipboard size={20} /> },
        { label: 'Leave Requests', path: '/admin/leaves', icon: <Plane size={20} /> },
        { label: 'Alerts', path: '/admin/alerts', icon: <AlertCircle size={20} /> },
    ];

    return (
        <DashboardLayout
            title="Admin Dashboard"
            userName={user.name}
            navItems={navItems}
            themeClass="admin-theme"
            brandColor="#4f46e5"
            headerActions={headerActions}
        >
            <Routes>
                <Route index element={<Overview />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="locations" element={<StaffLocations />} />
                <Route path="classrooms" element={<ClassroomManagement />} />
                <Route path="timetable" element={<TimetableManagement />} />
                <Route path="attendance" element={<AttendanceReports />} />
                <Route path="leaves" element={<LeaveManagement />} />
                <Route path="alerts" element={<SystemAlerts />} />
                <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
        </DashboardLayout>
    );
};

// Add Navigate to the imports
import { Navigate } from 'react-router-dom';

export default AdminDashboard;
