import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Save, Plus, Trash2, Clock, Settings, Calendar, ChevronDown, Check, Monitor } from 'lucide-react';

const CompactSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isOpen ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                    background: selectedOption ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: selectedOption ? '600' : '400',
                    color: selectedOption ? '#166534' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    minWidth: '180px', // Ensure wide enough for names
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    marginTop: '4px'
                }}>
                    <div
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}
                    >
                        - Clear Selection -
                    </div>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                color: value === opt.value ? '#166534' : '#334155',
                                background: value === opt.value ? '#f0fdf4' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={12} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TimetableGridInput = ({ rooms, staffList, timetable, onSaveSuccess }) => {
    const [selectedRoom, setSelectedRoom] = useState('');
    const [showDayConfig, setShowDayConfig] = useState(false);

    // Default periods configuration (Flexible)
    const [periods, setPeriods] = useState([
        { id: '1', start: '09:00', end: '09:50', label: '1', type: 'class' },
        { id: '2', start: '09:50', end: '10:30', label: '2', type: 'class' },
        { id: 'b1', start: '10:40', end: '10:55', label: 'BREAK', type: 'break' },
        { id: '3', start: '10:55', end: '11:45', label: '3', type: 'class' },
        { id: '4', start: '11:45', end: '12:35', label: '4', type: 'class' },
        { id: 'l1', start: '12:35', end: '13:10', label: 'LUNCH', type: 'lunch' },
        { id: '5', start: '13:10', end: '13:50', label: '5', type: 'class' },
        { id: '6', start: '13:50', end: '14:30', label: '6', type: 'class' },
        { id: 'b2', start: '14:30', end: '14:40', label: 'BREAK', type: 'break' },
        { id: '7', start: '14:40', end: '15:20', label: '7', type: 'class' },
        { id: '8', start: '15:20', end: '16:00', label: '8', type: 'class' }
    ]);

    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [activeDays, setActiveDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

    const [gridData, setGridData] = useState({
        'Monday': {},
        'Tuesday': {},
        'Wednesday': {},
        'Thursday': {},
        'Friday': {},
        'Saturday': {},
        'Sunday': {}
    });

    useEffect(() => {
        if (!selectedRoom || !timetable) return;

        const newGridData = {
            'Monday': {}, 'Tuesday': {}, 'Wednesday': {}, 'Thursday': {}, 'Friday': {}, 'Saturday': {}, 'Sunday': {}
        };

        const roomSchedule = timetable.filter(t => t.classroom_id === selectedRoom);

        roomSchedule.forEach(entry => {
            const day = entry.day_of_week;
            const periodIndex = periods.findIndex(p => p.start === entry.start_time);

            if (periodIndex !== -1) {
                if (!newGridData[day]) newGridData[day] = {};
                newGridData[day][periodIndex] = {
                    staffId: entry.staff_id,
                    subject: entry.subject || ''
                };
            }
        });

        setGridData(newGridData);
    }, [selectedRoom, timetable]);

    const toggleDay = (day) => {
        if (activeDays.includes(day)) {
            setActiveDays(activeDays.filter(d => d !== day));
        } else {
            const newDays = [...activeDays, day];
            newDays.sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));
            setActiveDays(newDays);
        }
    };

    const handleCellChange = (day, colIndex, field, value) => {
        setGridData(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [colIndex]: {
                    ...prev[day]?.[colIndex],
                    [field]: value
                }
            }
        }));
    };

    const handlePeriodChange = (index, field, value) => {
        const newPeriods = [...periods];
        newPeriods[index][field] = value;
        setPeriods(newPeriods);
    };

    const addPeriod = (type = 'class') => {
        const lastPeriod = periods[periods.length - 1];
        const lastEndTime = lastPeriod ? lastPeriod.end : '09:00';

        let newLabel = '';
        if (type === 'class') {
            const classCount = periods.filter(p => p.type === 'class').length;
            newLabel = `${classCount + 1}`;
        } else if (type === 'break') {
            newLabel = 'BREAK';
        } else {
            newLabel = 'LUNCH';
        }

        const newStart = lastEndTime;

        setPeriods([...periods, {
            id: Date.now().toString(),
            start: newStart,
            end: newStart,
            label: newLabel,
            type: type
        }]);
    };

    const removePeriod = (index) => {
        if (periods.length <= 1) return;
        if (!window.confirm('Delete this column? Assigned data in this column will be lost.')) return;
        const newPeriods = periods.filter((_, i) => i !== index);
        setPeriods(newPeriods);
    };

    const handleSave = async () => {
        if (!selectedRoom) {
            alert('Please select a classroom first.');
            return;
        }

        if (!window.confirm('This will OVERWRITE the existing timetable for this class. Continue?')) {
            return;
        }

        const schedule = [];

        activeDays.forEach(day => {
            const dayData = gridData[day] || {};
            periods.forEach((period, index) => {
                if (period.type !== 'class') return;

                const cell = dayData[index];
                if (cell && cell.staffId) {
                    schedule.push({
                        day_of_week: day,
                        start_time: period.start,
                        end_time: period.end,
                        staff_id: cell.staffId,
                        subject: cell.subject || ''
                    });
                }
            });
        });

        try {
            await api.post('/admin/timetable/bulk', {
                classroom_id: selectedRoom,
                schedule
            });
            alert('Timetable saved successfully!');
            onSaveSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to save timetable: ' + (err.response?.data?.error || err.message));
        }
    };

    const subjectInputStyle = {
        width: '100%',
        padding: '6px 10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#64748b',
        background: '#f8fafc',
        outline: 'none',
        marginTop: '6px',
        transition: 'all 0.2s'
    };

    // Prepare staff options for dropdown
    const staffOptions = staffList.map(s => ({ value: s._id, label: s.name }));

    return (
        <div className="timetable-grid-container" style={{ padding: '0px 0' }}>
            <style>{`
                input[type="time"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
                .header-time-input:hover {
                    background: rgba(0,0,0,0.05) !important;
                }
                .subject-input:focus {
                    background: white !important;
                    border-color: #cbd5e1 !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
                }
            `}</style>

            <div style={{ marginBottom: '24px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <label className="form-label" style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Monitor size={16} /> Select Classroom
                        </label>
                        <CompactSelect
                            options={rooms.map(r => ({ value: r._id, label: `${r.room_name} (${r.esp32_id})` }))}
                            value={selectedRoom}
                            onChange={setSelectedRoom}
                            placeholder="-- Select Classroom to Configure --"
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '700' }}>
                        <Settings size={18} /> Configuration
                    </h4>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setShowDayConfig(!showDayConfig)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white' }}>
                        <Calendar size={14} /> {showDayConfig ? 'Hide Days' : 'Select Days'}
                    </button>
                    <div style={{ width: '1px', background: '#cbd5e1', margin: '0 8px' }}></div>
                    <button type="button" onClick={() => addPeriod('break')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '6px', fontWeight: '600' }}>
                        + Break
                    </button>
                    <button type="button" onClick={() => addPeriod('class')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: '600' }}>
                        + Class Period
                    </button>
                </div>
            </div>

            {showDayConfig && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', flexWrap: 'wrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    {allDays.map(day => (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '6px 12px', background: activeDays.includes(day) ? '#eff6ff' : '#f8fafc', borderRadius: '20px', border: activeDays.includes(day) ? '1px solid #bfdbfe' : '1px solid #e2e8f0', transition: 'all 0.2s', fontWeight: activeDays.includes(day) ? '600' : '400', color: activeDays.includes(day) ? '#1e40af' : '#64748b' }}>
                            <input
                                type="checkbox"
                                checked={activeDays.includes(day)}
                                onChange={() => toggleDay(day)}
                                style={{ accentColor: '#2563eb' }}
                            />
                            {day}
                        </label>
                    ))}
                </div>
            )}

            <div style={{ overflowX: 'auto', paddingBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', background: 'white' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '13px' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '16px', borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0', background: '#f8fafc', width: '80px', minWidth: '80px', fontWeight: '800', color: '#334155', position: 'sticky', left: 0, zIndex: 10, borderTopLeftRadius: '12px' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Row</div>
                                DAY
                            </th>
                            {periods.map((p, i) => (
                                <th key={i} style={{
                                    padding: '12px',
                                    borderBottom: '2px solid #cbd5e1',
                                    borderRight: '1px solid #e2e8f0',
                                    background: p.type === 'class' ? '#f8fafc' : '#fff1f2',
                                    minWidth: p.type === 'class' ? '180px' : '90px',
                                    textAlign: 'center',
                                    position: 'relative'
                                }}>

                                    <div style={{ position: 'absolute', top: '4px', right: '4px', opacity: 0.6 }}>
                                        <button
                                            onClick={() => removePeriod(i)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                            title="Remove Column"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>

                                    <input
                                        value={p.label}
                                        onChange={(e) => handlePeriodChange(i, 'label', e.target.value)}
                                        style={{
                                            fontWeight: '800',
                                            fontSize: '14px',
                                            color: p.type === 'class' ? '#1e293b' : '#be123c',
                                            background: 'transparent',
                                            border: 'none',
                                            width: '100%',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            marginBottom: '8px',
                                            outline: 'none'
                                        }}
                                    />

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <input
                                            type="time"
                                            className="header-time-input"
                                            value={p.start}
                                            onChange={(e) => handlePeriodChange(i, 'start', e.target.value)}
                                            style={{
                                                width: '100%', padding: '2px 4px', border: 'none', background: 'transparent',
                                                fontSize: '12px', fontWeight: '500', color: '#475569', textAlign: 'center',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        />
                                        <div style={{ width: '20px', height: '1px', background: '#cbd5e1', margin: '2px 0' }}></div>
                                        <input
                                            type="time"
                                            className="header-time-input"
                                            value={p.end}
                                            onChange={(e) => handlePeriodChange(i, 'end', e.target.value)}
                                            style={{
                                                width: '100%', padding: '2px 4px', border: 'none', background: 'transparent',
                                                fontSize: '12px', fontWeight: '500', color: '#475569', textAlign: 'center',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeDays.map(day => (
                            <tr key={day} style={{ transition: 'background 0.2s' }}>
                                <td style={{
                                    padding: '16px',
                                    borderBottom: '1px solid #e2e8f0',
                                    borderRight: '1px solid #e2e8f0',
                                    fontWeight: '700',
                                    background: '#f8fafc',
                                    color: '#475569',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 5,
                                    verticalAlign: 'middle',
                                    textAlign: 'center'
                                }}>
                                    {day.toUpperCase().substring(0, 3)}
                                </td>
                                {periods.map((period, colIndex) => {
                                    if (period.type !== 'class') {
                                        return (
                                            <td key={colIndex} style={{
                                                background: '#fff1f2',
                                                borderRight: '1px solid #ffe4e6',
                                                borderBottom: '1px solid #e2e8f0',
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                                padding: '0'
                                            }}>
                                                <div style={{
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                    margin: '0 auto',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    color: '#be123c',
                                                    letterSpacing: '2px',
                                                    textTransform: 'uppercase',
                                                    opacity: 0.8
                                                }}>
                                                    {period.label}
                                                </div>
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={colIndex} style={{ padding: '8px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {/* Replaced native select with Custom CompactSelect */}
                                                <CompactSelect
                                                    options={staffOptions}
                                                    value={gridData[day]?.[colIndex]?.staffId || ''}
                                                    onChange={(val) => handleCellChange(day, colIndex, 'staffId', val)}
                                                    placeholder="Select Staff..."
                                                />

                                                <input
                                                    type="text"
                                                    className="subject-input"
                                                    placeholder="Subject..."
                                                    value={gridData[day]?.[colIndex]?.subject || ''}
                                                    onChange={(e) => handleCellChange(day, colIndex, 'subject', e.target.value)}
                                                    style={subjectInputStyle}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <button
                    onClick={handleSave}
                    disabled={!selectedRoom}
                    className="btn-primary"
                    style={{
                        padding: '14px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        opacity: !selectedRoom ? 0.6 : 1,
                        cursor: !selectedRoom ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        borderRadius: '8px'
                    }}
                >
                    <Save size={18} /> Save Entire Schedule
                </button>
            </div>
        </div>
    );
};

export default TimetableGridInput;
