import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/Dashboard.css';

const CustomSelect = ({ label, options, value, onChange, placeholder, required }) => {
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
        <div className="form-group" ref={containerRef}>
            {label && <label className={`form-label ${required ? 'required-label-asterisk' : ''}`}>{label}</label>}
            <div className="custom-select-container">
                <div
                    className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{selectedOption ? selectedOption.label : placeholder}</span>
                    <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
                </div>
                {isOpen && (
                    <div className="custom-select-options">
                        {options.map((opt, i) => (
                            <div
                                key={i}
                                className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
