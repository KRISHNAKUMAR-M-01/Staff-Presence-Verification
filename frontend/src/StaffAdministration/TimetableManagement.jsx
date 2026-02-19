import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TimetableGridInput from './TimetableGridInput';
import CustomSelect from '../components/CustomSelect';
import { Search, Edit2, Trash2, Check, X } from 'lucide-react';

const TimetableManagement = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [timetable, setTimetable] = useState([]);
    const [staff, setStaff] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({ staff_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:00', subject: '' });
    const [filters, setFilters] = useState({ staffName: '', day: 'All' });
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const fetchData = async () => {
        try {
            const [tRes, sRes, rRes] = await Promise.all([
                api.get('/admin/timetable'),
                api.get('/admin/staff'),
                api.get('/admin/classrooms')
            ]);
            setTimetable(tRes.data);
            setStaff(sRes.data);
            setRooms(rRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/timetable', formData);
            setFormData({ staff_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:00', subject: '' });
            fetchData();
        } catch (err) { alert('Failed to add timetable entry'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this entry?')) {
            try {
                await api.delete(`/admin/timetable/${id}`);
                fetchData();
            } catch (err) {
                alert('Failed to delete entry');
            }
        }
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setEditFormData({
            staff_id: t.staff_id,
            classroom_id: t.classroom_id,
            day_of_week: t.day_of_week,
            start_time: t.start_time,
            end_time: t.end_time,
            subject: t.subject || ''
        });
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/admin/timetable/${id}`, editFormData);
            setEditingId(null);
            fetchData();
        } catch (err) {
            alert('Failed to update timetable entry');
        }
    };

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Schedule Management</h2>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'list' ? '600' : 'normal',
                                cursor: 'pointer'
                            }}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'grid' ? '600' : 'normal',
                                cursor: 'pointer'
                            }}
                        >
                            Grid View (Bulk)
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <div
                            className={`header-controls ${filters.day !== 'All' ? 'active-filters' : ''}`}
                            style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}
                        >
                            <div className="search-wrapper" style={{ width: '220px' }}>
                                <span className="icon"><Search size={16} /></span>
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    className="form-input"
                                    value={filters.staffName}
                                    onChange={(e) => setFilters({ ...filters, staffName: e.target.value })}
                                />
                            </div>
                            <div style={{ width: '160px' }}>
                                <CustomSelect
                                    value={filters.day}
                                    options={[
                                        { value: 'All', label: 'All Days' },
                                        ...['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ value: d, label: d }))
                                    ]}
                                    onChange={(val) => setFilters({ ...filters, day: val })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="form-card" style={{ maxWidth: '100%', overflowX: 'visible' }}>
                    <TimetableGridInput
                        rooms={rooms}
                        staffList={staff}
                        timetable={timetable}
                        onSaveSuccess={() => {
                            fetchData();
                        }}
                    />
                </div>
            ) : (
                <>
                    <div className="form-card">
                        <h3 className="card-title">Assign New Slot</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="responsive-grid" style={{ marginBottom: '20px' }}>
                                <CustomSelect
                                    label="Select Staff"
                                    required
                                    placeholder="Select Staff Member"
                                    value={formData.staff_id}
                                    options={staff.map(s => ({ value: s._id, label: s.name }))}
                                    onChange={val => setFormData({ ...formData, staff_id: val })}
                                />
                                <CustomSelect
                                    label="Select Room"
                                    required
                                    placeholder="Select Classroom"
                                    value={formData.classroom_id}
                                    options={rooms.map(r => ({ value: r._id, label: r.room_name }))}
                                    onChange={val => setFormData({ ...formData, classroom_id: val })}
                                />
                                <CustomSelect
                                    label="Day of Week"
                                    required
                                    value={formData.day_of_week}
                                    options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ value: d, label: d }))}
                                    onChange={val => setFormData({ ...formData, day_of_week: val })}
                                />
                                <div className="form-group">
                                    <label className="form-label required-label-asterisk">Start Time</label>
                                    <input type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label required-label-asterisk">End Time</label>
                                    <input type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input type="text" className="form-input" placeholder="e.g. Mathematics" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '14px 32px' }}>Add Schedule Slot</button>
                        </form>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Staff</th><th>Room</th><th>Day</th><th>Time</th><th>Subject</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {timetable
                                    .filter(t => (filters.day === 'All' || t.day_of_week === filters.day) &&
                                        t.staff_name.toLowerCase().includes(filters.staffName.toLowerCase()))
                                    .map((t, i) => (
                                        <tr key={t.id || i}>
                                            {editingId === t.id ? (
                                                <>
                                                    <td>
                                                        <select
                                                            className="form-input"
                                                            style={{ padding: '4px', fontSize: '13px' }}
                                                            value={editFormData.staff_id}
                                                            onChange={e => setEditFormData({ ...editFormData, staff_id: e.target.value })}
                                                        >
                                                            {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-input"
                                                            style={{ padding: '4px', fontSize: '13px' }}
                                                            value={editFormData.classroom_id}
                                                            onChange={e => setEditFormData({ ...editFormData, classroom_id: e.target.value })}
                                                        >
                                                            {rooms.map(r => <option key={r._id} value={r._id}>{r.room_name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-input"
                                                            style={{ padding: '4px', fontSize: '13px' }}
                                                            value={editFormData.day_of_week}
                                                            onChange={e => setEditFormData({ ...editFormData, day_of_week: e.target.value })}
                                                        >
                                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <input type="time" className="form-input" style={{ padding: '4px', fontSize: '12px', width: '85px' }} value={editFormData.start_time} onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })} />
                                                        <span>-</span>
                                                        <input type="time" className="form-input" style={{ padding: '4px', fontSize: '12px', width: '85px' }} value={editFormData.end_time} onChange={e => setEditFormData({ ...editFormData, end_time: e.target.value })} />
                                                    </td>
                                                    <td>
                                                        <input type="text" className="form-input" style={{ padding: '4px', fontSize: '13px' }} value={editFormData.subject} onChange={e => setEditFormData({ ...editFormData, subject: e.target.value })} placeholder="Subject" />
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn-primary" style={{ padding: '6px', minWidth: 'auto' }} onClick={() => handleUpdate(t.id)}><Check size={16} /></button>
                                                            <button className="btn-secondary" style={{ padding: '6px', minWidth: 'auto' }} onClick={() => setEditingId(null)}><X size={16} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ fontWeight: '600' }}>{t.staff_name}</td>
                                                    <td>{t.room_name}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: '#f1f5f9',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            color: '#475569'
                                                        }}>
                                                            {t.day_of_week}
                                                        </span>
                                                    </td>
                                                    <td>{t.start_time} - {t.end_time}</td>
                                                    <td>{t.subject || '-'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                className="btn-secondary"
                                                                style={{ padding: '6px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0' }}
                                                                onClick={() => startEdit(t)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-danger"
                                                                style={{ padding: '6px' }}
                                                                onClick={() => handleDelete(t.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                {timetable.length > 0 && timetable.filter(t => (filters.day === 'All' || t.day_of_week === filters.day) &&
                                    t.staff_name.toLowerCase().includes(filters.staffName.toLowerCase())).length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No matching schedule slots found.</td></tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default TimetableManagement;
