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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: brandColor }}>STAFF SYSTEM</h2>
                    <button className="menu-toggle" onClick={() => setIsSidebarOpen(false)} style={{ display: 'none' }}>
                        <X size={20} />
                    </button>
                </div>
                {navItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
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
                        <span className="user-name" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>{userName}</span>
                        <button onClick={handleLogout} className="logout-btn">
                            <LogOut size={16} />
                            <span className="logout-text" style={{ marginLeft: '8px' }}>Logout</span>
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
