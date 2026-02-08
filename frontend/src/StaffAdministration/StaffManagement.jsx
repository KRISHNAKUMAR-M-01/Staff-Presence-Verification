import React, { useState, useEffect } from 'react';
import api from '../services/api';

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

        // Validation: email should not start with a number
        if (/^\d/.test(formData.email)) {
            alert('Email address should not start with a number');
            return;
        }

        // Validation: Password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            alert('Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.');
            return;
        }

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
                        <div className="form-group">
                            <label className="form-label required-label-asterisk">Full Name</label>
                            <input
                                className="form-input"
                                placeholder="Enter full name"
                                pattern="^[A-Za-z\s]+$"
                                title="Name should only contain letters and spaces"
                                value={formData.name}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (!val || /^[A-Za-z\s]*$/.test(val)) {
                                        setFormData({ ...formData, name: val });
                                    }
                                }}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required-label-asterisk">Beacon UUID</label>
                            <input className="form-input" placeholder="AA:BB:CC:DD:EE:FF" value={formData.beacon_uuid} onChange={e => setFormData({ ...formData, beacon_uuid: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required-label-asterisk">Department</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Computer Science"
                                pattern="^[A-Za-z\s]+$"
                                title="Department should only contain letters and spaces"
                                value={formData.department}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (!val || /^[A-Za-z\s]*$/.test(val)) {
                                        setFormData({ ...formData, department: val });
                                    }
                                }}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required-label-asterisk">Email Address</label>
                            <input
                                className="form-input"
                                placeholder="staff@school.com"
                                type="email"
                                title="Email should not start with a number"
                                pattern="^[^0-9].*"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required-label-asterisk">Initial Password</label>
                            <input
                                className="form-input"
                                placeholder="Min. 8 chars (A, a, 1, #)"
                                type="password"
                                value={formData.password}
                                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
                                title="Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character (@$!%*?&#)"
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
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

export default StaffManagement;
