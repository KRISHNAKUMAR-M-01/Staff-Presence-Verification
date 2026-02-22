import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, Filter, X, Calendar } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';

const AttendanceReports = () => {
    const [attendance, setAttendance] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staffName: '',
        status: 'All'
    });
    const [loading, setLoading] = useState(false);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.staffName) params.append('staffName', filters.staffName);
            if (filters.status && filters.status !== 'All') params.append('status', filters.status);

            const res = await api.get(`/admin/attendance?${params.toString()}`);
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            staffName: '',
            status: 'All'
        });
    };

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 className="section-title">Attendance Reports</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Verify and filter historical attendance data.</p>
                </div>
                <button className="btn-primary" onClick={fetchAttendance} style={{ padding: '8px 16px' }}>
                    Refresh Data
                </button>
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
                            placeholder="Search staff members..."
                        />
                    </div>

                    <div className="filter-item">
                        <CustomDatePicker
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(val) => handleCustomChange('startDate', val)}
                        />
                    </div>

                    <div className="filter-item">
                        <CustomDatePicker
                            label="End Date"
                            value={filters.endDate}
                            onChange={(val) => handleCustomChange('endDate', val)}
                        />
                    </div>

                    <div className="filter-item">
                        <CustomSelect
                            label="Status"
                            value={filters.status}
                            placeholder="Select Status"
                            options={[
                                { label: 'All Statuses', value: 'All' },
                                { label: 'Present', value: 'Present' },
                                { label: 'Late', value: 'Late' },
                                { label: 'Absent', value: 'Absent' }
                            ]}
                            onChange={(val) => handleCustomChange('status', val)}
                        />
                    </div>

                    <div className="filter-action-group">
                        <button
                            className="btn-secondary"
                            onClick={clearFilters}
                            title="Reset all filters"
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
                        <tr>
                            <th>Staff Name</th>
                            <th>Classroom</th>
                            <th>Date</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.length > 0 ? (
                            attendance.map((a, i) => {
                                // Calculate duration
                                let durationText = '---';
                                if (a.check_in_time && a.last_seen_time) {
                                    const diffMs = new Date(a.last_seen_time) - new Date(a.check_in_time);
                                    const diffMins = Math.floor(diffMs / (1000 * 60));
                                    const hrs = Math.floor(diffMins / 60);
                                    const mins = diffMins % 60;

                                    if (hrs > 0) {
                                        durationText = `${hrs}h ${mins}m`;
                                    } else {
                                        durationText = `${mins}m`;
                                    }
                                }

                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '600' }}>{a.staff_name}</td>
                                        <td>{a.room_name}</td>
                                        <td>{new Date(a.date).toLocaleDateString()}</td>
                                        <td>{new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>
                                            {a.last_seen_time ? (
                                                <span style={{ color: a.status === 'Tracking' ? 'var(--primary)' : 'inherit' }}>
                                                    {new Date(a.last_seen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            ) : '---'}
                                        </td>
                                        <td style={{ fontWeight: '500', color: '#475569' }}>{durationText}</td>
                                        <td>
                                            <span className={`status-badge status-${a.status.toLowerCase()}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No records found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default AttendanceReports;
