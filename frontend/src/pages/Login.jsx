import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Validation: must be a valid email format
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address (e.g. user@domain.com)');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            login(user, token);

            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/staff');
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Connection error. Please check if the server is running.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-body">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1 style={{ background: 'none', webkitTextFillColor: 'unset', color: 'white' }}>Staff Presence System</h1>
                        <p style={{ color: '#64748b' }}>Enterprise Authentication Portal</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group floating-group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => { if (/^\d$/.test(e.key)) e.preventDefault(); }}
                                required
                                placeholder=" "
                                title="Enter a valid email address (e.g. user@domain.com)"
                                pattern="^[a-zA-Z][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                            />
                            <label>Email Address</label>
                        </div>

                        <div className="form-group floating-group">
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder=" "
                                />
                                <label>Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="login-btn" disabled={loading}>
                            <span>{loading ? 'Authenticating...' : 'Login'}</span>
                            {loading && <div className="loader"></div>}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Demo Credentials</p>
                        <div className="demo-credentials">
                            <div>
                                <strong>Admin:</strong> admin@school.com / Admin@123
                            </div>
                            <div>
                                <strong>Principal:</strong> principal@gmail.com / Principal@123
                            </div>
                            <div>
                                <strong>Staff:</strong> kriskanna17@gmail.com / Staff@123
                            </div>
                        </div> 
                     </div>
                </div>
            </div>
        </div>
    );
}; 

export default Login;
