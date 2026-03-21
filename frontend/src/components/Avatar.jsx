import React from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

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
        return (
            <img
                src={`${API_BASE}${picturePath}`}
                alt={`${name} profile`}
                style={baseStyle}
                onError={(e) => {
                    // Fallback to initial badge if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                }}
            />
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
            userSelect: 'none'
        }}>
            {initial}
        </div>
    );
};

export default Avatar;
