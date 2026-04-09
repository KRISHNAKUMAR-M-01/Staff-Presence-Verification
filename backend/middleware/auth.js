const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (userId, role, sessionId) => {
    return jwt.sign(
        { userId, role, sessionId },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        // Single-session enforcement: check if token sessionId matches currentSessionId in DB
        if (decoded.sessionId && user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
            console.log(`🚫 Auth: Session mismatch for ${user.email}. Token: ${decoded.sessionId}, DB: ${user.currentSessionId}`);
            return res.status(401).json({ error: 'You have been logged out because another device logged in with your account.' });
        }

        // Update last activity (Done without blocking the whole request)
        User.updateOne({ _id: user._id }, { $set: { lastActivity: new Date() } }).catch(console.error);
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Check if user is staff
const requireStaff = (req, res, next) => {
    if (req.user.role.toLowerCase() !== 'staff') {
        return res.status(403).json({ error: 'Staff access required' });
    }
    next();
};

const requireExecutive = (req, res, next) => {
    const role = req.user.role.toLowerCase();
    if (!['principal', 'secretary', 'director'].includes(role)) {
        return res.status(403).json({ error: 'Executive access required' });
    }
    next();
};

const requireStaffOrExecutive = (req, res, next) => {
    const role = req.user.role.toLowerCase();
    const allowed = ['staff', 'principal', 'secretary', 'director'];
    if (!allowed.includes(role)) {
        return res.status(403).json({ error: 'Staff or Executive access required' });
    }
    next();
};

module.exports = {
    generateToken,
    authenticateToken,
    requireAdmin,
    requireStaff,
    requireExecutive,
    requireStaffOrExecutive
};
