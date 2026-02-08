import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';

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

export default TimetableManagement;
