import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle, Clock, Calendar, ShieldAlert, ArrowRight } from 'lucide-react';
import Avatar from '../components/Avatar';

const SwapRequests = () => {
    const [swapRequests, setSwapRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('pending'); // 'pending', 'history'

    const fetchSwaps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/swap-requests');
            setSwapRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch swap requests', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSwaps();
    }, [fetchSwaps]);

    const handleAction = async (id, action) => {
        try {
            await api.put(`/admin/swap-request/${id}/${action}`);
            alert(`Swap request ${action} successfully.`);
            fetchSwaps();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} swap request.`);
        }
    };

    const pendingSwaps = swapRequests.filter(s => s.status === 'pending');
    const historySwaps = swapRequests.filter(s => s.status !== 'pending');

    const displaySwaps = view === 'pending' ? pendingSwaps : historySwaps;

    return (
        <div className="section" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="section-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 className="section-title" style={{ margin: 0 }}>Urgent Swap Requests</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Manage emergency staff substitution requests.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    <button 
                        onClick={() => setView('pending')}
                        style={{
                            padding: '8px 20px', borderRadius: '8px', border: 'none',
                            background: view === 'pending' ? 'white' : 'transparent',
                            color: view === 'pending' ? '#0f172a' : '#64748b',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: view === 'pending' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Pending Actions
                        {pendingSwaps.length > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>
                                {pendingSwaps.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setView('history')}
                        style={{
                            padding: '8px 20px', borderRadius: '8px', border: 'none',
                            background: view === 'history' ? 'white' : 'transparent',
                            color: view === 'history' ? '#0f172a' : '#64748b',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: view === 'history' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        History Log
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loader-container"><div className="loader"></div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {displaySwaps.length > 0 ? (
                        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                            {displaySwaps.map((swap) => (
                                <div key={swap._id} style={{
                                    background: 'white', padding: '24px', borderRadius: '24px',
                                    border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <Avatar name={swap.requesting_staff_id?.name} picturePath={swap.requesting_staff_id?.profile_picture} size={48} borderRadius="14px" />
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>{swap.requesting_staff_id?.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{swap.requesting_staff_id?.department}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                            background: swap.status === 'pending' ? '#fffbeb' : (swap.status === 'approved' ? '#f0fdf4' : '#fef2f2'),
                                            color: swap.status === 'pending' ? '#d97706' : (swap.status === 'approved' ? '#097969' : '#ef4444')
                                        }}>
                                            {swap.status}
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ShieldAlert size={16} color="#ef4444" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>URGENT SWAP REASON</div>
                                                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{swap.reason}</div>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }}></div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Calendar size={16} color="#097969" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>AFFECTED CLASSROOM</div>
                                                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{swap.classroom_id?.room_name || 'Deleted Room'}</div>
                                            </div>
                                        </div>
                                        
                                        {swap.substitute_staff_id && (
                                            <>
                                                <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }}></div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ArrowRight size={16} color="#3b82f6" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>SUBSTITUTE ACCEPTED BY</div>
                                                        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{swap.substitute_staff_id?.name}</div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {swap.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                            <button onClick={() => handleAction(swap._id, 'approve')} style={{ flex: 1, padding: '12px', background: '#097969', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                            <button onClick={() => handleAction(swap._id, 'reject')} style={{ flex: 1, padding: '12px', background: 'white', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                            <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Clock size={32} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>No Swap Requests</h3>
                            <p style={{ color: '#64748b', fontSize: '15px' }}>{view === 'pending' ? 'You have no urgent swap requests awaiting approval.' : 'No swap history recorded yet.'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SwapRequests;
