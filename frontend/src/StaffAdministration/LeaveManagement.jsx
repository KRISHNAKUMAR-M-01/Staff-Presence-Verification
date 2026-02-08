import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);

    const loadLeaves = async () => {
        const res = await api.get('/admin/leaves');
        setLeaves(res.data);
    };

    useEffect(() => { loadLeaves(); }, []);

    const handleAction = async (id, status) => {
        const notes = window.prompt(`Add notes for ${status}:`);
        try {
            await api.put(`/admin/leaves/${id}`, { status, admin_notes: notes });
            loadLeaves();
        } catch (err) { alert('Failed to update leave'); }
    };

    return (
        <div className="section">
            <h2 className="section-title">Leave Requests</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Staff</th><th>Period</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {leaves.map((l, i) => (
                            <tr key={i}>
                                <td>{l.staff_id?.name}<div style={{ fontSize: '11px', color: '#64748b' }}>{l.staff_id?.department}</div></td>
                                <td>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                                <td>{l.reason}</td>
                                <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                                <td>
                                    {l.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(l._id, 'approved')}>Approve</button>
                                            <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(l._id, 'rejected')}>Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagement;
