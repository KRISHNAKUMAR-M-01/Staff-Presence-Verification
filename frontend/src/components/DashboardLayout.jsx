import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Wake Lock feature to prevent phone from sleeping
import { LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import Avatar from './Avatar';
import '../styles/Dashboard.css';

const DashboardLayout = ({ children, title, navItems, userName, themeClass, brandColor, headerActions }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAwake, setIsAwake] = useState(false);
    const [wakeLock, setWakeLock] = useState(null);

    // Toggle Screen Wake Lock
    const toggleWakeLock = async () => {
        if (!isAwake) {
            try {
                if ('wakeLock' in navigator) {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLock(lock);
                    setIsAwake(true);
                    
                    lock.addEventListener('release', () => {
                        console.log('Wake Lock was released');
                        setIsAwake(false);
                        setWakeLock(null);
                    });
                } else {
                    alert("Your browser doesn't support the 'Stay Awake' feature.");
                }
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
                setIsAwake(false);
            }
        } else {
            if (wakeLock) {
                await wakeLock.release();
                setWakeLock(null);
            }
            setIsAwake(false);
        }
    };

    const handleLogout = () => {
        if (wakeLock) wakeLock.release();
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={`dashboard-layout ${themeClass}`}>
            {/* Sidebar Overlay (Mobile Only) */}
            {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <nav className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo-container">
                    <h2 className="sidebar-logo" style={{ fontSize: '18px', fontWeight: '800', color: brandColor, margin: 0 }}>STAFF SYSTEM</h2>
                    <button className="menu-toggle close-sidebar" onClick={() => setIsSidebarOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Stay Awake Toggle (Crucial for Mobile/BLE) */}
                    <button 
                        onClick={toggleWakeLock}
                        className={`nav-link ${isAwake ? 'active' : ''}`}
                        style={{ 
                            border: 'none', 
                            background: 'none', 
                            cursor: 'pointer', 
                            width: '100%', 
                            textAlign: 'left',
                            color: isAwake ? '#fff' : 'rgba(255,255,255,0.7)',
                            backgroundColor: isAwake ? '#4ade80' : 'transparent',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px'
                        }}
                    >
                        {isAwake ? <Sun size={20} color="#ffffff" /> : <Moon size={20} color={isSidebarOpen ? "#ffffff" : "#64748b"} />}
                        <span style={{ fontWeight: '600', color: isAwake ? '#ffffff' : 'inherit' }}>{isAwake ? 'Screen Awake: ON' : 'Keep Screen On'}</span>
                    </button>

                    {navItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            end={item.end !== undefined ? item.end : item.path === '/admin' || item.path === '/staff'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                            style={{ position: 'relative' }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    right: '12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white'
                                }}>
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <button className="menu-toggle" onClick={toggleSidebar}>
                            <Menu size={20} />
                        </button>
                        <h1>{title}</h1>
                    </div>
                    <div className="header-right">
                        <div className="header-actions">
                        {headerActions}
                        </div>
                        <div className="user-profile">
                            <Avatar 
                                name={userName} 
                                picturePath={user?.staff_id?.profile_picture}
                                size={40}
                                borderRadius="10px"
                            />
                            <div className="user-info">
                                <span className="user-name">{userName}</span>
                                <span className="user-role">{themeClass.includes('admin') ? 'Administrator' : 'Staff Member'}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            <LogOut size={16} />
                            <span className="logout-text">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
