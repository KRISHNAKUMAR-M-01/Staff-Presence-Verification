import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MyAttendance = () => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/staff/my-attendance');
            setAttendance(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">My Attendance Records</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Room</th><th>Check-in</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {attendance.map((a, i) => (
                            <tr key={i}>
                                <td>{new Date(a.date).toLocaleDateString()}</td>
                                <td>{a.classroom_id?.room_name}</td>
                                <td>{new Date(a.check_in_time).toLocaleTimeString()}</td>
                                <td><span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyAttendance;
