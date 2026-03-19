import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, Plane, User, MapPin, Clock, ChevronLeft, Building2, History, Search, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot } from 'lucide-react';
import api from '../services/api';

const AdminOverview = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ totalStaff: 0, totalClassrooms: 0, presentToday: 0, lateToday: 0, pendingLeaves: 0, liveTrackingStaff: 0, absentOnLeave: 0 });
    const [allStaff, setAllStaff] = useState([]);

    // Drill-down state
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffHistory, setStaffHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await api.get('/admin/dashboard-stats');
                setStats(statsData.data);
                const staffData = await api.get('/admin/staff');
                setAllStaff(staffData.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // When staff is selected, fetch their specific history
    useEffect(() => {
        if (selectedStaff) {
            const fetchHistory = async () => {
                try {
                    const res = await api.get(`/admin/attendance?staffName=${encodeURIComponent(selectedStaff.name)}`);
                    setStaffHistory(res.data);
                } catch (err) { console.error(err); }
            };
            fetchHistory();
        } else {
            setStaffHistory([]);
        }
    }, [selectedStaff]);

    const statItems = [
        { label: 'Live Tracking Staffs', value: stats.liveTrackingStaff || 0, icon: <Activity size={22} />, color: '#097969', accent: '#e6fcf9' },
        { label: 'Absent on Leave', value: stats.absentOnLeave || 0, icon: <Plane size={22} />, color: '#d97706', accent: '#fffbeb' }
    ];

    // Grouping logic
    const departments = [...new Set(allStaff.map(s => s.department))].sort();

    const getStaffInDept = (dept) => {
        return allStaff.filter(s => s.department === dept && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    };

    const getDeptsMatchingSearch = () => {
        if (!searchQuery) return departments;
        return departments.filter(d =>
            d.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getStaffInDept(d).length > 0
        );
    };

    const getDeptIcon = (dept) => {
        const iconProps = { size: 24, color: "#097969" };
        switch (dept) {
            case "Aeronautical Engineering": return <Plane {...iconProps} />;
            case "Agricultural Engineering": return <Sprout {...iconProps} />;
            case "Artificial Intelligence and Data Science": return <Brain {...iconProps} />;
            case "Automobile Engineering": return <Car {...iconProps} />;
            case "Biomedical Engineering": return <Activity {...iconProps} />;
            case "Chemical Engineering": return <FlaskConical {...iconProps} />;
            case "Civil Engineering": return <Compass {...iconProps} />;
            case "Computer Science and Business Systems": return <Code {...iconProps} />;
            case "Computer Science and Engineering": return <Monitor {...iconProps} />;
            case "Electrical and Electronics Engineering": return <Zap {...iconProps} />;
            case "Electronics and Communication Engineering": return <Cpu {...iconProps} />;
            case "Information Technology": return <Globe {...iconProps} />;
            case "Mechanical Engineering": return <Settings {...iconProps} />;
            case "Mechatronics Engineering": return <Bot {...iconProps} />;
            default: return <Building2 {...iconProps} />;
        }
    };

    return (
        <div className="section">
            <div className="section-header" style={{ marginBottom: '32px' }}>
                <h2 className="section-title" style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Welcome back, {user.name}. Here's what's happening today.</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                {statItems.map((item, id) => (
                    <div className="stat-card" key={id} style={{ borderLeft: `4px solid ${item.color}` }}>
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper" style={{ color: item.color, backgroundColor: item.accent }}>
                                {item.icon}
                            </div>
                            <div className="stat-badge" style={{ color: item.color, backgroundColor: item.accent }}>
                                Live Update
                            </div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div className="stat-value" style={{ fontSize: '32px' }}>{item.value}</div>
                            <div className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', opacity: 0.8 }}>{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Header with Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '40px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {(selectedDept || selectedStaff) && (
                        <button
                            onClick={() => {
                                if (selectedStaff) setSelectedStaff(null);
                                else if (selectedDept) setSelectedDept(null);
                                setSearchQuery('');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                            {selectedStaff ? `${selectedStaff.name}'s Activity` : selectedDept ? `${selectedDept} Staff` : 'Recent Activity'}
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                            {selectedStaff ? 'View movement history for this staff member' : 'Select a staff member to view their movements'}
                        </p>
                    </div>
                </div>

                {!selectedStaff && (
                    <div className="search-wrapper" style={{ width: '100%', maxWidth: '260px' }}>
                        <span className="icon"><Search size={16} /></span>
                        <input
                            type="text"
                            placeholder="Search staff or department..."
                            className="form-input"
                            style={{ padding: '8px 12px 8px 36px', height: '36px', fontSize: '13px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Drill-down UI */}
            <div style={{ minHeight: '300px' }}>

                {/* 1. Department List */}
                {!selectedDept && !selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {getDeptsMatchingSearch().map(dept => (
                            <div
                                key={dept}
                                className="form-card"
                                onClick={() => setSelectedDept(dept)}
                                style={{ margin: 0, cursor: 'pointer', padding: '24px', transition: 'all 0.3s', border: '1px solid #e2e8f0' }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#097969';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e6fcf9', color: '#097969', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getDeptIcon(dept)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{dept}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{allStaff.filter(s => s.department === dept).length} Staff Members</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Staff List in Department */}
                {selectedDept && !selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {getStaffInDept(selectedDept).map(staff => (
                            <div
                                key={staff._id}
                                className="form-card"
                                onClick={() => setSelectedStaff(staff)}
                                style={{ margin: 0, cursor: 'pointer', padding: '20px', transition: 'all 0.3s', border: '1px solid #e2e8f0' }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#097969';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{staff.name}</div>
                                        {staff.is_hod && <span style={{ fontSize: '10px', color: '#097969', background: '#e6fcf9', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>HOD</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {getStaffInDept(selectedDept).length === 0 && (
                            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px' }}>No staff found in this department matching your search.</p>
                        )}
                    </div>
                )}

                {/* 3. Staff Activity History */}
                {selectedStaff && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {staffHistory.length > 0 ? (
                            staffHistory.map((item, i) => {
                                const isPresent = item.status === 'Present';
                                return (
                                    <div key={i} className="activity-card" style={{
                                        background: isPresent ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
                                        borderRadius: '24px',
                                        padding: '24px',
                                        border: '1px solid',
                                        borderColor: isPresent ? '#bbf7d0' : '#f1f5f9',
                                        boxShadow: isPresent
                                            ? '0 20px 25px -5px rgba(22, 163, 74, 0.05), 0 8px 10px -6px rgba(22, 163, 74, 0.05)'
                                            : '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: 'default'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '14px',
                                                    background: isPresent ? '#dcfce7' : '#f8fafc',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid',
                                                    borderColor: isPresent ? '#86efac' : '#e2e8f0'
                                                }}>
                                                    <User size={22} color={isPresent ? '#166534' : '#64748b'} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a', letterSpacing: '-0.01em' }}>{selectedStaff.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{selectedStaff.department}</div>
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: '10px',
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                background: isPresent ? '#16a34a' : item.status === 'Late' ? '#f59e0b' : '#f1f5f9',
                                                color: isPresent ? '#ffffff' : item.status === 'Late' ? '#ffffff' : '#64748b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em'
                                            }}>
                                                {item.status}
                                            </div>
                                        </div>

                                        <div style={{
                                            background: isPresent ? 'rgba(255, 255, 255, 0.6)' : '#f8fafc',
                                            backdropFilter: 'blur(8px)',
                                            borderRadius: '20px',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            border: '1px solid',
                                            borderColor: isPresent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.02)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                                                    <MapPin size={14} color="#16a34a" />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{item.room_name}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14} color="#94a3b8" />
                                                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>
                                                        {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div style={{ width: '1px', height: '10px', background: '#e2e8f0' }}></div>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                                                    {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <History size={28} color="#94a3b8" />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No History Found</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>There are no movement logs for {selectedStaff.name} yet.</p>
                            </div>
                        )}

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .activity-card:hover {
                                transform: translateY(-8px) scale(1.02);
                                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
                            }
                        `}} />
                    </div>
                )}
            </div>

            {/* Empty state for root level */}
            {!selectedDept && !selectedStaff && getDeptsMatchingSearch().length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b' }}>No departments found.</p>
                </div>
            )}
        </div>
    );
};

export default AdminOverview;
