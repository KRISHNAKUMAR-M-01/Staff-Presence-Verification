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
                        <tr>
                            <th>Date</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map((a, i) => {
                            // Calculate duration
                            let durationText = '---';
                            if (a.check_in_time && a.last_seen_time) {
                                const diffMs = new Date(a.last_seen_time) - new Date(a.check_in_time);
                                const diffMins = Math.floor(diffMs / (1000 * 60));
                                const hrs = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                durationText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                            }

                            return (
                                <tr key={i}>
                                    <td>{new Date(a.date).toLocaleDateString()}</td>
                                    <td>{a.classroom_id?.room_name}</td>
                                    <td>{new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>
                                        {a.last_seen_time ? (
                                            <span style={{ color: a.status === 'Tracking' ? 'var(--primary)' : 'inherit' }}>
                                                {new Date(a.last_seen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        ) : '---'}
                                    </td>
                                    <td style={{ fontWeight: '500' }}>{durationText}</td>
                                    <td>
                                        <span className={`status-badge status-${a.status.toLowerCase()}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyAttendance;
