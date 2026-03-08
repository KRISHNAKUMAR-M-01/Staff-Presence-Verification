import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/Dashboard.css';

const CustomSelect = ({ label, options, value, onChange, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="form-group" ref={containerRef}>
            {label && <label className={`form-label ${required ? 'required-label-asterisk' : ''}`}>{label}</label>}
            <div className={`custom-select-container ${isOpen ? 'active-dropdown' : ''}`}>
                <div
                    className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => {
                        if (!isOpen) {
                            setIsOpen(true);
                        }
                    }}
                >
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={selectedOption ? selectedOption.label : placeholder}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                width: '100%',
                                fontSize: 'inherit',
                                color: 'inherit',
                                fontFamily: 'inherit',
                                padding: 0
                            }}
                        />
                    ) : (
                        <span style={{ color: selectedOption ? 'inherit' : '#cbd5e1' }}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    )}
                    <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                        if (isOpen) setSearchTerm('');
                    }} />
                </div>
                {isOpen && (
                    <div className="custom-select-options">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="custom-select-option" style={{ color: '#94a3b8', cursor: 'default' }}>
                                No matches found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
