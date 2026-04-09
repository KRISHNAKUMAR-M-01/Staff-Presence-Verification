import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, X, ChevronLeft, Building2, User, UserCheck, Clock, Calendar, ArrowRight, Home, AlertCircle, Plane, Sprout, Brain, Car, Activity, FlaskConical, Compass, Code, Monitor, Zap, Cpu, Globe, Settings, Bot } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import Avatar from '../components/Avatar';

const AttendanceReports = () => {
    const [attendance, setAttendance] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null); // Level 3 drill-down
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staffName: '',
        status: 'All'
    });
    const [loading, setLoading] = useState(false);

    const departments = [
        "Aeronautical Engineering",
        "Agricultural Engineering",
        "Artificial Intelligence and Data Science",
        "Automobile Engineering",
        "Biomedical Engineering",
        "Chemical Engineering",
        "Civil Engineering",
        "Computer Science and Business Systems",
        "Computer Science and Engineering",
        "Electrical and Electronics Engineering",
        "Electronics and Communication Engineering",
        "Information Technology",
        "Mechanical Engineering",
        "Mechatronics Engineering"
    ];

    const getDeptIcon = (dept) => {
        const iconProps = { size: 26, color: "#94a3b8" };
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

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.staffName) params.append('staffName', filters.staffName);
            if (filters.status && filters.status !== 'All') params.append('status', filters.status);

            const res = await api.get(`/admin/attendance?${params.toString()}`);
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleCustomChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            staffName: '',
            status: 'All'
        });
    };

    const handleBack = () => {
        if (selectedRoom) {
            setSelectedRoom(null);
        } else if (selectedStaff) {
            setSelectedStaff(null);
        } else {
            setSelectedDept(null);
        }
    };

    // Derived Data
    const getDeptAttendance = (dept) => attendance.filter(a => a.department === dept);

    // Level 1: Staff Directory with Absence Counters
    const getStaffList = () => {
        const deptRecords = getDeptAttendance(selectedDept);
        const staffMap = new Map();

        deptRecords.forEach(a => {
            if (!staffMap.has(a.staff_id)) {
                staffMap.set(a.staff_id, {
                    id: a.staff_id,
                    name: a.staff_name,
                    recordCount: 0,
                    absentCount: 0,
                    presentToday: false,
                    profile_picture: a.profile_picture || null
                });
            }
            const info = staffMap.get(a.staff_id);
            info.recordCount++;
            if (a.status === 'Absent') info.absentCount++;
            if (['Present', 'Tracking', 'Late'].includes(a.status)) info.presentToday = true;
        });

        return Array.from(staffMap.values()).filter(s =>
            s.name.toLowerCase().includes(filters.staffName.toLowerCase())
        );
    };

    // Level 2: Classroom drill-down for selected staff
    const getStaffClassrooms = () => {
        const staffRecords = attendance.filter(a => a.staff_id === selectedStaff.id);
        const roomMap = new Map();

        staffRecords.forEach(a => {
            if (!roomMap.has(a.room_name)) {
                roomMap.set(a.room_name, {
                    name: a.room_name,
                    recordCount: 0,
                    absentCount: 0
                });
            }
            const info = roomMap.get(a.room_name);
            info.recordCount++;
            if (a.status === 'Absent') info.absentCount++;
        });

        return Array.from(roomMap.values());
    };

    const getStaffAttendanceByRoom = () => {
        return attendance.filter(a =>
            a.staff_id === selectedStaff.id &&
            a.room_name === selectedRoom.name
        );
    };

    const filteredDepts = departments.filter(d =>
        d.toLowerCase().includes(filters.staffName.toLowerCase()) ||
        attendance.some(a => a.department === d && a.staff_name.toLowerCase().includes(filters.staffName.toLowerCase()))
    );

    return (
        <div className="section">
            <div className="responsive-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {(selectedDept || selectedStaff || selectedRoom) && (
                        <button
                            onClick={handleBack}
                            className="back-btn"
                            style={{
                                width: '36px', height: '36px', background: 'white', flexShrink: 0,
                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <h2 className="section-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '20px' }}>
                            {selectedRoom ? `${selectedStaff.name} in ${selectedRoom.name}` :
                                (selectedStaff ? selectedStaff.name : (selectedDept ? selectedDept : 'Attendance Reports'))}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedRoom ? `Class-wise logs.` :
                                (selectedStaff ? `View by classroom.` :
                                    (selectedDept ? `Staff in ${selectedDept}.` : 'Select a department.'))}
                        </p>
                    </div>
                </div>

                {(selectedDept || selectedStaff || selectedRoom) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {!selectedStaff && !selectedRoom && (
                            <div className="search-wrapper" style={{ maxWidth: '250px' }}>
                                <span className="icon"><Search size={18} /></span>
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    className="form-input"
                                    value={filters.staffName}
                                    onChange={(e) => handleCustomChange('staffName', e.target.value)}
                                />
                            </div>
                        )}
                        <button className="btn-primary" onClick={fetchAttendance} style={{ padding: '0 16px', height: '40px', fontSize: '13px' }}>
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Bar - Only in most detailed level (Level 3) */}
            {selectedRoom && (
                <div className="filter-card" style={{ marginBottom: '32px', padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <CustomDatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(val) => handleCustomChange('startDate', val)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <CustomDatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(val) => handleCustomChange('endDate', val)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <CustomSelect
                                label="Status"
                                value={filters.status}
                                options={[
                                    { label: 'All Statuses', value: 'All' },
                                    { label: 'Present', value: 'Present' },
                                    { label: 'Late', value: 'Late' },
                                    { label: 'Absent', value: 'Absent' },
                                    { label: 'Tracking', value: 'Tracking' }
                                ]}
                                onChange={(val) => handleCustomChange('status', val)}
                            />
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={clearFilters}
                            style={{ height: '48px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <X size={16} /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* LEVEL 0: DEPARTMENT CARDS */}
            {!selectedDept && !selectedStaff && !selectedRoom && (
                <div className="grid-adaptive-340">
                    {filteredDepts.map(dept => {
                        const records = getDeptAttendance(dept);
                        const presentCount = records.filter(r => ['Present', 'Tracking', 'Late'].includes(r.status)).length;
                        return (
                            <div
                                key={dept}
                                className="form-card"
                                onClick={() => setSelectedDept(dept)}
                                style={{
                                    margin: 0, cursor: 'pointer', padding: '24px',
                                    borderLeft: '4px solid #e2e8f0',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '52px', height: '52px', borderRadius: '14px',
                                            background: '#f8fafc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {getDeptIcon(dept)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', lineHeight: 1.2 }}>{dept}</div>
                                            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', marginTop: '4px' }}>
                                                {records.length} records in this period
                                            </div>
                                        </div>
                                    </div>
                                    {presentCount > 0 && (
                                        <div style={{
                                            background: '#f0fdf4', color: '#166534',
                                            padding: '4px 10px', borderRadius: '20px',
                                            fontSize: '12px', fontWeight: '700',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <UserCheck size={12} /> {presentCount} Hits
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* LEVEL 1: STAFF CARDS (Inside Department) */}
            {selectedDept && !selectedStaff && !selectedRoom && (
                <div className="grid-adaptive-300">
                    {getStaffList().map(staff => (
                        <div
                            key={staff.id}
                            className="form-card staff-card"
                            onClick={() => setSelectedStaff(staff)}
                            style={{
                                margin: 0, cursor: 'pointer', padding: '20px',
                                borderLeft: staff.presentToday ? '4px solid #22c55e' : '4px solid #e2e8f0',
                                transition: 'all 0.3s',
                                background: 'white'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Avatar 
                                        name={staff.name} 
                                        picturePath={staff.profile_picture}
                                        size={40}
                                        borderRadius="10px"
                                    />
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{staff.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>
                                            {staff.recordCount} records
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {staff.absentCount > 0 && (
                                        <div style={{
                                            background: '#fef2f2', color: '#ef4444',
                                            padding: '4px 8px', borderRadius: '6px',
                                            fontSize: '11px', fontWeight: '700',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <AlertCircle size={12} /> {staff.absentCount} Absents
                                        </div>
                                    )}
                                    <ArrowRight size={16} color="#cbd5e1" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LEVEL 2: CLASSROOM CARDS (Inside Staff) */}
            {selectedStaff && !selectedRoom && (
                <div className="grid-adaptive-300">
                    {getStaffClassrooms().map(room => (
                        <div
                            key={room.name}
                            className="form-card classroom-card"
                            onClick={() => setSelectedRoom(room)}
                            style={{
                                margin: 0, cursor: 'pointer', padding: '20px',
                                borderLeft: room.absentCount > 0 ? '4px solid #ef4444' : '4px solid var(--primary)',
                                transition: 'all 0.3s',
                                background: 'white'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: '#f8fafc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Home size={20} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{room.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>
                                            {room.recordCount} attendance sessions
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {room.absentCount > 0 && (
                                        <div style={{
                                            background: '#fef2f2', color: '#ef4444',
                                            padding: '4px 8px', borderRadius: '20px',
                                            fontSize: '10px', fontWeight: '700'
                                        }}>
                                            {room.absentCount} Absences
                                        </div>
                                    )}
                                    <ArrowRight size={16} color="#cbd5e1" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LEVEL 3: ATTENDANCE TABLE (Inside Classroom) */}
            {selectedRoom && (
                <div className="table-container" style={{ position: 'relative' }}>
                    {loading && (
                        <div className="loader-container">
                            <div className="premium-loader"></div>
                        </div>
                    )}
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check-in Time</th>
                                <th>Check-out / Last Seen</th>
                                <th>Session Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getStaffAttendanceByRoom().length > 0 ? (
                                getStaffAttendanceByRoom().map((a, i) => {
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
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600' }}>
                                                    <Calendar size={14} color="#64748b" />
                                                    {new Date(a.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14} color="#94a3b8" />
                                                    {new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                {a.last_seen_time ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: a.status === 'Tracking' ? 'var(--primary)' : 'inherit' }}>
                                                        <Clock size={14} color={a.status === 'Tracking' ? 'var(--primary)' : '#94a3b8'} />
                                                        {new Date(a.last_seen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : '---'}
                                            </td>
                                            <td style={{ fontWeight: '600', color: '#475569' }}>{durationText}</td>
                                            <td>
                                                <span className={`status-badge status-${a.status.toLowerCase()}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                                        No session logs found for this specific location.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .back-btn:hover {
                    background: #f8fafc !important;
                    color: var(--primary) !important;
                    transform: translateX(-2px);
                }
                .form-card:hover {
                    border-color: var(--primary) !important;
                    transform: translateY(-2px) translateZ(0);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    backface-visibility: hidden;
                }
                .form-card svg {
                    backface-visibility: hidden;
                    transform: translateZ(0);
                }
                .staff-card:hover {
                    border-left-color: var(--primary) !important;
                    transform: translateY(-2px) translateZ(0);
                }
                .classroom-card:hover {
                    border-left-color: #0f172a !important;
                    transform: translateY(-2px) translateZ(0);
                }
            `}} />
        </div>
    );
};

export default AttendanceReports;
