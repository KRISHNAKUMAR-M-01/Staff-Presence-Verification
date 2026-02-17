import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, Filter, X, Bell } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staffName: ''
    });
    const [loading, setLoading] = useState(false);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.staffName) params.append('staffName', filters.staffName);

            const res = await api.get(`/admin/alerts?${params.toString()}`);
            setAlerts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

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
            staffName: ''
        });
    };

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 className="section-title">System Alerts</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monitor security and presence verification alerts.</p>
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
                        <tr>
                            <th>Time</th>
                            <th>Staff</th>
                            <th>Room</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.length > 0 ? (
                            alerts.map((al, i) => (
                                <tr key={i}>
                                    <td>{new Date(al.timestamp).toLocaleString()}</td>
                                    <td style={{ fontWeight: '600' }}>{al.staff_name}</td>
                                    <td>{al.room_name}</td>
                                    <td style={{ color: '#ef4444', fontWeight: '500' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Bell size={14} />
                                            {al.message}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No alerts found for the selected period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SystemAlerts;
