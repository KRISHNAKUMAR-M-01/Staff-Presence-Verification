import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Avatar from './Avatar';



/**
 * ProfilePictureUploader — lets staff upload/change their own profile picture.
 * Shows a camera-overlay on hover + a file picker on click.
 *
 * Props:
 *   staffName     - string: used for initials fallback
 *   currentPicture - string | null: current /uploads/... path from DB
 *   onUpdate      - callback(newPath: string): called after successful upload
 *   size          - number: avatar width/height in px (default 96)
 */
const ProfilePictureUploader = ({ staffName, currentPicture, onUpdate, size = 96 }) => {
    const [picture, setPicture] = useState(currentPicture);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    useEffect(() => { setPicture(currentPicture); }, [currentPicture]);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('File too large. Max 5 MB.'); return; }
        setError('');
        setPreview(URL.createObjectURL(file));
        handleUpload(file);
    };

    const handleUpload = async (file) => {
        setUploading(true);
        setSuccess(false);
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);
            const res = await api.post('/staff/upload-profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPicture(res.data.profile_picture);
            setPreview(null);
            setSuccess(true);
            onUpdate?.(res.data.profile_picture);

            // Update localStorage so header avatar refreshes immediately
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.staff_id) {
                user.staff_id.profile_picture = res.data.profile_picture;
                localStorage.setItem('user', JSON.stringify(user));
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Try again.');
        } finally {
            setUploading(false);
        }
    };

    const displaySrc = preview || picture;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Clickable Avatar with camera overlay */}
            <div
                onClick={() => fileRef.current?.click()}
                style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.querySelector('.overlay').style.opacity = '0'}
            >
                <Avatar 
                    name={staffName} 
                    picturePath={displaySrc} 
                    size={size} 
                    style={{ border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} 
                />

                {/* Hover Overlay */}
                <div
                    className="overlay"
                    style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', gap: '4px'
                    }}
                >
                    {uploading ? (
                        <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                        <>
                            <Camera size={22} color="white" />
                            <span style={{ color: 'white', fontSize: '10px', fontWeight: '700' }}>Change</span>
                        </>
                    )}
                </div>

                {/* Success tick */}
                {success && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#097969', borderRadius: '50%', padding: '3px', border: '2px solid white' }}>
                        <CheckCircle size={14} color="white" />
                    </div>
                )}
            </div>

            {/* Upload / hint text */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                        background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: '10px',
                        padding: '6px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#097969'; e.currentTarget.style.color = '#097969'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <Upload size={13} />
                    {picture ? 'Change Photo' : 'Upload Photo'}
                </button>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>JPEG, PNG or WebP · Max 5 MB</div>
            </div>

            {error && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>{error}</div>}

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFile}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ProfilePictureUploader;
