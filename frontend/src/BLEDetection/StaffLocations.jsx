import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search } from 'lucide-react';

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

    return (
        <div className="section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Live Staff Locations</h2>
                <div className="search-wrapper" style={{ maxWidth: '300px' }}>
                    <span className="icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder="Search staff or room..."
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Staff</th>
                            <th>Dept</th>
                            <th>Expected</th>
                            <th>Actual</th>
                            <th>Check-in Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations
                            .filter(loc =>
                                loc.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                loc.actual_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                loc.expected_location.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((loc, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: '600' }}>{loc.staff_name}</td>
                                    <td>{loc.department}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{loc.expected_location}</td>
                                    <td style={{ fontWeight: '500' }}>
                                        {loc.actual_location === 'Not in Any Room'
                                            ? <span style={{ color: '#94a3b8' }}>{loc.actual_location}</span>
                                            : loc.actual_location
                                        }
                                    </td>
                                    <td>
                                        {loc.check_in_time
                                            ? new Date(loc.check_in_time).toLocaleTimeString()
                                            : '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${loc.is_correct_location || loc.status === 'Present' || loc.status === 'Tracking' ? 'status-present' : 'status-absent'}`}>
                                            {loc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        {locations.length > 0 && locations.filter(loc =>
                            loc.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            loc.actual_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            loc.expected_location.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No matching locations found.</td></tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffLocations;
