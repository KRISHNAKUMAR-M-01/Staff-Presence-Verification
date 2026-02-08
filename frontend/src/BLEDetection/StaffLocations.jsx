import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const StaffLocations = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/staff-locations');
            setLocations(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">Staff Locations</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Dept</th><th>Expected</th><th>Actual</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {locations.map((loc, i) => (
                            <tr key={i}>
                                <td>{loc.staff_name}</td>
                                <td>{loc.department}</td>
                                <td>{loc.expected_location}</td>
                                <td>{loc.actual_location}</td>
                                <td className={loc.is_correct_location ? 'location-correct' : 'location-incorrect'}>
                                    {loc.is_correct_location ? 'Correct' : 'Not Present'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffLocations;
