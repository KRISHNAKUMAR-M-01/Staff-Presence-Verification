import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
                <form onSubmit={handleSubmit} className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr auto', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label required-label-asterisk">Room Name</label>
                        <input className="form-input" placeholder="e.g. Room 101" value={roomName} onChange={e => setRoomName(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label required-label-asterisk">ESP32 ID</label>
                        <input className="form-input" placeholder="e.g. ESP32_01" value={esp32Id} onChange={e => setEsp32Id(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '48px' }}>Add Room</button>
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

export default ClassroomManagement;
