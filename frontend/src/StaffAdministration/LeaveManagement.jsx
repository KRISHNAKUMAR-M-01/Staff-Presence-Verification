import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, X, Clock, ChevronLeft, CheckCircle, XCircle, User, Building2, MapPin, Calendar } from 'lucide-react';
import PromptModal from '../components/PromptModal';
import StatusModal from '../components/StatusModal';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('pending'); // 'pending', 'approved', 'rejected'
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [promptConfig, setPromptConfig] = useState({ isOpen: false, id: null, status: '' });

    const loadLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/leaves');
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadLeaves(); }, [loadLeaves]);

    const handleAction = async (id, status) => {
        setPromptConfig({ isOpen: true, id, status });
    };

    const confirmAction = async (notes) => {
        const { id, status } = promptConfig;
        try {
            await api.put(`/admin/leaves/${id}`, { status, admin_notes: notes });
            setPromptConfig({ isOpen: false, id: null, status: '' });
            loadLeaves();
            setModalConfig({
                isOpen: true,
                type: 'success',
                title: status === 'approved' ? 'Leave Approved' : 'Leave Rejected',
                message: `The leave application status has been updated to ${status}.`
            });
        } catch (err) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Action Failed',
                message: 'Could not update the leave status. Please try again.'
            });
        }
    };

    // Filter Logic
    const pendingLeaves = leaves.filter(l => l.status === 'pending');
    const approvedLeaves = leaves.filter(l => l.status === 'approved');
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

    const getStaffWithStatus = (statusLeaves) => {
        const staffMap = new Map();
        statusLeaves.forEach(l => {
            const staff = l.staff_id;
            if (staff && !staffMap.has(staff._id)) {
                staffMap.set(staff._id, { ...staff, count: statusLeaves.filter(sl => sl.staff_id?._id === staff._id).length });
            }
        });
        return Array.from(staffMap.values()).filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.department?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const getLeavesForSelectedStaff = () => {
        const pool = view === 'approved' ? approvedLeaves : rejectedLeaves;
        return pool.filter(l => l.staff_id?._id === selectedStaff?._id);
    };

    return (
        <div className="section">
            <StatusModal {...modalConfig} onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })} />
            <PromptModal
                isOpen={promptConfig.isOpen}
                title={promptConfig.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
                message={`Please provide any administration remarks for this ${promptConfig.status} decision.`}
                onConfirm={confirmAction}
                onCancel={() => setPromptConfig({ isOpen: false, id: null, status: '' })}
            />

            <div className="section-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {view !== 'pending' && (
                        <button
                            onClick={() => {
                                if (selectedStaff) setSelectedStaff(null);
                                else setView('pending');
                                setSearchQuery('');
                            }}
                            className="back-btn"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '36px', height: '36px', background: 'white',
                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="section-title" style={{ margin: 0 }}>
                            {selectedStaff ? `${selectedStaff.name}'s ${view.charAt(0).toUpperCase() + view.slice(1)} Leaves` :
                                view === 'approved' ? 'Approved History' :
                                    view === 'rejected' ? 'Rejected History' :
                                        'Leave Management'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
                            {view === 'pending' ? 'Review and manage incoming leave applications.' :
                                `Viewing all ${view} leave records.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Navigation: Stat Cards (Only visible on Pending root view) */}
            {view === 'pending' && (
                <div className="stats-grid" style={{ marginBottom: '40px' }}>
                    <div
                        className="stat-card"
                        onClick={() => { setView('approved'); setSearchQuery(''); }}
                        style={{ borderLeft: '4px solid #097969', cursor: 'pointer', transition: 'all 0.3s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{ color: '#097969', backgroundColor: '#e6fcf9' }}>
                                <CheckCircle size={22} />
                            </div>
                            <div className="stat-badge" style={{ color: '#097969', backgroundColor: '#e6fcf9' }}>History</div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div className="stat-value">{approvedLeaves.length}</div>
                            <div className="stat-label">Approved Requests</div>
                        </div>
                    </div>

                    <div
                        className="stat-card"
                        onClick={() => { setView('rejected'); setSearchQuery(''); }}
                        style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer', transition: 'all 0.3s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>
                                <XCircle size={22} />
                            </div>
                            <div className="stat-badge" style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>History</div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div className="stat-value">{rejectedLeaves.length}</div>
                            <div className="stat-label">Rejected Requests</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Header with Search (Visible only during History views) */}
            {view !== 'pending' && !selectedStaff && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
                            Select Staff to view {view} history
                        </h4>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                            Showing {getStaffWithStatus(view === 'approved' ? approvedLeaves : rejectedLeaves).length} staff members
                        </p>
                    </div>
                    <div className="search-wrapper" style={{ width: '100%', maxWidth: '300px' }}>
                        <span className="icon"><Search size={18} /></span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search staff or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="content-area" style={{ minHeight: '400px', position: 'relative' }}>
                {loading && (
                    <div className="loader-container">
                        <div className="premium-loader"></div>
                    </div>
                )}

                {/* VIEW 1: PENDING REQUESTS TABLE */}
                {view === 'pending' && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Staff</th><th>Period</th><th>Reason</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {pendingLeaves.length > 0 ? (
                                    pendingLeaves.map((l, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{l.staff_id?.name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{l.staff_id?.department}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>
                                                    <Calendar size={14} color="#097969" />
                                                    {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '300px', color: '#64748b', fontSize: '14px' }}>{l.reason}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }} onClick={() => handleAction(l._id, 'approved')}>Approve</button>
                                                    <button className="btn-danger-outline" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }} onClick={() => handleAction(l._id, 'rejected')}>Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '80px' }}>
                                            <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                                <Clock size={28} color="#94a3b8" />
                                            </div>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No Pending Requests</h4>
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>All caught up! New leave applications will appear here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* VIEW 2: STAFF LIST DRILL-DOWN (For Approved/Rejected) */}
                {(view !== 'pending' && !selectedStaff) && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {getStaffWithStatus(view === 'approved' ? approvedLeaves : rejectedLeaves).map(staff => (
                            <div
                                key={staff._id}
                                className="form-card"
                                onClick={() => setSelectedStaff(staff)}
                                style={{ margin: 0, cursor: 'pointer', padding: '24px', position: 'relative' }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                        <User size={26} color="#64748b" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '17px', color: '#0f172a' }}>{staff.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
                                            <Building2 size={12} /> {staff.department}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    position: 'absolute', top: '24px', right: '24px',
                                    background: view === 'approved' ? '#e6fcf9' : '#fee2e2',
                                    color: view === 'approved' ? '#097969' : '#ef4444',
                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800'
                                }}>
                                    {staff.count} {staff.count === 1 ? 'Record' : 'Records'}
                                </div>
                            </div>
                        ))}
                        {getStaffWithStatus(view === 'approved' ? approvedLeaves : rejectedLeaves).length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px' }}>
                                <p style={{ color: '#64748b' }}>No staff records found in {view} history.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 3: STAFF SPECIFIC HISTORY CARDS */}
                {selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {getLeavesForSelectedStaff().map((l, i) => (
                            <div key={i} className="activity-card" style={{
                                padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{
                                        padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800',
                                        background: view === 'approved' ? '#e6fcf9' : '#fee2e2',
                                        color: view === 'approved' ? '#097969' : '#ef4444',
                                        textTransform: 'uppercase'
                                    }}>
                                        {view}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                        #{i + 1}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                                            <Calendar size={16} color="#097969" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                                                {new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Leave Duration</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Staff Reason</div>
                                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>"{l.reason}"</div>
                                    </div>
                                    {l.admin_notes && (
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#097969', textTransform: 'uppercase', marginBottom: '4px' }}>Admin Remarks</div>
                                            <div style={{ fontSize: '13px', color: '#1e293b', fontStyle: 'italic' }}>{l.admin_notes}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .stat-card.active {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1);
                    border-color: var(--primary);
                }
                .back-btn:hover {
                    background: #f8fafc !important;
                    transform: translateX(-2px);
                }
                .btn-danger-outline {
                    background: transparent;
                    border: 1px solid #fee2e2;
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

export default LeaveManagement;
