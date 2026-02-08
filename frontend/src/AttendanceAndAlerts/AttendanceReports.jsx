import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AttendanceReports = () => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/admin/attendance');
            setAttendance(res.data);
        };
        fetch();
    }, []);

    return (
        <div className="section">
            <h2 className="section-title">Attendance Reports</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Room</th><th>Check-in</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {attendance.map((a, i) => (
                            <tr key={i}>
                                <td>{a.staff_name}</td>
                                <td>{a.room_name}</td>
                                <td>{new Date(a.check_in_time).toLocaleString()}</td>
                                <td><span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceReports;
