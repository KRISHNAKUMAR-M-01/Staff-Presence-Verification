import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronUp, ChevronDown, X } from 'lucide-react';
import '../styles/Dashboard.css';

const CustomDatePicker = ({ label, value, onChange, required, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef(null);

    // Initialize viewDate from value if present
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setViewDate(date);
            }
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Adjust for timezone offset to ensure correct string format
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        const dateString = adjustedDate.toISOString().split('T')[0];

        onChange(dateString);
        setIsOpen(false);
    };

    const handleMonthChange = (direction) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
        setViewDate(newDate);
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        // Also select today
        const offset = today.getTimezoneOffset();
        const adjustedDate = new Date(today.getTime() - (offset * 60 * 1000));
        onChange(adjustedDate.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), i).toISOString().split('T')[0];
            /* 
               We need to construct the comparison string carefully.
               Since 'value' is YYYY-MM-DD string, we prefer string comparison.
               We construct local YYYY-MM-DD for the current cell.
            */
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
            // Adjust time one offset hack is risky, better construction:
            const year = cellDate.getFullYear();
            const month = String(cellDate.getMonth() + 1).padStart(2, '0');
            const day = String(cellDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const isSelected = value === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(i)}
                >
                    {i}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="form-group" ref={containerRef}>
            {label && <label className={`form-label ${required ? 'required-label-asterisk' : ''}`}>{label}</label>}
            <div className="custom-date-picker">
                <div
                    className={`date-picker-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{value ? new Date(value).toLocaleDateString() : 'Select Date'}</span>
                    <Calendar size={18} className="calendar-icon" />
                </div>

                {isOpen && (
                    <div className="calendar-popup">
                        <div className="calendar-header">
                            <span className="current-month">
                                {months[viewDate.getMonth()]}, {viewDate.getFullYear()}
                            </span>
                            <div className="calendar-nav">
                                <button type="button" onClick={() => handleMonthChange(-1)}><ChevronDown className="rotate-90" size={18} /></button>
                                <button type="button" onClick={() => handleMonthChange(1)}><ChevronUp className="rotate-90" size={18} /></button>
                            </div>
                        </div>

                        <div className="calendar-weekdays">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="weekday">{d}</div>
                            ))}
                        </div>

                        <div className="calendar-grid">
                            {renderCalendarDays()}
                        </div>

                        <div className="calendar-footer">
                            <button type="button" className="btn-text" onClick={handleClear}>Clear</button>
                            <button type="button" className="btn-text primary" onClick={handleToday}>Today</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomDatePicker;
