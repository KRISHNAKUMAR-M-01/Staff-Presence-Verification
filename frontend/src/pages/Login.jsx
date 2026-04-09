import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Mail, Lock, Chrome, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';

const Login = () => {
    const { login } = useAuth();
    const [view, setView] = useState('login'); // 'login', 'forgotPassword', 'verifyOtp', 'resetPassword'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
            const role = user.role?.toLowerCase();
            const targetPath = role === 'admin' ? '/admin' : 
                               ['principal', 'secretary', 'director'].includes(role) ? '/executive' : 
                               '/staff';
            navigate(targetPath);
        } catch (err) {
            if (err.response?.data?.error === 'ALREADY_LOGGED_IN') {
                if (window.confirm('This account is already logged in on another device. Would you like to log out the other session and sign in here?')) {
                    // Retry with force flag
                    try {
                        setLoading(true);
                        const retryRes = await api.post('/auth/login', { email, password, force: true });
                        const { token, user } = retryRes.data;
                        login(user, token);
                        const role = user.role?.toLowerCase();
                        const targetPath = role === 'admin' ? '/admin' : 
                                           ['principal', 'secretary', 'director'].includes(role) ? '/executive' : 
                                           '/staff';
                        navigate(targetPath);
                    } catch (retryErr) {
                        setError(retryErr.response?.data?.error || 'Login failed.');
                    }
                }
            } else {
                setError(err.response?.data?.error || 'Connection error.');
            }
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                const response = await api.post('/auth/google-login', { access_token: tokenResponse.access_token });
                const { token, user } = response.data;
                login(user, token);
                const role = user.role?.toLowerCase();
                const targetPath = role === 'admin' ? '/admin' : 
                                   ['principal', 'secretary', 'director'].includes(role) ? '/executive' : 
                                   '/staff';
                navigate(targetPath);
            } catch (err) {
                setError(err.response?.data?.error || 'Google login failed.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google Authentication Failed'),
    });

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/request-otp', { email });
            setSuccess('OTP sent to your email.');
            setView('verifyOtp');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-otp', { email, otp });
            setView('resetPassword');
            setSuccess('OTP verified! Create your new password.');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setSuccess('Password reset successfully! You can now login.');
            setView('login');
            setPassword('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left-panel">
                <div className="login-logo">
                    <div className="logo-symbol"><div className="logo-inner"></div></div>
                    <span className="logo-text">SPV</span>
                </div>
                <div className="login-left-content">
                    <h1>STAFF PRESENCE <br/><span>VERIFICATION</span></h1>
                </div>
            </div>

            <div className="login-right-panel">
                <div className="login-form-container">
                    {view === 'login' ? (
                        <>
                            <h2>SIGN IN</h2>
                            <p className="login-subtitle">Sign in with email address</p>
                            <form onSubmit={handleLogin}>
                                <div className="input-group">
                                    <Mail className="input-icon" size={20} />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Yourname@gmail.com" />
                                </div>
                                <div className="input-group">
                                    <Lock className="input-icon" size={20} />
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {error && <div className="error-message">{error}</div>}
                                {success && <div className="success-message">{success}</div>}
                                <button type="submit" className="login-main-btn" disabled={loading}>
                                    {loading ? <div className="spinner"></div> : 'Sign in'}
                                </button>
                                <p className="forgot-pwd-link" onClick={() => {setView('forgotPassword'); setError(''); setSuccess('');}}>
                                    Forgot Password?
                                </p>
                            </form>
                            <div className="divider"><span>Or continue with</span></div>
                            <div className="social-login">
                                <button type="button" className="social-btn google-btn" onClick={() => googleLogin()} disabled={loading}>
                                    <Chrome size={20} /> Sign in with Google
                                </button>
                            </div>
                        </>
                    ) : view === 'forgotPassword' ? (
                        <>
                            <h2>FORGOT PASSWORD</h2>
                            <p className="login-subtitle">We'll send an OTP to your registered email</p>
                            <form onSubmit={handleRequestOtp}>
                                <div className="input-group">
                                    <Mail className="input-icon" size={20} />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Yourname@gmail.com" />
                                </div>
                                {error && <div className="error-message">{error}</div>}
                                <button type="submit" className="login-main-btn" disabled={loading}>
                                    {loading ? <div className="spinner"></div> : 'Send OTP'}
                                </button>
                                <p className="back-link" onClick={() => setView('login')}>
                                    <ArrowLeft size={16} /> Back to Login
                                </p>
                            </form>
                        </>
                    ) : view === 'verifyOtp' ? (
                        <>
                            <h2>VERIFY OTP</h2>
                            <p className="login-subtitle">Enter the 6-digit code sent to your email</p>
                            <form onSubmit={handleVerifyOtp}>
                                <div className="input-group">
                                    <ShieldCheck className="input-icon" size={20} />
                                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="6-digit OTP" maxLength={6} />
                                </div>
                                {error && <div className="error-message">{error}</div>}
                                {success && <div className="success-message">{success}</div>}
                                <button type="submit" className="login-main-btn" disabled={loading}>
                                    {loading ? <div className="spinner"></div> : 'Verify OTP'}
                                </button>
                                <p className="back-link" onClick={() => setView('forgotPassword')}>
                                    <ArrowLeft size={16} /> Resend OTP
                                </p>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2>NEW PASSWORD</h2>
                            <p className="login-subtitle">Set a strong password for your account</p>
                            <form onSubmit={handleResetPassword}>
                                <div className="input-group">
                                    <Lock className="input-icon" size={20} />
                                    <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="New Password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="input-group">
                                    <ShieldCheck className="input-icon" size={20} />
                                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm Password" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle">
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {error && <div className="error-message">{error}</div>}
                                {success && <div className="success-message">{success}</div>}
                                <button type="submit" className="login-main-btn" disabled={loading}>
                                    {loading ? <div className="spinner"></div> : 'Set Password'}
                                </button>
                            </form>
                        </>
                    )}
                    <p className="login-terms">By signing in, you agree to our <a href="#">Terms and Conditions</a></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
