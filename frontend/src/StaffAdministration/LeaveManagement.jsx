import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, X, Clock, ChevronLeft, CheckCircle, XCircle, User, Building2, MapPin, Calendar, Plane } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PromptModal from '../components/PromptModal';
import StatusModal from '../components/StatusModal';

const LeaveManagement = () => {
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role === 'admin';
    const isExecutive = ['principal', 'secretary', 'director'].includes(authUser?.role);

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('pending'); // 'pending', 'approved', 'rejected', 'schedule'
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
            const payload = { status };
            if (isExecutive) payload.principal_notes = notes;
            else payload.admin_notes = notes;

            await api.put(`/admin/leaves/${id}`, payload);
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
    const pendingLeaves = leaves.filter(l => {
        if (isExecutive) return l.status === 'pending';
        if (isAdmin) return l.status === 'approved_by_principal';
        return false;
    });

    // Other leaves (not just 'pending' but also waiting on the other person)
    const waitingForOthers = leaves.filter(l => {
        if (isExecutive) return l.status === 'approved_by_principal';
        if (isAdmin) return l.status === 'pending';
        return false;
    });

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

            <div className="section-header-flex" style={{ marginBottom: '32px' }}>
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
                            {selectedStaff ? `${selectedStaff.name}'s ${view.charAt(0).toUpperCase() + view.slice(1)}` :
                                view === 'approved' ? 'Approved History' :
                                    view === 'rejected' ? 'Rejected History' :
                                        view === 'schedule' ? 'Coverage & Planning' :
                                            isExecutive ? 'Review Queue' : 'Review Queue'}
                        </h2>
                    </div>
                </div>
                {view === 'pending' && (
                    <button
                        className="btn-primary"
                        onClick={() => setView('schedule')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', fontSize: '13px', background: 'white', color: '#097969', border: '1px solid #097969' }}
                    >
                        <Plane size={16} /> Coverage Planning
                    </button>
                )}
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

                    {waitingForOthers.length > 0 && (
                        <div
                            className="stat-card"
                            style={{ borderLeft: '4px solid #94a3b8', background: '#f8fafc' }}
                        >
                            <div className="stat-card-top">
                                <div className="stat-icon-wrapper" style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}>
                                    <Clock size={22} />
                                </div>
                                <div className="stat-badge" style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}>Waiting</div>
                            </div>
                            <div style={{ marginTop: '16px' }}>
                                <div className="stat-value">{waitingForOthers.length}</div>
                                <div className="stat-label">{isExecutive ? 'Awaiting Final Admin Approval' : 'Awaiting Initial Executive Approval'}</div>
                            </div>
                        </div>
                    )}
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

                {/* VIEW 1: REVIEW BOARD (Pending Requests) */}
                {view === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {pendingLeaves.length > 0 ? (
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                                {pendingLeaves.map((l, i) => (
                                    <div key={i} className="summary-card section-fade" style={{
                                        padding: '28px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px'
                                    }}>
                                        {/* Status Badge & Stepper */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 12px',
                                                borderRadius: '50px',
                                                background: '#f1f5f9',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: '#64748b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                <Clock size={14} /> Step {isExecutive ? '1' : '2'} of 2
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#097969' }}></div>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAdmin ? '#097969' : '#e2e8f0' }}></div>
                                            </div>
                                        </div>

                                        {/* Staff Info */}
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '18px',
                                                background: `linear-gradient(135deg, ${isExecutive ? '#097969' : '#334155'}, ${isExecutive ? '#059669' : '#1e293b'})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: '800', fontSize: '20px',
                                                boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
                                            }}>
                                                {l.staff_id?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>{l.staff_id?.name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{l.staff_id?.department}</div>
                                            </div>
                                        </div>

                                        {/* Request Details */}
                                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Leave Type</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{l.leave_type || 'Personal Leave'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Duration</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                                                        {Math.max(1, Math.round((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1)} Days
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Dates</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '600', fontSize: '14px' }}>
                                                    <Calendar size={16} />
                                                    {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Reason</div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#475569',
                                                    lineHeight: '1.6',
                                                    fontStyle: 'italic',
                                                    padding: '12px',
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    border: '1px solid #edf2f7'
                                                }}>
                                                    "{l.reason}"
                                                </div>
                                            </div>

                                            {isAdmin && l.principal_notes && (
                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#097969', textTransform: 'uppercase', marginBottom: '6px' }}>Principal's Recommendation</div>
                                                    <div style={{ fontSize: '13px', color: '#065f46', fontWeight: '500' }}>{l.principal_notes}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                            <button
                                                className="btn-primary"
                                                style={{
                                                    flex: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '14px',
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    boxShadow: '0 4px 12px rgba(9, 121, 105, 0.2)'
                                                }}
                                                onClick={() => handleAction(l._id, 'approved')}
                                            >
                                                <CheckCircle size={18} />
                                                {isExecutive ? 'Recommend Approval' : 'Finalize Approval'}
                                            </button>
                                            <button
                                                className="btn-danger-outline"
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '14px',
                                                    fontSize: '14px',
                                                    fontWeight: '700'
                                                }}
                                                onClick={() => handleAction(l._id, 'rejected')}
                                            >
                                                <XCircle size={18} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="summary-card" style={{ padding: '100px 40px', textAlign: 'center' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#f8fafc', borderRadius: '30px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                    color: '#94a3b8'
                                }}>
                                    <Clock size={40} />
                                </div>
                                <h3 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '12px' }}>Inbox is Empty</h3>
                                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto', fontSize: '16px', lineHeight: '1.6' }}>
                                    All leave requests have been processed. You'll be notified when new applications arrive.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 4: COVERAGE & PLANNING (Calendar/List View) */}
                {view === 'schedule' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '24px', background: '#097969', borderRadius: '4px' }}></div>
                                CURRENTLY ON LEAVE (TODAY)
                            </h3>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr><th>Staff Member</th><th>Leave Type</th><th>End Date</th><th>Daily Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {approvedLeaves.filter(l => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return new Date(l.start_date) <= today && new Date(l.end_date) >= today;
                                        }).length > 0 ? (
                                            approvedLeaves.filter(l => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return new Date(l.start_date) <= today && new Date(l.end_date) >= today;
                                            }).map((l, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{l.staff_id?.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{l.staff_id?.department}</div>
                                                    </td>
                                                    <td><span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{l.leave_type}</span></td>
                                                    <td>
                                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                                                            {new Date(l.end_date).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800' }}>
                                                            Ends in {Math.max(0, Math.round((new Date(l.end_date) - new Date()) / (1000 * 60 * 60 * 24)))} days
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="status-badge" style={{ background: '#f0f9ff', color: '#0369a1', border: 'none' }}>
                                                            On Campus: NO
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No one is scheduled for leave today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '24px', background: '#0ea5e9', borderRadius: '4px' }}></div>
                                UPCOMING PLANNING (NEXT 14 DAYS)
                            </h3>
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {approvedLeaves
                                    .filter(l => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const future = new Date();
                                        future.setDate(today.getDate() + 14);
                                        return new Date(l.start_date) > today && new Date(l.start_date) <= future;
                                    })
                                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                                    .map((l, i) => (
                                        <div key={i} className="summary-card" style={{ padding: '20px', border: '1px solid #f1f5f9', background: 'white' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{l.staff_id?.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{l.staff_id?.department}</div>
                                                </div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>STARTS</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>{new Date(l.start_date).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>DURATION</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>
                                                        {Math.max(1, Math.round((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1)} Days
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: STAFF LIST DRILL-DOWN (For Approved/Rejected) */}
                {(view === 'approved' || view === 'rejected') && !selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {getStaffWithStatus(view === 'approved' ? approvedLeaves : rejectedLeaves).map(staff => (
                            <div
                                key={staff._id}
                                className="summary-card"
                                onClick={() => setSelectedStaff(staff)}
                                style={{ margin: 0, cursor: 'pointer', padding: '24px', position: 'relative', border: '1px solid #f1f5f9' }}
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
                                <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Clock size={28} color="#94a3b8" />
                                </div>
                                <p style={{ color: '#64748b', fontWeight: '600' }}>No staff records found in {view} history.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 3: STAFF SPECIFIC HISTORY CARDS */}
                {selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {getLeavesForSelectedStaff().map((l, i) => (
                            <div key={i} className="summary-card" style={{
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
                                                {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Leave Duration</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Staff Reason</div>
                                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>"{l.reason}"</div>
                                    </div>
                                    {(l.principal_notes || l.admin_notes) && (
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#097969', textTransform: 'uppercase', marginBottom: '4px' }}>Remarks</div>
                                            {l.principal_notes && <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}><strong>Principal:</strong> {l.principal_notes}</div>}
                                            {l.admin_notes && <div style={{ fontSize: '12px', color: '#1e293b' }}><strong>Admin:</strong> {l.admin_notes}</div>}
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
                .section-header-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }
                .section-fade {
                    animation: sectionFade 0.4s ease-out forwards;
                }
                @keyframes sectionFade {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .premium-loader {
                    width: 48px;
                    height: 48px;
                    border: 3px solid #f1f5f9;
                    border-top-color: #097969;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .section-header-flex {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                }
            `}} />
        </div>
    );
};

export default LeaveManagement;
