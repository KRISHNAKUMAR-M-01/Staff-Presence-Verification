import React from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://staff-presence-backend.onrender.com';

/**
 * Reusable Avatar component.
 * Shows the staff's profile picture if available, otherwise a colored initial badge.
 * 
 * Props:
 *   name        - string: staff name (used for initials & colour)
 *   picturePath - string | null: relative path returned by the backend e.g. "/uploads/profiles/staff_xxx.jpg"
 *   size        - number (px): defaults to 40
 *   borderRadius - string: defaults to '50%' (circle)
 *   style       - extra style overrides
 */
const Avatar = ({ name = '', picturePath, size = 40, borderRadius = '50%', style = {} }) => {
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    // Generate a deterministic colour from the name
    const colors = ['#097969', '#0891b2', '#7c3aed', '#db2777', '#d97706', '#059669', '#2563eb'];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
    const bgColor = colors[colorIndex];

    const baseStyle = {
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        flexShrink: 0,
        ...style
    };

    if (picturePath) {
        const isAbsolute = picturePath.startsWith('http') || picturePath.startsWith('blob:') || picturePath.startsWith('data:');
        const imageUrl = isAbsolute ? picturePath : `${API_BASE}${picturePath}`;
        return (
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <img
                    src={imageUrl}
                    alt={`${name} profile`}
                    style={{ ...baseStyle, position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <div style={{
                    ...baseStyle,
                    background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: size * 0.4,
                    boxShadow: `0 4px 10px ${bgColor}40`,
                    userSelect: 'none',
                    minWidth: size,
                    minHeight: size
                }}>
                    {initial}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            ...baseStyle,
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: size * 0.4,
            boxShadow: `0 4px 10px ${bgColor}40`,
            userSelect: 'none',
            minWidth: size,
            minHeight: size
        }}>
            {initial}
        </div>
    );
};

export default Avatar;
