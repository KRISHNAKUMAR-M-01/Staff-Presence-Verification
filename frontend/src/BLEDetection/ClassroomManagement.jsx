import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Cpu, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import StatusModal from '../components/StatusModal';

const ClassroomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [esp32Id, setEsp32Id] = useState('');
    const [editingRoom, setEditingRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const loadRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/classrooms');
            setRooms(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRooms(); }, []);

    const resetForm = () => {
        setRoomName('');
        setEsp32Id('');
        setEditingRoom(null);
    };

    const handleEdit = (room) => {
        setEditingRoom(room);
        setRoomName(room.room_name);
        setEsp32Id(room.esp32_id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- FRONTEND VALIDATION ---
        const firstCharRegex = /^[A-Za-z_]/;
        if (roomName.length > 15) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Room Name', message: 'Room Name cannot exceed 15 characters.' });
            return;
        }
        if (!firstCharRegex.test(roomName)) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Room Name', message: 'Room Name must start with a letter (A-Z).' });
            return;
        }
        if (!/^[A-Za-z0-9_]+$/.test(roomName)) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Room Name', message: 'Room Name must be alphanumeric (no spaces or special characters).' });
            return;
        }

        if (esp32Id.length > 15) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Device ID', message: 'Device ID cannot exceed 15 characters.' });
            return;
        }
        if (!firstCharRegex.test(esp32Id)) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Device ID', message: 'Device ID must start with a letter (A-Z).' });
            return;
        }
        if (!/^[A-Za-z0-9_]+$/.test(esp32Id)) {
            setModalConfig({ isOpen: true, type: 'error', title: 'Invalid Device ID', message: 'Device ID must be alphanumeric or underscores (no spaces).' });
            return;
        }
        // --- END VALIDATION ---

        try {
            if (editingRoom) {
                await api.put(`/admin/classrooms/${editingRoom._id}`, { room_name: roomName, esp32_id: esp32Id });
                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Classroom Updated',
                    message: `Successfully updated details for ${roomName}.`
                });
            } else {
                await api.post('/admin/classrooms', { room_name: roomName, esp32_id: esp32Id });
                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Classroom Added',
                    message: `${roomName} has been added to the system.`
                });
            }
            resetForm();
            loadRooms();
        } catch (err) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Action Failed',
                message: err.response?.data?.error || 'Something went wrong. Please check the inputs and try again.'
            });
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/admin/classrooms/${id}`);
                loadRooms();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="section">
            <StatusModal {...modalConfig} onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })} />

            <div className="section-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h2 className="section-title">Classroom Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Configure classrooms and their associated ESP32 BLE scanners.</p>
                </div>
            </div>

            <div className="form-card" style={{ marginBottom: '32px', borderLeft: editingRoom ? '4px solid var(--primary)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>
                        {editingRoom ? 'Edit Classroom' : 'Add New Classroom'}
                    </h3>
                    {editingRoom && (
                        <button onClick={resetForm} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <X size={14} style={{ marginRight: '4px' }} /> Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="responsive-grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) auto', gap: '24px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label required-label-asterisk">Room Name</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 2 }}>
                                <Building2 size={18} />
                            </span>
                            <input
                                className="form-input"
                                style={{ paddingLeft: '44px' }}
                                placeholder="e.g. ROOM104"
                                value={roomName}
                                onChange={e => {
                                    const val = e.target.value;
                                    // Block special characters, spaces, starting with number, and max 15 chars
                                    if (val.length <= 15 && (!val || /^[A-Za-z_][A-Za-z0-9_]*$/.test(val))) {
                                        setRoomName(val);
                                    }
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label required-label-asterisk">ESP32 Device ID</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 2 }}>
                                <Cpu size={18} />
                            </span>
                            <input
                                className="form-input"
                                style={{ paddingLeft: '44px' }}
                                placeholder="e.g. ROOM_101_A"
                                value={esp32Id}
                                onChange={e => {
                                    const val = e.target.value;
                                    // Block spaces, starting with number, and max 15 chars
                                    if (val.length <= 15 && (!val || /^[A-Za-z_][A-Za-z0-9_]*$/.test(val))) {
                                        setEsp32Id(val);
                                    }
                                }}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editingRoom ? <><Check size={18} /> Update Room</> : <><Plus size={18} /> Add Room</>}
                    </button>
                </form>
            </div>

            <div className="table-container" style={{ position: 'relative', overflow: 'hidden' }}>
                {loading && (
                    <div className="loader-container">
                        <div className="premium-loader"></div>
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Scanner ID (ESP32)</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.length > 0 ? (
                            rooms.map(r => (
                                <tr key={r._id} style={{ borderLeft: editingRoom?._id === r._id ? '3px solid var(--primary)' : 'none' }}>
                                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{r.room_name}</td>
                                    <td>
                                        <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
                                            {r.esp32_id}
                                        </code>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-primary-outline"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                onClick={() => handleEdit(r)}
                                                title="Edit Room"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-danger-outline"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                onClick={() => handleDelete(r._id, r.room_name)}
                                                title="Delete Room"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                    No classrooms configured. Add one above to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .btn-primary-outline {
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    color: var(--primary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary-outline:hover {
                    background: #f0fdf4;
                    border-color: var(--primary);
                }
                .btn-danger-outline {
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    color: #ef4444;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-danger-outline:hover {
                    background: #fee2e2;
                    border-color: #fecaca;
                }
            `}} />
        </div>
    );
};

export default ClassroomManagement;
