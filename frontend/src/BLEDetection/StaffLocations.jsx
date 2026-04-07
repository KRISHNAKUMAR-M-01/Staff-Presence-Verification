// StaffLocations.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, MapPin, Clock, User, CheckCircle, AlertCircle, XCircle, ChevronLeft, Building2, Plane, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot } from 'lucide-react';
import Avatar from '../components/Avatar';

const StaffLocations = () => {
    const [locations, setLocations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/admin/staff-locations');
                setLocations(res.data);
            } catch (err) {
                console.error("Error fetching locations:", err);
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000); // Live update every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusStyles = (loc) => {
        if (loc.status === 'On Leave') return { color: '#0ea5e9', bg: '#f0f9ff', icon: <Plane size={14} />, label: 'Leave' };
        if (loc.status === 'Tracking' || loc.status === 'Present' || loc.status === 'Late') 
            return { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={14} />, label: 'Tracking ID Signal Found' };
        return { color: '#d97706', bg: '#fffbeb', icon: <Search size={14} />, label: 'Scanning' };
    };

    const filteredLocations = locations.filter(loc => {
        const staffMatchesSearch = loc.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.actual_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.expected_location.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedDept) {
            // If a department is selected, only show staff from that department
            // and apply search only to staff details
            return loc.department === selectedDept && staffMatchesSearch;
        } else {
            // If no department is selected, apply search across all fields including department name
            return staffMatchesSearch || loc.department.toLowerCase().includes(searchQuery.toLowerCase());
        }
    });

    const groupedLocations = filteredLocations.reduce((acc, loc) => {
        const dept = loc.department || 'Unknown Department';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(loc);
        return acc;
    }, {});

    const getDeptIcon = (dept) => {
        const iconProps = { size: 28, color: "#097969" };
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
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {selectedDept && (
                        <button
                            onClick={() => {
                                setSelectedDept(null);
                                setSearchQuery('');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h2 className="section-title" style={{ margin: 0 }}>
                        {selectedDept ? selectedDept : 'Live Staff Locations'}
                    </h2>
                </div>

                <div className="search-wrapper" style={{ width: '100%', maxWidth: '280px' }}>
                    <span className="icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder={selectedDept ? "Search staff in " + selectedDept + "..." : "Search staff, dept, or room..."}
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!selectedDept ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
                        {Object.keys(groupedLocations).length > 0 ? (
                            Object.entries(groupedLocations).map(([dept, deptLocations]) => (
                                <div
                                    key={dept}
                                    className="form-card"
                                    onClick={() => setSelectedDept(dept)}
                                    style={{
                                        margin: 0,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                        padding: '24px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: '1px solid #e2e8f0',
                                        background: 'white'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(9, 121, 105, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '16px',
                                            background: '#e6fcf9',
                                            color: '#097969',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getDeptIcon(dept)}
                                        </div>
                                        <span style={{
                                            background: '#f8fafc',
                                            color: '#475569',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {deptLocations.length} Staff member{deptLocations.length !== 1 && 's'}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>{dept}</h3>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No departments match your search criteria.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
                        {(groupedLocations[selectedDept] || []).length > 0 ? (
                            groupedLocations[selectedDept].map((loc, i) => {
                                const styles = getStatusStyles(loc);
                                return (
                                    <div key={i} className="form-card" style={{
                                        margin: 0,
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'default',
                                        border: '1px solid #e2e8f0',
                                        background: 'white'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '100%' }}>
                                                <Avatar 
                                                    name={loc.staff_name} 
                                                    picturePath={loc.profile_picture}
                                                    size={40}
                                                    borderRadius="10px"
                                                />
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{loc.staff_name}</h3>
                                                    {loc.is_hod && <span style={{ padding: '2px 6px', backgroundColor: '#65c6b7', color: '#097969', borderRadius: '4px', fontSize: '10px', fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>HOD</span>}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                background: styles.bg,
                                                color: styles.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {styles.icon}
                                                {styles.label}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} color="#94a3b8" />
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>Expected: </span>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{loc.expected_location}</span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                padding: '10px',
                                                borderRadius: '12px',
                                                background: loc.status === 'On Leave' ? '#eff6ff' : (loc.is_correct_location ? '#f0fdf4' : (loc.status === 'Scanning' || loc.status === 'Left' || loc.status === 'Absent' ? '#fffbeb' : '#fff1f2')),
                                                border: `1px solid ${loc.status === 'On Leave' ? '#dbeafe' : (loc.is_correct_location ? '#dcfce7' : (loc.status === 'Scanning' || loc.status === 'Left' || loc.status === 'Absent' ? '#fef3c7' : '#ffe4e6'))}`,
                                                marginTop: '4px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MapPin size={14} color={loc.status === 'On Leave' ? '#0ea5e9' : (loc.is_correct_location ? '#10b981' : (loc.status === 'Scanning' || loc.status === 'Left' || loc.status === 'Absent' ? '#d97706' : '#ef4444'))} />
                                                    <span style={{ fontSize: '13px', color: loc.status === 'On Leave' ? '#0369a1' : (loc.is_correct_location ? '#166534' : (loc.status === 'Scanning' || loc.status === 'Left' || loc.status === 'Absent' ? '#92400e' : '#991b1b')), fontWeight: '700' }}>
                                                        {loc.status === 'On Leave' 
                                                            ? 'Not on Campus' 
                                                            : (loc.status === 'Tracking' || loc.status === 'Present' || loc.status === 'Late' 
                                                                ? `Currently in ${loc.actual_location}` 
                                                                : 'Not in Range')}
                                                    </span>
                                                </div>
                                                
                                                {loc.check_in_time && (
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        paddingTop: '6px', 
                                                        borderTop: '1px dashed rgba(0,0,0,0.05)',
                                                        marginTop: '2px',
                                                        fontSize: '11px',
                                                        color: loc.status === 'On Leave' ? '#60a5fa' : (loc.status === 'Scanning' || loc.status === 'Left' || loc.status === 'Absent' ? '#d97706' : '#94a3b8'),
                                                        fontWeight: '600'
                                                    }}>
                                                        <Clock size={12} />
                                                        Last seen: {(() => {
                                                            if (!loc.check_in_time) return 'No Signal Recorded';
                                                            const d = new Date(loc.check_in_time);
                                                            const today = new Date();
                                                            const isToday = d.toDateString() === today.toDateString();
                                                            const timeStr = isToday 
                                                                ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                            return `${timeStr} in ${loc.last_seen_location || 'unknown'}`;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No staff members match your search criteria in this department.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffLocations;
