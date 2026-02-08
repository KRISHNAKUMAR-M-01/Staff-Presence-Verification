import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/alerts');
            setAlerts(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">System Alerts</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Time</th><th>Staff</th><th>Room</th><th>Message</th></tr>
                    </thead>
                    <tbody>
                        {alerts.map((al, i) => (
                            <tr key={i}>
                                <td>{new Date(al.timestamp).toLocaleString()}</td>
                                <td>{al.staff_name}</td>
                                <td>{al.room_name}</td>
                                <td style={{ color: '#ef4444', fontWeight: '500' }}>{al.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SystemAlerts;
