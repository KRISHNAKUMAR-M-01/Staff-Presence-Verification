import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MyTimetable = () => {
    const [timetable, setTimetable] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const res = await api.get('/staff/my-timetable');
            setTimetable(res.data);
        };
        fetch();
    }, []);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="section">
            <h2 className="section-title">My Weekly Schedule</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Day</th><th>Room</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                        {days.map(day => {
                            const slots = timetable.filter(t => t.day_of_week === day);
                            if (slots.length === 0) return null;
                            return slots.map((s, i) => (
                                <tr key={`${day}-${i}`}>
                                    {i === 0 && <td rowSpan={slots.length} style={{ fontWeight: '700', color: '#4f46e5' }}>{day}</td>}
                                    <td>{s.classroom_id?.room_name}</td>
                                    <td>{s.start_time} - {s.end_time}</td>
                                </tr>
                            ));
                        })}
                        {timetable.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>No schedule assigned</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyTimetable;
