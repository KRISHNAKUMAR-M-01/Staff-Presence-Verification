import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MyAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [attRes, leaveRes] = await Promise.all([
                    api.get('/staff/my-attendance'),
                    api.get('/staff/my-leaves')
                ]);
                setAttendance(attRes.data);
                setLeaves(leaveRes.data.filter(l => l.status === 'approved'));
            } catch (err) {
                console.error('Error fetching attendance/leaves:', err);
            }
        };
        fetch();
    }, []);

    const isOnApprovedLeave = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return leaves.some(l => {
            const start = new Date(l.start_date); start.setHours(0, 0, 0, 0);
            const end   = new Date(l.end_date);   end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        });
    };

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
                            const onLeave = isOnApprovedLeave(a.date);
                            
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
                                <tr key={i} style={onLeave ? { background: '#f8fafc' } : {}}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{new Date(a.date).toLocaleDateString()}</div>
                                        {onLeave && <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: '700' }}>OFFICIAL LEAVE</div>}
                                    </td>
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
                                        {onLeave ? (
                                            <span className="status-badge" style={{ background: '#ecfeff', color: '#0891b2', border: 'none' }}>
                                                Excused
                                            </span>
                                        ) : (
                                            <span className={`status-badge status-${a.status.toLowerCase()}`}>
                                                {a.status}
                                            </span>
                                        )}
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
