import React, { useState } from 'react';
import api from '../services/api';
import { Eye, EyeOff, Shield, Info } from 'lucide-react';
import StatusModal from '../components/StatusModal';

const UserManagement = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (/^\d/.test(formData.email)) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Invalid Email',
                message: 'Email address should not start with a number. Please correct it to continue.'
            });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Weak Password',
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character (@$!%*?&#).'
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/admin/register-user', {
                email: formData.email,
                password: formData.password,
                role: formData.role,
                name: formData.name
            });
            setModalConfig({
                isOpen: true,
                type: 'success',
                title: 'Account Created',
                message: `The ${formData.role} account for ${formData.name} has been successfully provisioned.`
            });
            setFormData({ name: '', email: '', password: '', role: 'admin' });
        } catch (err) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Creation Failed',
                message: err.response?.data?.error || 'A system error occurred while creating the account.'
            });
        } finally {
            setLoading(false);
        }
    };

    const roleConfig = {
        admin: {
            label: 'Administrator',
            description: 'Complete system access including staff management, timetables, attendance tracking, and reporting',
            color: '#097969',
            bgColor: '#ecfdf5'
        },
        principal: {
            label: 'Principal',
            description: 'Executive access to view staff status and coordinate meetings with automatic class coverage',
            color: '#0891b2',
            bgColor: '#ecfeff'
        },
        secretary: {
            label: 'Secretary',
            description: 'Executive access to view staff status and coordinate meetings with automatic class coverage',
            color: '#0284c7',
            bgColor: '#e0f2fe'
        },
        director: {
            label: 'Director of Academy',
            description: 'Executive access to view staff status and coordinate meetings with automatic class coverage',
            color: '#7c3aed',
            bgColor: '#f5f3ff'
        }
    };

    return (
        <div className="section">
            <StatusModal {...modalConfig} onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })} />
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 className="section-title" style={{ marginBottom: '8px' }}>Administrative & Executive Access</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                        Create user accounts for system administrators and executive staff members
                    </p>
                </div>
            </div>

            {/* Information Notice */}
            <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '28px',
                display: 'flex',
                gap: '12px',
                alignItems: 'start'
            }}>
                <Info size={18} color="#64748b" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                    Teaching staff accounts are managed through the <strong>Manage Staff</strong> module.
                    This interface is exclusively for creating administrative and executive user accounts.
                </p>
            </div>

            <div className="form-card">
                <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <Shield size={20} color="#097969" />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                            User Account Creation
                        </h3>
                    </div>
                    <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>
                        Select a role and provide the required credentials
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role Selection */}
                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label className="form-label" style={{ marginBottom: '14px', display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                            Access Level <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '14px'
                        }}>
                            {Object.entries(roleConfig).map(([role, config]) => (
                                <div
                                    key={role}
                                    onClick={() => setFormData({ ...formData, role })}
                                    style={{
                                        padding: '16px 18px',
                                        border: formData.role === role ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        backgroundColor: formData.role === role ? config.bgColor : '#ffffff',
                                        boxShadow: formData.role === role ? `0 0 0 3px ${config.color}15` : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role}
                                            checked={formData.role === role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                accentColor: config.color,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            color: formData.role === role ? config.color : '#334155',
                                            letterSpacing: '0.01em'
                                        }}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#64748b',
                                        margin: 0,
                                        lineHeight: '1.5',
                                        paddingLeft: '26px'
                                    }}>
                                        {config.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="responsive-grid" style={{ marginBottom: '24px' }}>

                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' }}>
                                Full Name <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                className="form-input"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ fontSize: '14px' }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' }}>
                                Email Address <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                className="form-input"
                                placeholder="user@institution.edu"
                                type="email"
                                pattern="^[^0-9].*"
                                title="Email should not start with a number"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ fontSize: '14px' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' }}>
                            Initial Password <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', maxWidth: '400px' }}>
                            <input
                                className="form-input"
                                placeholder="Minimum 8 characters (uppercase, lowercase, number, special character)"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
                                title="Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character"
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ paddingRight: '45px', fontSize: '14px' }}
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
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                            Users should change this password upon first login
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ minWidth: '180px' }}
                    >
                        {loading ? 'Creating Account...' : 'Create User Account'}
                    </button>
                </form>
            </div>

            {/* Role Permissions Reference */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '24px'
            }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>
                    Role Permissions Overview
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ paddingLeft: '16px', borderLeft: '3px solid #0f172a' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Administrator</div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                            Complete system control including user management, staff administration, timetable configuration,
                            attendance monitoring, leave approval, and comprehensive reporting capabilities.
                        </p>
                    </div>
                    <div style={{ paddingLeft: '16px', borderLeft: '3px solid #6366f1' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Executive Roles (Principal, Secretary, Director)</div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                            Real-time staff presence monitoring, meeting coordination with automatic class substitution,
                            and comprehensive staff status visibility across the institution.
                        </p>
                    </div>
                </div>
                <div style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: '1.6'
                }}>
                    <strong>Note:</strong> Teaching staff accounts are created through the Manage Staff module,
                    which includes BLE beacon configuration and timetable assignment.
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
