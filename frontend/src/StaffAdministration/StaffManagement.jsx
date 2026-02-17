import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye, EyeOff, Search } from 'lucide-react';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', beacon_uuid: '', department: '', email: '', password: '', is_hod: false, phone_number: '' });
    const [showPassword, setShowPassword] = useState(false);

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
                department: formData.department,
                is_hod: formData.is_hod,
                phone_number: formData.phone_number
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
                setFormData({ name: '', beacon_uuid: '', department: '', email: '', password: '', is_hod: false, phone_number: '' });
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
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Manage Staff</h2>
                <div className="search-wrapper" style={{ maxWidth: '300px' }}>
                    <span className="icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder="Search staff members..."
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

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
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input"
                                    placeholder="Min. 8 chars (A, a, 1, #)"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
                                    title="Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character (@$!%*?&#)"
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={{ paddingRight: '45px' }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                className="form-input"
                                placeholder="e.g. +91 9876543210"
                                value={formData.phone_number}
                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_hod}
                                    onChange={e => setFormData({ ...formData, is_hod: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#097969' }}
                                />
                                Is Head of Department (HOD)?
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary">Register Staff</button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Name</th><th>UUID</th><th>Dept</th><th>Phone</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {staff
                            .filter(s =>
                                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.department.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(s => (
                                <tr key={s._id}>
                                    <td>
                                        {s.name}
                                        {s.is_hod && <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: '#65c6b7', color: '#097969', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>HOD</span>}
                                    </td>
                                    <td>{s.beacon_uuid}</td>
                                    <td>{s.department}</td>
                                    <td>{s.phone_number || 'N/A'}</td>
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
