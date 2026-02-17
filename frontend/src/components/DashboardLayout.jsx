import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import '../styles/Dashboard.css';

const DashboardLayout = ({ children, title, navItems, userName, themeClass, brandColor, headerActions }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
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
                    <button className="menu-toggle" onClick={() => setIsSidebarOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'none' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            end={item.end !== undefined ? item.end : item.path === '/admin' || item.path === '/staff'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="menu-toggle" onClick={toggleSidebar}>
                            <Menu size={20} />
                        </button>
                        <h1>{title}</h1>
                    </div>
                    <div className="header-right">
                        {headerActions}
                        <div className="user-profile">
                            <div className="user-avatar">
                                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                            </div>
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
