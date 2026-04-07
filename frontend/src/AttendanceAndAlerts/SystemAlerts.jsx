import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, X, Bell, ChevronLeft, Building2, AlertTriangle, Clock, Calendar, Plane, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staffName: ''
    });
    const [loading, setLoading] = useState(false);

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

    const getDeptIcon = (dept, count) => {
        const iconProps = { size: 26, color: count > 0 ? '#ef4444' : '#94a3b8' };
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

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.staffName) params.append('staffName', filters.staffName);
            params.append('_t', Date.now()); // Cache buster

            const res = await api.get(`/admin/alerts?${params.toString()}`);
            setAlerts(res.data);
        } catch (err) {
            console.error("Fetch alerts error:", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000); // Live update every 15s
        return () => clearInterval(interval);
    }, [fetchAlerts]);

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

    const handleDeptClick = async (dept) => {
        try {
            setSelectedDept(dept);

            // Mark all alerts in this department as read on server
            await api.put('/admin/alerts/read-by-dept', { department: dept });

            // Update local state immediately after server confirms
            // OR optimistically (we already did, but let's make it robust)
            setAlerts(prev => prev.map(al =>
                (al.department && al.department.trim() === dept.trim()) ? { ...al, is_read: true } : al
            ));

            // Background sync
            fetchAlerts();
        } catch (err) {
            console.error("Error marking alerts as read:", err);
        }
    };

    // Derived Data
    const getAlertCount = (dept) => alerts.filter(al =>
        al.department && al.department.trim() === dept.trim() && !al.is_read
    ).length;

    const filteredAlerts = alerts.filter(al => {
        const matchesDept = !selectedDept || (al.department && al.department.trim() === selectedDept.trim());
        return matchesDept;
    });

    const filteredDepts = departments.filter(d =>
        d.toLowerCase().includes(filters.staffName.toLowerCase()) ||
        alerts.some(al => al.department === d &&
            (al.staff_name.toLowerCase().includes(filters.staffName.toLowerCase()) ||
                al.message.toLowerCase().includes(filters.staffName.toLowerCase())))
    );

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {selectedDept && (
                        <button
                            onClick={() => setSelectedDept(null)}
                            className="back-btn"
                            style={{
                                width: '36px', height: '36px', background: 'white',
                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="section-title" style={{ margin: 0 }}>
                            {selectedDept ? `${selectedDept} Alerts` : 'System Alerts'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
                            {selectedDept ? `Monitoring security alerts for this department.` : 'View and manage presence verification alerts by department.'}
                        </p>
                    </div>
                </div>

                {selectedDept && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="search-wrapper" style={{ maxWidth: '250px' }}>
                            <span className="icon"><Search size={18} /></span>
                            <input
                                type="text"
                                placeholder="Search alerts..."
                                className="form-input"
                                value={filters.staffName}
                                onChange={(e) => handleCustomChange('staffName', e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Bar - Only visible in drill-down */}
            {selectedDept && (
                <div className="filter-card" style={{ marginBottom: '32px', padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <CustomDatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(val) => handleCustomChange('startDate', val)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <CustomDatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(val) => handleCustomChange('endDate', val)}
                            />
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={clearFilters}
                            style={{ height: '48px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <X size={16} /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* LEVEL 1: DEPARTMENT CARDS */}
            {!selectedDept && (
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {filteredDepts.map(dept => {
                        const count = getAlertCount(dept);
                        return (
                            <div
                                key={dept}
                                className="form-card"
                                onClick={() => handleDeptClick(dept)}
                                style={{
                                    margin: 0, cursor: 'pointer', padding: '24px',
                                    borderLeft: count > 0 ? '4px solid #ef4444' : '4px solid #e2e8f0',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '52px', height: '52px', borderRadius: '14px',
                                            background: count > 0 ? '#fef2f2' : '#f8fafc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {getDeptIcon(dept, count)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', lineHeight: 1.2 }}>{dept}</div>
                                            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', marginTop: '4px' }}>
                                                Click to view details
                                            </div>
                                        </div>
                                    </div>
                                    {count > 0 && (
                                        <div style={{
                                            background: '#ef4444', color: 'white',
                                            padding: '4px 10px', borderRadius: '20px',
                                            fontSize: '12px', fontWeight: '700',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <AlertTriangle size={12} /> {count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* LEVEL 2: ALERTS TABLE */}
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
                                <th>Time & Date</th>
                                <th>Staff Member</th>
                                <th>Location</th>
                                <th>Alert Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlerts.length > 0 ? (
                                filteredAlerts.map((al, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                                    {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {new Date(al.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{al.staff_name}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                {al.room_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                color: '#b91c1c', background: '#fef2f2',
                                                padding: '6px 12px', borderRadius: '8px',
                                                fontSize: '13px', fontWeight: '600',
                                                border: '1px solid #fee2e2'
                                            }}>
                                                <Bell size={14} />
                                                {al.message}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                                        No alerts recorded for this department in the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .back-btn:hover {
                    background: #f8fafc !important;
                    color: var(--primary) !important;
                    transform: translateX(-2px);
                }
                .form-card:hover {
                    border-color: #ef4444 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
            `}} />
        </div>
    );
};

export default SystemAlerts;
