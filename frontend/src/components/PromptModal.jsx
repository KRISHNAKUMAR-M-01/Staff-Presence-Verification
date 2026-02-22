import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

const PromptModal = ({ isOpen, title, message, onConfirm, onCancel, placeholder = "Add your notes here...", initialValue = "" }) => {
    const [inputValue, setInputValue] = useState(initialValue);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(inputValue);
        setInputValue("");
    };

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    border: '1px solid #d1fae5'
                }}>
                    <MessageSquare size={48} color="#059669" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    {title}
                </h3>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
                    {message}
                </p>

                <textarea
                    autoFocus
                    className="form-input"
                    style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '16px',
                        borderRadius: '16px',
                        marginBottom: '32px',
                        fontSize: '14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        resize: 'none',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => {
                            setInputValue("");
                            onCancel();
                        }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '16px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '16px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)',
                        }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptModal;
