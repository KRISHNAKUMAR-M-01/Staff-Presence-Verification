import React, { useState, useEffect } from 'react';
import { Plane, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';

const MyLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [isSingleDay, setIsSingleDay] = useState(true);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', leave_type: 'Personal Leave', reason: '' });

    const fetchLeaves = async () => {
        const res = await api.get('/staff/my-leaves');
        setLeaves(res.data);
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (isSingleDay) {
                data.end_date = data.start_date;
            }
            await api.post('/staff/leave', data);
            alert('Leave request submitted successfully!');
            setFormData({ start_date: '', end_date: '', leave_type: 'Personal Leave', reason: '' });
            fetchLeaves();
        } catch (err) { alert('Failed to submit leave request'); }
    };

    return (
        <div className="section">
            <h2 className="section-title">Leave Management</h2>

            <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <h3 className="card-title" style={{ marginBottom: '4px' }}>Submit Leave Request</h3>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Apply for a single day or a specific date range</p>
                    </div>
                    <div className="toggle-wrapper">
                        <button
                            onClick={() => setIsSingleDay(true)}
                            className={`toggle-item ${isSingleDay ? 'active' : ''}`}
                        >Single Day</button>
                        <button
                            onClick={() => setIsSingleDay(false)}
                            className={`toggle-item ${!isSingleDay ? 'active' : ''}`}
                        >Date Range</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={`leave-form-grid ${isSingleDay ? 'single-day' : 'multi-day'}`}>
                        <CustomSelect
                            label={<><Plane size={14} /> REASON FOR LEAVE</>}
                            required
                            placeholder="Select Leave Type"
                            value={formData.leave_type}
                            options={['Personal Leave', 'Medical Leave', 'Duty Leave'].map(l => ({ value: l, label: l }))}
                            onChange={val => setFormData({ ...formData, leave_type: val })}
                        />

                        <CustomDatePicker
                            label={isSingleDay ? 'SELECT DATE' : 'START DATE'}
                            value={formData.start_date}
                            onChange={val => setFormData({ ...formData, start_date: val })}
                            required
                        />

                        {!isSingleDay && (
                            <CustomDatePicker
                                label="END DATE"
                                value={formData.end_date}
                                onChange={val => setFormData({ ...formData, end_date: val })}
                                required
                            />
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label required-label-asterisk">
                            <AlertCircle size={14} /> ADDITIONAL COMMENTS
                        </label>
                        <textarea className="form-textarea" rows="4" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Please provide additional context for this request..." required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary">
                            Submit Application
                        </button>
                    </div>
                </form>
            </div>

            <h3 className="card-title" style={{ marginTop: '32px' }}>Request History</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Start Date</th><th>End Date</th><th>Type</th><th>Reason</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {leaves.map((l, i) => (
                            <tr key={i}>
                                <td>{new Date(l.start_date).toLocaleDateString()}</td>
                                <td>{new Date(l.end_date).toLocaleDateString()}</td>
                                <td>{l.leave_type}</td>
                                <td>{l.reason}</td>
                                <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                            </tr>
                        ))}
                        {leaves.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No leave requests found</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyLeaves;
