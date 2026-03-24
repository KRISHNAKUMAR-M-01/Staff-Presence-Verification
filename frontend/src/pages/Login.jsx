import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Mail, Lock, Facebook, Chrome } from 'lucide-react';
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

        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
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
        <div className="login-page">
            <div className="login-left-panel">
                <div className="login-logo">
                    <div className="logo-symbol">
                        <div className="logo-inner"></div>
                    </div>
                    <span className="logo-text">SPV</span>
                </div>
                <div className="login-left-content">
                    <h1>STAFF PRESENCE <br/><span>VERIFICATION</span></h1>
                </div>
            </div>

            <div className="login-right-panel">
                <div className="login-form-container">
                    <h2>SIGN IN</h2>
                    <p className="login-subtitle">Sign in with email address</p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Yourname@gmail.com"
                                autoComplete='email'
                            />
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                autoComplete='current-password'
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="login-main-btn" disabled={loading}>
                            {loading ? (
                                <div className="btn-loading">
                                    <div className="spinner"></div>
                                    <span>Authenticating...</span>
                                </div>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>Or continue with</span>
                    </div>

                    <div className="social-login">
                        <button type="button" className="social-btn">
                            <Chrome size={20} /> Google
                        </button>
                        <button type="button" className="social-btn">
                            <Facebook size={20} /> Facebook
                        </button>
                    </div>

                    <p className="login-terms">
                        By registering you with our <a href="#">Terms and Conditions</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
