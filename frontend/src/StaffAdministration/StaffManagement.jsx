import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye, EyeOff, Search, Edit2, Trash2, X, Check, UserPlus, Save, ChevronLeft, Building2, Users, Plane, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot, Camera } from 'lucide-react';
import StatusModal from '../components/StatusModal';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', beacon_uuid: '', department: '', email: '', password: '', is_hod: false, phone_number: '' });
    const [profileFile, setProfileFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [editingStaff, setEditingStaff] = useState(null);
    const [selectedDept, setSelectedDept] = useState(null); // Controls drill-down
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null, name: '' });

    const departments = [
        "Aeronautical Engineering",
        "Agricultural Engineering",
        "Artificial Intelligence and Data Science",
        "Automobile Engineering",
        "Biomedical Engineering",
        "Chemical Engineering",
        "Civil Engineering",
        "Computer Science and Business Systems",
        "Computer Science and Engineering",
        "Electrical and Electronics Engineering",
        "Electronics and Communication Engineering",
        "Information Technology",
        "Mechanical Engineering",
        "Mechatronics Engineering"
    ];

    const getDeptIcon = (dept) => {
        const iconProps = { size: 26, color: "#097969" };
        switch (dept) {
            case "Aeronautical Engineering": return <Plane {...iconProps} />;
            case "Agricultural Engineering": return <Sprout {...iconProps} />;
            case "Artificial Intelligence and Data Science": return <Brain {...iconProps} />;
            case "Automobile Engineering": return <Car {...iconProps} />;
            case "Biomedical Engineering": return <Activity {...iconProps} />;
            case "Chemical Engineering": return <FlaskConical {...iconProps} />;
            case "Civil Engineering": return <Compass {...iconProps} />;
            case "Computer Science and Business Systems": return <Code {...iconProps} />;
            case "Computer Science and Engineering": return <Monitor {...iconProps} />;
            case "Electrical and Electronics Engineering": return <Zap {...iconProps} />;
            case "Electronics and Communication Engineering": return <Cpu {...iconProps} />;
            case "Information Technology": return <Globe {...iconProps} />;
            case "Mechanical Engineering": return <Settings {...iconProps} />;
            case "Mechatronics Engineering": return <Bot {...iconProps} />;
            default: return <Building2 {...iconProps} />;
        }
    };

    const loadStaff = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/staff');
            setStaff(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStaff(); }, []);

    const resetForm = () => {
        setFormData({ name: '', beacon_uuid: '', department: '', email: '', password: '', is_hod: false, phone_number: '' });
        setEditingStaff(null);
        setProfileFile(null);
        setPreviewUrl(null);
        setShowPassword(false);
    };

    const handleEdit = (s) => {
        setEditingStaff(s);
        setFormData({
            name: s.name,
            beacon_uuid: s.beacon_uuid,
            department: s.department,
            email: '',
            password: '',
            is_hod: s.is_hod || false,
            phone_number: s.phone_number || ''
        });
        setPreviewUrl(s.profile_picture ? (s.profile_picture.startsWith('http') ? s.profile_picture : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${s.profile_picture}`) : null);
        setProfileFile(null);
        // Ensure form is visible if we're in drill-down
        if (!selectedDept) {
            setSelectedDept(s.department);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- FULL NAME VALIDATION ---
        if (!/^(?=.*[A-Za-z])[A-Za-z_]+$/.test(formData.name.trim())) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Invalid Name',
                message: 'Name must contain at least one letter and can only include underscores (no spaces).'
            });
            return;
        }

        if (!formData.department) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Missing Department',
                message: 'Please select a department from the dropdown.'
            });
            return;
        }

        // --- BEACON UUID VALIDATION ---
        const uuidRegex = /^[0-9A-Fa-f]{32}$/;
        if (!uuidRegex.test(formData.beacon_uuid.trim())) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Invalid Beacon UUID',
                message: 'Beacon UUID must be exactly 32 hexadecimal characters (0-9, A-F).'
            });
            return;
        }
        // --- END VALIDATION ---

        // --- PHONE NUMBER VALIDATION ---
        if (formData.phone_number) {
            const phoneRegex = /^(?:\+91[\-\s]?)?[6789]\d{9}$/;
            if (!phoneRegex.test(formData.phone_number.trim())) {
                setModalConfig({
                    isOpen: true,
                    type: 'error',
                    title: 'Invalid Phone Number',
                    message: 'Please enter a valid Indian mobile number (e.g., 9876543210 or +91 9876543210).'
                });
                return;
            }
        }
        // --- END VALIDATION ---
        Object.keys(formData).forEach(key => {
            if (key !== 'password' || formData[key]) {
                data.append(key, formData[key]);
            }
        });
        if (profileFile) data.append('profile_picture', profileFile);

        try {
            if (editingStaff) {
                await api.put(`/admin/staff/${editingStaff._id}`, data);

                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Staff Updated',
                    message: `Successfully updated details for ${formData.name}.`
                });
            } else {
                const res = await api.post('/admin/staff', data);

                if (res.data.id) {
                    await api.post('/admin/register-user', {
                        email: formData.email,
                        password: formData.password,
                        role: 'staff',
                        staff_id: res.data.id,
                        name: formData.name
                    });
                }
                
                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Staff Registered!',
                    message: `Account for ${formData.name} has been created successfully.`
                });
            }
            resetForm();
            loadStaff();
        } catch (err) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: editingStaff ? 'Update Failed' : 'Registration Failed',
                message: err.response?.data?.error || 'A system error occurred.'
            });
        }
    };

    const handleDelete = async (id, name) => {
        setConfirmConfig({ isOpen: true, id, name });
    };

    const confirmDelete = async () => {
        const id = confirmConfig.id;
        try {
            await api.delete(`/admin/staff/${id}`);
            loadStaff();
            setConfirmConfig({ isOpen: false, id: null, name: '' });
            setModalConfig({
                isOpen: true,
                type: 'success',
                title: 'Staff Removed',
                message: `Successfully deleted staff member.`
            });
        } catch (err) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Delete Failed',
                message: 'Could not delete staff member. They might be referenced in other records.'
            });
        }
    };

    // Derived Data
    const getStaffCount = (dept) => staff.filter(s => s.department === dept).length;

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = !selectedDept || s.department === selectedDept;
        return matchesSearch && matchesDept;
    });

    const filteredDepts = departments.filter(d =>
        d.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.some(s => s.department === d && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="section">
            <StatusModal {...modalConfig} onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })} />
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title="Confirm Removal"
                message={`Are you sure you want to remove ${confirmConfig.name}? This will also delete their login credentials.`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmConfig({ isOpen: false, id: null, name: '' })}
            />

            <div className="responsive-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {selectedDept && (
                        <button
                            onClick={() => { setSelectedDept(null); setSearchQuery(''); resetForm(); }}
                            className="back-btn"
                            style={{
                                width: '36px', height: '36px', background: 'white', flexShrink: 0,
                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <h2 className="section-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedDept ? selectedDept : 'Staff Management'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedDept ? `Managing ${filteredStaff.length} staff members.` : 'Select a department.'}
                        </p>
                    </div>
                </div>
                                <div className="search-wrapper" style={{ marginBottom: '20px', maxWidth: '100%' }}>
                            <span className="icon" style={{ zIndex: 2 }}><Search size={16} /></span>
                    <input
                        type="text"
                        placeholder={selectedDept ? "Search within..." : "Search staff or dept..."}
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Registration/Edit Form - Only visible on Root OR when explicitly editing */}
            {(editingStaff || !selectedDept) && (
                <div className="form-card" style={{ marginBottom: '40px', borderLeft: editingStaff ? '4px solid var(--primary)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 className="card-title" style={{ margin: 0, fontSize: '18px' }}>
                            {editingStaff ? 'Edit Staff Member' : 'Register New Staff'}
                        </h3>
                        {editingStaff && (
                            <button onClick={resetForm} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
                                <X size={14} style={{ marginRight: '4px' }} /> Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '16px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Photo (Cloudinary)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                {previewUrl ? (
                                    <img src={previewUrl} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                ) : (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '24px', fontWeight: '800' }}>
                                        {formData.name.charAt(0) || '?'}
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="staff-photo-upload" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setProfileFile(file);
                                                setPreviewUrl(URL.createObjectURL(file));
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="staff-photo-upload" style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px', 
                                        background: '#ffffff', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '10px', 
                                        fontSize: '13px', 
                                        fontWeight: '600', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.2s', 
                                        width: 'fit-content',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }} onMouseOver={e=> { e.target.style.background='#f8fafc'; e.target.style.borderColor='var(--primary)'; }} onMouseOut={e=>{ e.target.style.background='#ffffff'; e.target.style.borderColor='#cbd5e1'; }}>
                                        <Camera size={16} /> Select Photo
                                    </label>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', margin: 0 }}>Upload to Cloudinary.</p>
                                </div>
                            </div>
                        </div>

                        <div className="responsive-grid" style={{ marginBottom: '24px' }}>
                            <div className="form-group">
                                <label className="form-label required-label-asterisk">Full Name</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (!val || /^[A-Za-z_]*$/.test(val)) {
                                            setFormData({ ...formData, name: val });
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required-label-asterisk">Beacon UUID</label>
                                <input
                                    className="form-input"
                                    placeholder="32-Digit Hex (e.g. EB065505...)"
                                    value={formData.beacon_uuid}
                                    onChange={e => setFormData({ ...formData, beacon_uuid: e.target.value.toUpperCase() })}
                                    maxLength="32"
                                    required
                                />
                                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                    Current length: {formData.beacon_uuid.length}/32
                                </p>
                            </div>
                            <CustomSelect
                                label="Department"
                                required
                                placeholder="Select Department"
                                value={formData.department}
                                options={departments.map(d => ({ value: d, label: d }))}
                                onChange={val => setFormData({ ...formData, department: val })}
                            />
                            <div className="form-group">
                                <label className="form-label">Phone Number (Indian)</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. 9876543210"
                                    value={formData.phone_number}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Allow only digits, space, plus, and hyphen in real-time typing
                                        if (/^[\d\s+\-]*$/.test(val)) {
                                            setFormData({ ...formData, phone_number: val });
                                        }
                                    }}
                                />
                                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                    Formats: 9876543210 or +91 9876543210
                                </p>
                            </div>

                            {editingStaff ? (
                                <div className="form-group">
                                    <label className="form-label">Reset Password (Optional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="form-input"
                                            placeholder="Enter new password to reset"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            style={{ paddingRight: '45px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', zIndex: 2 }}
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Leave blank to keep existing password.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label className="form-label required-label-asterisk">Email Address (Login)</label>
                                        <input
                                            className="form-input"
                                            placeholder="staff@school.com"
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            pattern="^[a-zA-Z][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                                            title="Enter a valid email address (e.g. user@domain.com)"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required-label-asterisk">Initial Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-input"
                                                placeholder="Min. 8 chars"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                style={{ paddingRight: '45px' }}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_hod}
                                        onChange={e => setFormData({ ...formData, is_hod: e.target.checked })}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                    />
                                    Head of Department (HOD) Status
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}>
                            {editingStaff ? <><Save size={18} /> Save Changes</> : <><UserPlus size={18} /> Register Staff</>}
                        </button>
                    </form>
                </div>
            )}

            {/* LEVEL 1: DEPARTMENT CARDS */}
            {!selectedDept && (
                <div className="grid-adaptive-340">
                    {filteredDepts.map(dept => (
                        <div
                            key={dept}
                            className="form-card"
                            onClick={() => setSelectedDept(dept)}
                            style={{ margin: 0, cursor: 'pointer', padding: '24px', position: 'relative', transition: 'all 0.3s' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c1f2eb' }}>
                                    {getDeptIcon(dept)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a', lineHeight: 1.2 }}>{dept}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: '500', marginTop: '4px' }}>
                                        <Users size={12} /> {getStaffCount(dept)} Regular Staff
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LEVEL 2: STAFF TABLE (Department Wise) */}
            {selectedDept && (
                <div className="table-container" style={{ position: 'relative' }}>
                    {loading && (
                        <div className="loader-container">
                            <div className="premium-loader"></div>
                        </div>
                    )}
                    <table>
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Beacon UUID</th>
                                <th>Phone</th>
                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map(s => (
                                <tr key={s._id} style={{ borderLeft: editingStaff?._id === s._id ? '3px solid var(--primary)' : 'none' }}>
                                    <td>
                                        <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {s.name}
                                            {s.is_hod && <span style={{ padding: '2px 8px', backgroundColor: '#e6fcf9', color: '#097969', borderRadius: '6px', fontSize: '10px', fontWeight: '800', border: '1px solid #c1f2eb' }}>HOD</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#475569', border: '1px solid #f1f5f9' }}>
                                            {s.beacon_uuid}
                                        </code>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '14px' }}>{s.phone_number || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-primary-outline"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                onClick={() => handleEdit(s)}
                                                title="Edit Staff"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-danger-outline"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                onClick={() => handleDelete(s._id, s.name)}
                                                title="Delete Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                                        No staff members found in this department.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

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
                .form-card:hover {
                    border-color: var(--primary) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .back-btn:hover {
                    background: #f8fafc !important;
                    color: var(--primary) !important;
                    transform: translateX(-2px);
                }
            `}} />
        </div>
    );
};

export default StaffManagement;
