import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const StatusModal = ({ isOpen, type = 'success', title, message, onConfirm }) => {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: <CheckCircle2 size={64} color="#16a34a" strokeWidth={1.5} />,
            accent: '#16a34a',
            bg: '#f0fdf4'
        },
        error: {
            icon: <XCircle size={64} color="#dc2626" strokeWidth={1.5} />,
            accent: '#dc2626',
            bg: '#fef2f2'
        },
        info: {
            icon: <AlertCircle size={64} color="#2563eb" strokeWidth={1.5} />,
            accent: '#2563eb',
            bg: '#eff6ff'
        }
    };

    const { icon, accent, bg } = config[type] || config.success;

    return (
        <div className="modal-backdrop" onClick={onConfirm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    {title}
                </h3>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
                    {message}
                </p>
                <button
                    onClick={onConfirm}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '16px',
                        background: accent,
                        color: 'white',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: `0 10px 15px -3px ${accent}4D`,
                        transition: 'transform 0.2s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Great, Got it!
                </button>
            </div>
        </div>
    );
};

export default StatusModal;
