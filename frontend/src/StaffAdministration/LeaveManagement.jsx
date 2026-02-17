import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, Filter, X, Clock } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [filters, setFilters] = useState({
        status: 'All',
        staffName: '',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);

    const loadLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'All') params.append('status', filters.status);
            if (filters.staffName) params.append('staffName', filters.staffName);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await api.get(`/admin/leaves?${params.toString()}`);
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { loadLeaves(); }, [loadLeaves]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'All',
            staffName: '',
            startDate: '',
            endDate: ''
        });
    };

    const handleAction = async (id, status) => {
        const notes = window.prompt(`Add notes for ${status}:`);
        try {
            await api.put(`/admin/leaves/${id}`, { status, admin_notes: notes });
            loadLeaves();
        } catch (err) { alert('Failed to update leave'); }
    };

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 className="section-title">Leave Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Review, approve, and filter historical leave requests.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-card">
                <div className="filter-row">
                    <div className="search-wrapper">
                        <span className="icon"><Search size={18} /></span>
                        <input
                            type="text"
                            name="staffName"
                            className="form-input"
                            value={filters.staffName}
                            onChange={handleFilterChange}
                            placeholder="Search by staff name..."
                        />
                    </div>

                    <div className="filter-item">
                        <CustomSelect
                            label="Status"
                            value={filters.status}
                            placeholder="Select Status"
                            options={[
                                { label: 'All Statuses', value: 'All' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Rejected', value: 'rejected' }
                            ]}
                            onChange={(val) => handleCustomChange('status', val)}
                        />
                    </div>

                    <div className="filter-item">
                        <CustomDatePicker
                            label="From Date"
                            value={filters.startDate}
                            onChange={(val) => handleCustomChange('startDate', val)}
                        />
                    </div>

                    <div className="filter-item">
                        <CustomDatePicker
                            label="To Date"
                            value={filters.endDate}
                            onChange={(val) => handleCustomChange('endDate', val)}
                        />
                    </div>

                    <div className="filter-action-group">
                        <button
                            className="btn-secondary"
                            onClick={clearFilters}
                            title="Reset filters"
                            style={{ height: '44px' }}
                        >
                            <X size={16} /> Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-container" style={{ position: 'relative' }}>
                {loading && (
                    <div className="loader-container">
                        <div className="premium-loader"></div>
                    </div>
                )}
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Period</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {leaves.length > 0 ? (
                            leaves.map((l, i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{l.staff_id?.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{l.staff_id?.department}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} color="#94a3b8" />
                                            {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>{l.reason}</td>
                                    <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                                    <td>
                                        {l.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleAction(l._id, 'approved')}>Approve</button>
                                                <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleAction(l._id, 'rejected')}>Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No leave requests found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagement;
