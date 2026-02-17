import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TimetableGridInput from './TimetableGridInput';
import CustomSelect from '../components/CustomSelect';
import { Search, Filter, X } from 'lucide-react';

const TimetableManagement = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [timetable, setTimetable] = useState([]);
    const [staff, setStaff] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({ staff_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:00' });
    const [filters, setFilters] = useState({ staffName: '', day: 'All' });

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
                            // Optional: switch back to list view?
                            // setViewMode('list'); 
                        }}
                    />
                </div>
            ) : (
                <>
                    <div className="form-card">
                        <h3 className="card-title">Assign New Slot</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '20px' }}>
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
                                        <tr key={i}>
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
                                            <td><button className="btn-danger" onClick={() => handleDelete(t.id)}>Delete</button></td>
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
