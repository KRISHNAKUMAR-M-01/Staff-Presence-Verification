import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, MapPin, Clock, BookOpen, User, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const StaffLocations = () => {
    const [locations, setLocations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/admin/staff-locations');
                setLocations(res.data);
            } catch (err) {
                console.error("Error fetching locations:", err);
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000); // Live update every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusStyles = (loc) => {
        if (loc.status === 'Tracking') return { color: '#0ea5e9', bg: '#f0f9ff', icon: <Clock size={14} /> };
        if (loc.status === 'Present') return { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={14} /> };
        if (loc.status === 'Late') return { color: '#f59e0b', bg: '#fffbeb', icon: <AlertCircle size={14} /> };
        if (loc.status === 'Left') return { color: '#64748b', bg: '#f1f5f9', icon: <MapPin size={14} /> };
        if (loc.status === 'Offline') return { color: '#94a3b8', bg: '#f8fafc', icon: <Clock size={14} /> };
        return { color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={14} /> };
    };

    const filteredLocations = locations.filter(loc =>
        loc.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.actual_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.expected_location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Live Staff Locations</h2>
                <div className="search-wrapper" style={{ width: '100%', maxWidth: '350px' }}>
                    <span className="icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder="Search staff, dept, or room..."
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="responsive-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {filteredLocations.map((loc, i) => {
                    const styles = getStatusStyles(loc);
                    return (
                        <div key={i} className="form-card" style={{
                            margin: 0,
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'default',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <User size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{loc.staff_name}</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{loc.department}</p>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    background: styles.bg,
                                    color: styles.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    textTransform: 'uppercase'
                                }}>
                                    {styles.icon}
                                    {loc.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={14} color="#94a3b8" />
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Expected: </span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{loc.expected_location}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: loc.is_correct_location ? '#f0fdf4' : '#fff1f2',
                                    border: `1px solid ${loc.is_correct_location ? '#dcfce7' : '#ffe4e6'}`
                                }}>
                                    <MapPin size={14} color={loc.is_correct_location ? '#10b981' : '#ef4444'} />
                                    <span style={{ fontSize: '13px', color: loc.is_correct_location ? '#166534' : '#991b1b', fontWeight: '500' }}>
                                        {loc.actual_location === 'Not detected' ? 'Not detected' :
                                            (loc.status === 'Tracking' || loc.status === 'Present' || loc.status === 'Late' ? `Currently in ${loc.actual_location}` : `Last seen in ${loc.actual_location}`)}
                                    </span>
                                </div>
                            </div>

                            {loc.check_in_time && (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: 'auto'
                                }}>
                                    <Clock size={12} />
                                    Last seen: {new Date(loc.check_in_time).toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredLocations.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px dashed #cbd5e1'
                    }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No staff members match your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffLocations;
