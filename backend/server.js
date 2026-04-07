require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

// Import Models
const Staff = require('./models/Staff');
const Classroom = require('./models/Classroom');
const Timetable = require('./models/Timetable');
const Attendance = require('./models/Attendance');
const Alert = require('./models/Alert');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Notification = require('./models/Notification');
const SwapRequest = require('./models/SwapRequest');

// Import Middleware
const { generateToken, authenticateToken, requireAdmin, requireStaff, requireExecutive, requireStaffOrExecutive } = require('./middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 5000;

// Import Services
const { sendEmail } = require('./utils/emailService');

// Connect to MongoDB
connectDB();

// --- TIMEZONE HELPER for Asia/Kolkata (IST) ---
// This is critical for Render deployment as servers default to UTC.
const getISTDateInfo = (date = new Date()) => {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' gives YYYY-MM-DD
    const parts = formatter.formatToParts(date);
    const mapped = {};
    parts.forEach(({ type, value }) => mapped[type] = value);
    
    const todayStr = `${mapped.year}-${mapped.month}-${mapped.day}`;
    const currentTime = `${mapped.hour}:${mapped.minute}`;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[date.getUTCDay()]; // This is actually tricky. Let's do it safer.
    
    // Safer Day Name for IST
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentDayName = dayNames[istDate.getDay()];

    return { todayStr, currentTime, currentDay: currentDayName, istDate };
};

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL, // e.g. https://staff-presence.vercel.app
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, ESP32)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Serve uploaded profile pictures as static files
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config — store to disk, accept only images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `staff_${Date.now()}${ext}`);
    }
});
const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
});

const { sendPushNotification } = require('./utils/pushService');

// Performance Caches & Throttles
const staffCache = new Map(); // UUID -> Staff Object
const classroomCache = new Map(); // ESP32_ID -> Classroom Object
const bleThrottle = new Map(); // UUID+ESP32 -> Last Processed Timestamp (ms)
const rssiBuffer = new Map(); // UUID+ESP32 -> circular buffer of last N RSSI readings
const RSSI_BUFFER_SIZE = 5;   // Number of readings to average over

// Clear caches every 10 minutes to reflect DB updates
setInterval(() => {
    staffCache.clear();
    classroomCache.clear();
    console.log('⚡ Performance: Cleared Staff/Classroom ID caches.');
}, 10 * 60 * 1000);

// Clear throttle and RSSI buffer maps every hour to prevent memory growth
setInterval(() => {
    bleThrottle.clear();
    rssiBuffer.clear();
    console.log('⚡ Performance: Reset BLE throttle & RSSI buffer maps.');
}, 60 * 60 * 1000);

// ---- PERMISSION HELPER: CHECK IF STAFF IS ALLOWED TO ATTEND ----
async function isStaffPermitted(staffId, classroomId) {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Direct match in timetable
    const directSlot = await Timetable.findOne({
        staff_id: staffId,
        classroom_id: classroomId,
        day_of_week: currentDay,
        start_time: { $lte: currentTime },
        end_time: { $gte: currentTime }
    });
    if (directSlot) return { permitted: true, slot: directSlot, type: 'direct' };

    // 2. Check for substitution (Was someone else supposed to be here?)
    const scheduledSlot = await Timetable.findOne({
        classroom_id: classroomId,
        day_of_week: currentDay,
        start_time: { $lte: currentTime },
        end_time: { $gte: currentTime }
    });

    if (scheduledSlot) {
        const scheduledStaffId = scheduledSlot.staff_id;
        
        // Is the scheduled staff on Leave?
        const onLeave = await Leave.findOne({
            staff_id: scheduledStaffId,
            status: 'approved',
            start_date: { $lte: now },
            end_date: { $gte: now }
        });

        // Is the scheduled staff Absent from work today?
        const presentToday = await Attendance.findOne({
            staff_id: scheduledStaffId,
            date: { $gte: startOfToday }
        });

        if (onLeave || !presentToday) {
            // Original teacher is missing. Is THIS staff member authorized to cover?
            const user = await User.findOne({ staff_id: staffId });
            if (user) {
                // Check if a substitution notification was sent to this user for this classroom
                const subNotification = await Notification.findOne({
                    recipient_id: user._id,
                    type: { $in: ['meeting_request', 'substitution_request'] },
                    'related_data.classroomId': classroomId.toString()
                }).sort({ createdAt: -1 });

                if (subNotification) return { permitted: true, slot: scheduledSlot, type: 'substitution' };
            }
        }
    }

    // 3. CHECK PERMITTED SWAP (ADMIN APPROVED + COMPLETED)
    const activeSwap = await SwapRequest.findOne({
        classroom_id: classroomId,
        substitute_staff_id: staffId,
        status: 'completed',
        date: { $gte: startOfToday }
    });

    if (activeSwap) {
        // Find the slot for the original requester
        const originalSlot = await Timetable.findOne({
            staff_id: activeSwap.requesting_staff_id,
            classroom_id: classroomId,
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });
        if (originalSlot) return { permitted: true, slot: originalSlot, type: 'swap' };
    }

    return { permitted: false };
}

// ============================================
// AUTHENTICATION ENDPOINTS (Public)
// ============================================

// Save Push Subscription
app.post('/api/auth/subscribe', authenticateToken, async (req, res) => {
    try {
        const subscription = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.pushSubscription = subscription;
        await user.save();

        res.status(200).json({ message: 'Push subscription saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        // Normalize email and validate format
        if (email) {
            email = email.trim().toLowerCase();
            const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Please enter a valid email address (e.g. user@domain.com)' });
            }
        }

        // Find user
        console.log(`🔍 Login attempt for: ${email}`);
        const user = await User.findOne({ email }).populate('staff_id');

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            console.log('❌ User account is deactivated');
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        console.log(`🔐 Password match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                staff_id: user.staff_id
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/google-login', async (req, res) => {
    try {
        const { token, access_token } = req.body;
        let email, name;

        if (token) {
            // Validate ID Token
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
        } else if (access_token) {
            // Validate Access Token via Google userinfo endpoint
            const axios = require('axios');
            const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
            email = googleResponse.data.email;
            name = googleResponse.data.name;
        } else {
            return res.status(400).json({ error: 'Missing token' });
        }

        console.log(`🔍 Google Login attempt for: ${email}`);

        // Handle possible email formats (normalized)
        const normalizedEmail = email.trim().toLowerCase();
        
        // Find user by normalized Google email
        const user = await User.findOne({ email: normalizedEmail }).populate('staff_id');

        if (!user) {
            console.log('❌ Google email not registered in local system');
            return res.status(401).json({ 
                error: 'Your Google email is not registered. Please contact the administrator.' 
            });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Optional: Update name if missing from local DB
        if (!user.name) {
            user.name = name;
            await user.save();
        }

        // Generate token
        const authToken = generateToken(user._id, user.role);

        res.json({
            token: authToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                staff_id: user.staff_id
            }
        });
    } catch (err) {
        console.error('❌ Google Auth Error:', err);
        res.status(500).json({ error: 'Internal Authentication Error' });
    }
});

// --------------------------------------------
// PASSWORD RESET / OTP FLOW
// --------------------------------------------

// 1. Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(404).json({ error: 'No account exists with this email' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiry (15 minutes)
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Send Email
        const emailSubject = "Your Password Reset OTP";
        const emailText = `Your One-Time Password (OTP) for resetting your portal password is: ${otp}. It will expire in 15 minutes.`;
        const emailHtml = `
            <div style="font-family: 'Outfit', sans-serif; padding: 20px; border-radius: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <h2 style="color: #097969; margin-top: 0;">Password Reset</h2>
                <p>You requested a password reset for your <strong>Staff Portal</strong> account.</p>
                <div style="background-color: #e6fcf9; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #097969;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Staff Presence Verification System</p>
            </div>
        `;
        await sendEmail(user.email, emailSubject, emailText, emailHtml);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (err) {
        console.error('❌ Request OTP Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

        const user = await User.findOne({ 
            email: email.trim().toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully. You can now reset your password.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.' });
        }

        const user = await User.findOne({ 
            email: email.trim().toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired session. Please request a new OTP.' });
        }

        // Update password and clear OTP fields
        user.password = newPassword;
        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
2            await Staff.findByIdAndUpdate(user.staff_id._id, { profile_picture: picturePath });

            res.json({ message: 'Profile picture updated!', profile_picture: picturePath });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ---- PROFILE PICTURE: Admin uploads for any staff ----
app.put('/api/admin/staff/:id/upload-picture',
    authenticateToken, requireAdmin,
    uploadProfile.single('profile_picture'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

            const staff = await Staff.findById(req.params.id);
            if (!staff) return res.status(404).json({ error: 'Staff not found.' });

            if (staff.profile_picture) {
                const oldPath = path.join(__dirname, staff.profile_picture.replace('/uploads', 'uploads'));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const picturePath = `/uploads/profiles/${req.file.filename}`;
            await Staff.findByIdAndUpdate(req.params.id, { profile_picture: picturePath });

            res.json({ message: 'Staff profile picture updated!', profile_picture: picturePath });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ---- GET current staff profile (with picture) ----
app.get('/api/staff/me', authenticateToken, requireStaff, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('staff_id');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Register new user (Admin only)
app.post('/api/admin/register-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, password, role, staff_id, name } = req.body;

        // Validation: must be a valid email format
        const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (email && !emailRegex.test(email.trim())) {
            return res.status(400).json({ error: 'Please enter a valid email address (e.g. user@domain.com)' });
        }

        // Validation: Password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // If role is staff, verify staff_id exists
        if (role === 'staff' && staff_id) {
            const staff = await Staff.findById(staff_id);
            if (!staff) {
                return res.status(404).json({ error: 'Staff not found' });
            }
        }

        const user = new User({ email, password, role, staff_id, name });
        await user.save();

        res.json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all staff (Admin only)
app.get('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register new staff (Admin only)
app.post('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, beacon_uuid, department, is_hod, phone_number } = req.body;
        const staff = new Staff({ name, beacon_uuid, department, is_hod, phone_number });
        await staff.save();
        res.json({ id: staff._id, message: 'Staff registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete staff (Admin only)
app.delete('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Also delete associated user account
        await User.deleteOne({ staff_id: req.params.id });

        res.json({ message: 'Staff deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update staff (Admin only)
app.put('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, beacon_uuid, department, is_hod, phone_number, password } = req.body;

        // 1. Update Staff metadata
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { name, beacon_uuid, department, is_hod, phone_number },
            { new: true }
        );
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // 2. Update User metadata (Sync name if changed)
        const user = await User.findOne({ staff_id: req.params.id });
        if (user) {
            user.name = name;

            // 3. Handle Password Reset if password provided
            if (password) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
                if (!passwordRegex.test(password)) {
                    return res.status(400).json({ error: 'New password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.' });
                }
                user.password = password;
            }

            await user.save();
        }

        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manage classrooms (Admin only)
app.get('/api/admin/classrooms', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const classrooms = await Classroom.find();
        res.json(classrooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/classrooms', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { room_name, esp32_id } = req.body;
        const classroom = new Classroom({ room_name, esp32_id });
        await classroom.save();
        res.json({ id: classroom._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/classrooms/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const classroom = await Classroom.findByIdAndDelete(req.params.id);
        if (!classroom) {
            return res.status(404).json({ error: 'Classroom not found' });
        }
        res.json({ message: 'Classroom deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/classrooms/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { room_name, esp32_id } = req.body;
        const classroom = await Classroom.findByIdAndUpdate(
            req.params.id,
            { room_name, esp32_id },
            { new: true }
        );
        if (!classroom) {
            return res.status(404).json({ error: 'Classroom not found' });
        }
        res.json(classroom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Timetable Management (Admin only)
app.get('/api/admin/timetable', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timetable = await Timetable.find()
            .populate('staff_id', 'name')
            .populate('classroom_id', 'room_name');

        const formatted = timetable.map(t => ({
            id: t._id,
            staff_id: t.staff_id._id,
            classroom_id: t.classroom_id._id,
            staff_name: t.staff_id.name,
            room_name: t.classroom_id.room_name,
            day_of_week: t.day_of_week,
            start_time: t.start_time,
            end_time: t.end_time,
            subject: t.subject
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/timetable', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { staff_id, classroom_id, day_of_week, start_time, end_time, subject } = req.body;

        // Basic validation
        if (!staff_id || !classroom_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const timetable = new Timetable({
            staff_id,
            classroom_id,
            day_of_week,
            start_time,
            end_time,
            subject
        });
        await timetable.save();

        // Notify staff about timetable change
        const user = await User.findOne({ staff_id });
        if (user) {
            const notifData = {
                recipient_id: user._id,
                title: 'Timetable Updated',
                message: `New class scheduled on ${day_of_week} from ${start_time} to ${end_time}`,
                type: 'timetable_change'
            };
            await Notification.create(notifData);

            if (user.pushSubscription) {
                await sendPushNotification(user.pushSubscription, {
                    title: notifData.title,
                    body: notifData.message,
                    icon: '/logo192.png',
                    data: { url: '/staff/my-timetable' }
                });
            }
        }

        res.json({ id: timetable._id });
    } catch (err) {
        console.error('❌ Error adding timetable:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/timetable/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { staff_id, classroom_id, day_of_week, start_time, end_time, subject } = req.body;
        const timetable = await Timetable.findByIdAndUpdate(
            req.params.id,
            { staff_id, classroom_id, day_of_week, start_time, end_time, subject },
            { new: true }
        );
        if (!timetable) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }
        res.json(timetable);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Insert Timetable (Admin only)
app.post('/api/admin/timetable/bulk', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { classroom_id, schedule } = req.body;

        // Validation
        if (!classroom_id || !schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ error: 'Missing classroom_id or schedule array' });
        }

        // ONLY delete the days that are present in the new schedule payload.
        // This allows Incremental Saving (e.g. saving just Monday without wiping Tuesday).
        const daysToReset = [...new Set(schedule.map(item => item.day_of_week))];
        
        if (daysToReset.length > 0) {
            await Timetable.deleteMany({ 
                classroom_id: classroom_id, 
                day_of_week: { $in: daysToReset } 
            });
        }

        const insertedDocs = [];

        for (const item of schedule) {
            // item structure: { day_of_week, start_time, end_time, staff_id, subject }
            if (item.staff_id) { // Only add if a teacher is assigned
                const entry = new Timetable({
                    classroom_id,
                    day_of_week: item.day_of_week,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    staff_id: item.staff_id,
                    subject: item.subject || ''
                });
                const saved = await entry.save();
                insertedDocs.push(saved);

                // Notify staff (optional, can be noisy for bulk uploads)
            }
        }

        console.log(`📡 [Bulk Timetable] Room: ${classroom_id}, Items: ${schedule.length}, Days Reset: ${daysToReset.join(', ')}`);
        res.json({ 
            message: `Successfully updated ${insertedDocs.length} entries for ${daysToReset.join(', ')}`, 
            count: insertedDocs.length 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/timetable/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndDelete(req.params.id);
        if (!timetable) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }
        res.json({ message: 'Timetable entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get real-time staff locations (Admin only)
app.get('/api/admin/staff-locations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);

        // 1. Get today's attendance records (for attendance status)
        const attendanceToday = await Attendance.find({ date: todayDate }).lean();

        // 2. Get current timetable (for expected location)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        const currentSchedule = await Timetable.find({
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        }).populate('classroom_id', 'room_name').lean();

        // 3. Get ALL staff members with their LIVE location
        const allStaff = await Staff.find()
            .populate('last_seen_room', 'room_name')
            .sort({ name: 1 })
            .lean();

        // 4. Check for approved leaves today
        const now = new Date();
        const activeLeaves = await Leave.find({
            status: 'approved',
            start_date: { $lte: now },
            end_date: { $gte: now }
        }).lean();

        const staffLocations = allStaff.map(s => {
            const sid = s._id.toString();
            const schedule = currentSchedule.find(t => t.staff_id.toString() === sid);
            const onLeave = activeLeaves.find(l => l.staff_id.toString() === sid);
            
            // Find if there's an active attendance tracking right now
            const staffAttendance = attendanceToday.find(a => a.staff_id.toString() === sid);

            const signalThreshold = 90 * 1000; // 90 seconds — covers BLE heartbeat (15s) + Render latency
            const isLive = s.last_seen_time && (now - new Date(s.last_seen_time) < signalThreshold);

            let liveStatus = 'Scanning'; // Default status
            if (onLeave) {
                liveStatus = 'On Leave';
            } else if (isLive) {
                if (staffAttendance && ['Present', 'Late'].includes(staffAttendance.status)) {
                    liveStatus = staffAttendance.status;
                } else {
                    liveStatus = 'Tracking';
                }
            } else if (schedule) {
                liveStatus = 'Absent';
            }

            return {
                staff_id: s._id,
                staff_name: s.name,
                department: s.department,
                is_hod: s.is_hod,
                profile_picture: s.profile_picture,
                expected_location: schedule ? schedule.classroom_id?.room_name : 'No Class Assigned',
                actual_location: isLive ? 
                                 (s.last_seen_room?.room_name || 'Classroom') : 
                                 'Not in Range',
                status: liveStatus,
                check_in_time: s.last_seen_time || null,
                last_seen_location: s.last_seen_room?.room_name || 'Not in Range',
                is_correct_location: schedule ? 
                                     (isLive && s.last_seen_room?._id?.toString() === schedule.classroom_id?._id?.toString()) : 
                                     true
            };
        });

        res.json(staffLocations);
    } catch (err) {
        console.error('Error in staff-locations:', err);
        res.status(500).json({ error: err.message });
    }
});

// Attendance Reports (Admin & Executive)
app.get('/api/admin/attendance', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const { startDate, endDate, staffName, status } = req.query;
        let query = {};

        // Date range filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Status filtering
        if (status && status !== 'All') {
            query.status = status;
        }

        let attendance = await Attendance.find(query)
            .populate('staff_id', 'name department profile_picture')
            .populate('classroom_id', 'room_name')
            .sort({ check_in_time: -1 });

        // Staff name filtering (client-side filter is easier for partially matched names if populate is used, 
        // but we can filter the result after find if needed)
        if (staffName) {
            const search = staffName.toLowerCase();
            attendance = attendance.filter(a =>
                a.staff_id.name.toLowerCase().includes(search)
            );
        }

        const formatted = attendance
            .filter(a => a.staff_id) // Skip records with missing staff
            .map(a => ({
                id: a._id,
                staff_id: a.staff_id._id,
                classroom_id: a.classroom_id?._id,
                staff_name: a.staff_id.name || 'Unknown Staff',
                department: a.staff_id.department || 'N/A',
                room_name: a.classroom_id?.room_name || 'N/A',
                check_in_time: a.check_in_time,
                last_seen_time: a.last_seen_time,
                status: a.status,
                date: a.date,
                profile_picture: a.staff_id.profile_picture || null
            }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alerts (Admin only)
app.get('/api/admin/alerts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, staffName, is_read } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        if (is_read !== undefined) {
            query.is_read = is_read === 'true';
        }

        console.log(`[Alerts Debug] Fetching alerts with query:`, JSON.stringify(query));

        let alerts = await Alert.find(query)
            .populate('staff_id', 'name department')
            .populate('classroom_id', 'room_name')
            .sort({ timestamp: -1 });

        console.log(`[Alerts Debug] Found ${alerts.length} alerts in DB`);

        if (staffName) {
            const search = staffName.toLowerCase();
            alerts = alerts.filter(al =>
                al.staff_id && al.staff_id.name.toLowerCase().includes(search)
            );
        }

        const formatted = alerts.map(al => {
            if (!al.staff_id) return null;
            return {
                id: al._id,
                staff_id: al.staff_id._id,
                classroom_id: al.classroom_id ? al.classroom_id._id : null,
                staff_name: al.staff_id.name,
                department: al.staff_id.department,
                room_name: al.classroom_id ? al.classroom_id.room_name : 'N/A',
                message: al.message,
                timestamp: al.timestamp,
                is_read: !!al.is_read
            };
        }).filter(a => a !== null);

        console.log(`[Alerts Debug] Returning ${formatted.length} formatted alerts. First unread count check:`, formatted.filter(a => !a.is_read).length);

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark alerts as read by department (Admin only)
app.put('/api/admin/alerts/read-by-dept', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { department } = req.body;
        if (!department) {
            return res.status(400).json({ error: 'Department is required' });
        }

        const trimmedDept = department.trim();
        console.log(`[Alerts Debug] Marking alerts as read for dept: "${trimmedDept}"`);

        // Find all staff in this department
        const staffInDept = await Staff.find({ department: trimmedDept });
        const staffIds = staffInDept.map(s => s._id);

        console.log(`[Alerts Debug] Found ${staffIds.length} staff in dept. IDs:`, staffIds);

        // Update all unread alerts for these staff
        const result = await Alert.updateMany(
            { staff_id: { $in: staffIds }, is_read: { $ne: true } },
            { $set: { is_read: true } }
        );

        console.log(`[Alerts Debug] Update Result:`, result);

        res.json({ message: `Alerts for ${trimmedDept} marked as read`, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(`[Alerts Debug] Error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats (Admin only)
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDate = new Date(todayStr); // Midnight UTC for today's date

        // Calculate live tracking staffs
        const attendance = await Attendance.find({ date: todayDate }).sort({ check_in_time: -1 });
        const allStaff = await Staff.find().select('_id');
        
        const now = new Date();
        const signalThreshold = 5 * 60 * 1000; // 5 minutes in ms
        let liveTrackingCount = 0;

        allStaff.forEach(s => {
            const staffRecords = attendance.filter(a => a.staff_id.toString() === s._id.toString());
            if (staffRecords.length > 0) {
                const latest = staffRecords[0];
                const lastSeen = new Date(latest.last_seen_time || latest.check_in_time);
                if (now - lastSeen <= signalThreshold) {
                    liveTrackingCount++;
                }
            }
        });

        // Calculate absent staff based on approved leaves
        // Since start_date and end_date might be midnight UTC, we check if today is within range
        const absentStaff = await Leave.countDocuments({
            status: 'approved',
            start_date: { $lte: todayDate },
            end_date: { $gte: todayDate }
        });

        const stats = {
            totalStaff: allStaff.length,
            totalClassrooms: await Classroom.countDocuments(),
            presentToday: await Attendance.countDocuments({
                date: todayDate,
                status: 'Present'
            }),
            lateToday: await Attendance.countDocuments({
                date: todayDate,
                status: 'Late'
            }),
            pendingLeaves: await Leave.countDocuments({ status: 'pending' }),
            
            // New fields
            liveTrackingStaff: liveTrackingCount,
            absentOnLeave: absentStaff
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leave Management (Admin & Executive)
app.get('/api/admin/leaves', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const { status, startDate, endDate, staffName } = req.query;
        let query = {};

        if (status && status !== 'All') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.start_date = {};
            if (startDate) query.start_date.$gte = new Date(startDate);
            if (endDate) query.start_date.$lte = new Date(endDate);
        }

        let leaves = await Leave.find(query)
            .populate('staff_id', 'name department profile_picture')
            .sort({ createdAt: -1 });

        if (staffName) {
            const search = staffName.toLowerCase();
            leaves = leaves.filter(l =>
                l.staff_id?.name.toLowerCase().includes(search)
            );
        }

        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/leaves/:id', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const { status, admin_notes, principal_notes } = req.body;
        const userRole = req.user.role;
        
        const leave = await Leave.findById(req.params.id).populate('staff_id', 'name');
        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        let newStatus = status;

        // Executive Approval Step (Principal, Secretary, or Director)
        if (['principal', 'secretary', 'director'].includes(userRole)) {
            if (status === 'approved') {
                newStatus = 'approved_by_principal';
            }
            // Executive can also reject directly
            leave.status = newStatus;
            if (principal_notes) leave.principal_notes = principal_notes;
            leave.approved_by = req.user._id; // Track who last acted on it
        } 
        // Admin Approval Step (Final)
        else if (userRole === 'admin') {
            if (status === 'approved') {
                // Admin can only approve if Executive has already approved
                if (leave.status !== 'approved_by_principal') {
                    return res.status(400).json({ error: 'Leave must be approved by an Executive first' });
                }
                newStatus = 'approved';
            }
            leave.status = newStatus;
            if (admin_notes) leave.admin_notes = admin_notes;
            leave.approved_by = req.user._id;
        } else {
            return res.status(403).json({ error: 'Unauthorized to approve leaves' });
        }

        await leave.save();

        // Notify staff of the current progress
        const user = await User.findOne({ staff_id: leave.staff_id._id });
        if (user) {
            let title = 'Leave Request Update';
            let message = `Your leave request status is now: ${newStatus.replace(/_/g, ' ')}`;
            
            if (newStatus === 'approved_by_principal') {
                title = 'Leave Approved by Executive';
                message = `Your leave request has been approved by the Executive and is now pending final Admin approval.`;
            } else if (newStatus === 'approved') {
                title = 'Leave Fully Approved';
                message = `Your leave request has been fully approved.`;
            } else if (newStatus === 'rejected') {
                title = 'Leave Rejected';
                message = `Your leave request has been rejected.`;
            }

            const notifData = {
                recipient_id: user._id,
                title,
                message,
                type: 'leave_update'
            };
            await Notification.create(notifData);

            if (user.pushSubscription) {
                await sendPushNotification(user.pushSubscription, {
                    title: notifData.title,
                    body: notifData.message,
                    icon: '/logo192.png',
                    data: { url: '/staff/my-leaves' }
                });
            }
        }

        // If Principal approved, notify Admin
        if (newStatus === 'approved_by_principal') {
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                const adminNotif = {
                    recipient_id: admin._id,
                    title: 'New Leave Approval Needed',
                    message: `Leave request for ${leave.staff_id.name} was approved by Principal and needs your final approval.`,
                    type: 'leave_request'
                };
                await Notification.create(adminNotif);
                if (admin.pushSubscription) {
                    await sendPushNotification(admin.pushSubscription, {
                        title: adminNotif.title,
                        body: adminNotif.message,
                        icon: '/logo192.png',
                        data: { url: '/admin/leaves' }
                    });
                }
            }
        }

        // Handle substitution alerts ONLY if fully approved by Admin
        if (newStatus === 'approved') {
            const startStr = leave.start_date.toISOString().split('T')[0];
            const endStr = leave.end_date.toISOString().split('T')[0];

            // Get all dates in range
            const leaveDays = [];
            let current = new Date(startStr);
            const end = new Date(endStr);
            while (current <= end) {
                leaveDays.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            for (const date of leaveDays) {
                const dayOfWeek = days[date.getDay()];
                const dateString = date.toLocaleDateString();

                // Find classes for the staff on leave on this day
                const classes = await Timetable.find({
                    staff_id: leave.staff_id._id,
                    day_of_week: dayOfWeek
                }).populate('classroom_id', 'room_name');

                for (const cls of classes) {
                    // Find staff who are busy during this slot (any overlap)
                    const busyStaffEntries = await Timetable.find({
                        day_of_week: dayOfWeek,
                        start_time: { $lt: cls.end_time },
                        end_time: { $gt: cls.start_time }
                    }).select('staff_id');

                    const busyStaffIds = busyStaffEntries.map(e => e.staff_id.toString());

                    // Find all staff who are NOT busy and NOT the one on leave
                    const freeStaff = await Staff.find({
                        _id: { $nin: busyStaffIds, $ne: leave.staff_id._id }
                    });

                    for (const s of freeStaff) {
                        const sUser = await User.findOne({ staff_id: s._id });
                        if (sUser) {
                            const substitutionMsg = `Staff ${leave.staff_id.name} is on leave. Class in ${cls.classroom_id.room_name} on ${dateString} (${cls.start_time} - ${cls.end_time}) needs coverage. Are you available?`;

                            const subNotifData = {
                                recipient_id: sUser._id,
                                title: 'Substitution Opportunity',
                                message: substitutionMsg,
                                type: 'substitution_alert'
                            };
                            await Notification.create(subNotifData);

                            if (sUser.pushSubscription) {
                                await sendPushNotification(sUser.pushSubscription, {
                                    title: subNotifData.title,
                                    body: subNotifData.message,
                                    icon: '/logo192.png',
                                    data: { url: '/staff/notifications' }
                                });
                            }

                            // Send Email Alert
                            await sendEmail(sUser.email, 'Substitution Opportunity', substitutionMsg);
                        }
                    }
                }
            }
        }

        res.json(leave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// SOFT BEACON ENDPOINT (Authenticated Staff)
// Lets a staff member use the web app as a virtual beacon.
// Sends a heartbeat to the same attendance logic as the ESP32.
// ============================================

app.post('/api/staff/soft-beacon', authenticateToken, requireStaff, async (req, res) => {
    try {
        const { classroom_id } = req.body;
        if (!classroom_id) {
            return res.status(400).json({ error: 'classroom_id is required' });
        }

        // 1. Get the staff record linked to this user (to get their beacon_uuid)
        const staff = await Staff.findById(req.user.staff_id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff record not linked to your account. Contact Admin.' });
        }
        if (!staff.beacon_uuid) {
            return res.status(400).json({ error: 'No beacon UUID assigned to your staff record. Contact Admin.' });
        }

        // 2. Get the classroom
        const classroom = await Classroom.findById(classroom_id);
        if (!classroom) {
            return res.status(404).json({ error: 'Classroom not found.' });
        }

        const { todayStr, currentTime, currentDay, istDate } = getISTDateInfo();
        const now = istDate; 


        console.log(`[Soft Beacon] ${staff.name} → ${classroom.room_name} at ${currentTime}`);

        // 3. ALWAYS update live-location (so admin sees staff as "Live" regardless of timetable)
        await Staff.findByIdAndUpdate(staff._id, {
            last_seen_room: classroom._id,
            last_seen_time: now,
        });
        staffCache.delete(staff._id.toString());

        // 4. CHECK PERMISSION for attendance tracking (Timetable or Substitution)
        const permission = await isStaffPermitted(staff._id, classroom._id);
        if (!permission.permitted) {
            // Location is updated — only attendance marking is restricted
            return res.json({
                status: 'location_updated',
                message: `Location updated: You are in ${classroom.room_name}. No attendance recorded (no scheduled class).`,
                attendance_status: null
            });
        }

        const slot = permission.slot;
        const subType = permission.type;

        // 5. Find or create today's attendance record for this staff+classroom
        let attendance = await Attendance.findOne({
            staff_id:     staff._id,
            classroom_id: classroom._id,
            date:         new Date(todayStr)
        });

        if (attendance) {
            attendance.last_seen_time = now;
            if (attendance.status === 'Absent') attendance.status = 'Tracking';
            await attendance.save();

            const durationMs      = attendance.last_seen_time - attendance.check_in_time;
            const durationMinutes = durationMs / (1000 * 60);

            if (durationMinutes >= 25 && attendance.status === 'Tracking') {
                let newStatus = 'Present';

                if (slot) {
                    const startTimeDate = new Date(`${todayStr}T${slot.start_time}:00`);
                    const arrivalDiff   = (attendance.check_in_time - startTimeDate) / (1000 * 60);
                    if (arrivalDiff > parseInt(process.env.TIME_WINDOW_MINUTES || 15)) {
                        newStatus = 'Late';
                    }
                }

                attendance.status = newStatus;
                await attendance.save();

                if (newStatus === 'Late') {
                    const alertMessage = `${staff.name} marked Late via Soft Beacon for class in ${classroom.room_name}`;
                    await Alert.create({ staff_id: staff._id, classroom_id: classroom._id, message: alertMessage });
                }

                return res.json({
                    status: 'confirmed',
                    message: `Attendance confirmed (25m reached). Status: ${newStatus}`,
                    attendance_status: newStatus,
                    duration_minutes: Math.round(durationMinutes)
                });
            }

            return res.json({
                status:             'updated',
                message:            `Soft beacon heartbeat recorded. Duration: ${Math.round(durationMinutes)}m`,
                attendance_status:  attendance.status,
                duration_minutes:   Math.round(durationMinutes)
            });

        } else {
            // First heartbeat of the day — start tracking
            attendance = new Attendance({
                staff_id:       staff._id,
                classroom_id:   classroom._id,
                check_in_time:  now,
                last_seen_time: now,
                status:         'Tracking',
                date:           new Date(todayStr)
            });
            await attendance.save();

            return res.json({
                status:            'started',
                message:           'Soft beacon: Attendance tracking started.',
                attendance_status: 'Tracking',
                duration_minutes:  0
            });
        }

    } catch (err) {
        console.error('[Soft Beacon Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Get list of classrooms (for staff soft-beacon room selector)
app.get('/api/staff/classrooms', authenticateToken, requireStaff, async (req, res) => {
    try {
        const classrooms = await Classroom.find({}, 'room_name esp32_id room_uuid').lean();
        res.json(classrooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify Location via Mobile BLE Scan (Reversed Detection)
// This is used when the phone detects an ESP32 room beacon.
app.post('/api/staff/verify-location', authenticateToken, requireStaff, async (req, res) => {
    try {
        const { room_uuid, rssi } = req.body;
        console.log(`[Mobile BLE] Staff ${req.user.name} detected Room UUID: ${room_uuid} with RSSI: ${rssi}`);

        // 1. Find classroom by its broadcasted UUID
        const classroom = await Classroom.findOne({ room_uuid: room_uuid.toUpperCase() });
        if (!classroom) return res.status(404).json({ error: 'Unrecognized classroom beacon.' });

        // 1b. Verify permission
        const permission = await isStaffPermitted(req.user.staff_id, classroom._id);
        if (!permission.permitted) {
            return res.status(403).json({ 
                error: `Not permitted: You have no scheduled class in ${classroom.room_name} and have not been authorized for substitution.` 
            });
        }

        const slot = permission.slot;

        // 2. Reuse the same logic as the soft-beacon for consistency
        // (This triggers the same 25-minute tracking logic)
        const staff = await Staff.findById(req.user.staff_id);
        if (!staff) return res.status(404).json({ error: 'Staff record not found.' });

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        // Permission is already checked in step 1b above via isStaffPermitted
        const subType = permission.type;

        // Update Staff live-location fields so admin dashboard shows this staff as "Live"
        await Staff.findByIdAndUpdate(staff._id, {
            last_seen_room: classroom._id,
            last_seen_time: now,
        });
        staffCache.delete(staff._id.toString());

        let attendance = await Attendance.findOne({
            staff_id:     staff._id,
            classroom_id: classroom._id,
            date:         new Date(todayStr)
        });

        if (attendance) {
            attendance.last_seen_time = now;
            if (attendance.status === 'Absent') attendance.status = 'Tracking';
            await attendance.save();

            const durationMinutes = (attendance.last_seen_time - attendance.check_in_time) / (1000 * 60);

            if (durationMinutes >= 25 && attendance.status === 'Tracking') {
                let newStatus = 'Present';
                if (slot) {
                    const startTimeDate = new Date(`${todayStr}T${slot.start_time}:00`);
                    if ((attendance.check_in_time - startTimeDate) / (1000 * 60) > 15) {
                        newStatus = 'Late';
                    }
                }
                attendance.status = newStatus;
                await attendance.save();
                if (newStatus === 'Late') {
                    await Alert.create({ staff_id: staff._id, classroom_id: classroom._id, message: `${staff.name} marked Late via Mobile BLE` });
                }
                return res.json({ status: 'confirmed', attendance_status: newStatus });
            }
            return res.json({ status: 'updated', attendance_status: attendance.status, duration_minutes: Math.round(durationMinutes) });
        } else {
            attendance = new Attendance({
                staff_id: staff._id,
                classroom_id: classroom._id,
                check_in_time: now,
                last_seen_time: now,
                status: 'Tracking',
                date: new Date(todayStr)
            });
            await attendance.save();
            return res.json({ status: 'started', attendance_status: 'Tracking' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAFF ENDPOINTS (Protected)
// ============================================

// Get staff's own attendance
app.get('/api/staff/my-attendance', authenticateToken, requireStaff, async (req, res) => {
    try {
        const attendance = await Attendance.find({ staff_id: req.user.staff_id })
            .populate('classroom_id', 'room_name')
            .sort({ check_in_time: -1 })
            .limit(50);

        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get staff's timetable
app.get('/api/staff/my-timetable', authenticateToken, requireStaff, async (req, res) => {
    try {
        const timetable = await Timetable.find({ staff_id: req.user.staff_id })
            .populate('classroom_id', 'room_name');

        const formatted = timetable.map(t => ({
            id: t._id,
            room_name: t.classroom_id ? t.classroom_id.room_name : 'Unknown Room',
            day_of_week: t.day_of_week,
            start_time: t.start_time,
            end_time: t.end_time,
            subject: t.subject || '-'
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit leave request
app.post('/api/staff/leave', authenticateToken, requireStaff, async (req, res) => {
    try {
        const { start_date, end_date, reason, leave_type } = req.body;

        if (!req.user.staff_id) {
            return res.status(400).json({ error: 'Your user account is not linked to a staff record. Please contact an administrator.' });
        }

        const leave = new Leave({
            staff_id: req.user.staff_id,
            start_date,
            end_date,
            reason,
            leave_type
        });
        await leave.save();

        // Notify Principal (First Step)
        const principals = await User.find({ role: 'principal' });
        const staff = await Staff.findById(req.user.staff_id);
        const staffName = staff ? staff.name : req.user.name;
        
        // Also notify admins but they shouldn't act yet? User said "first sent to the principal"
        // Let's notify both but maybe emphasize Principal
        const recipients = await User.find({ role: { $in: ['admin', 'principal'] } });

        for (const recipient of recipients) {
            const isPrincipal = recipient.role === 'principal';
            const leaveNotifData = {
                recipient_id: recipient._id,
                title: isPrincipal ? 'Action Required: New Leave Request' : 'New Leave Request (Pending Principal)',
                message: `${staffName} has submitted a leave request starting ${new Date(start_date).toDateString()}. ${isPrincipal ? 'Please review for initial approval.' : 'Waiting for Principal approval.'}`,
                type: 'leave_request'
            };
            await Notification.create(leaveNotifData);

            if (recipient.pushSubscription) {
                await sendPushNotification(recipient.pushSubscription, {
                    title: leaveNotifData.title,
                    body: leaveNotifData.message,
                    icon: '/logo192.png',
                    data: { url: '/admin/leaves' }
                });
            }
        }

        res.json({ message: 'Leave request submitted successfully', leave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get staff's leave requests
app.get('/api/staff/my-leaves', authenticateToken, requireStaff, async (req, res) => {
    try {
        const leaves = await Leave.find({ staff_id: req.user.staff_id })
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user notifications (Both Staff and Admin)
app.get('/api/staff/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient_id: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read (Both Staff and Admin)
app.put('/api/staff/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { is_read: true },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get unread notification count (Both Staff and Admin)
app.get('/api/staff/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient_id: req.user._id,
            is_read: false
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// SWAP & SUBSTITUTION ENDPOINTS (Proposed Feature)
// ============================================

// 1. Staff/Executive: Request Admin Permission for Urgent Swap
app.post('/api/staff/swap-request', authenticateToken, requireStaffOrExecutive, async (req, res) => {
    try {
        if (!req.user.staff_id) {
            return res.status(403).json({ error: 'Your account is not linked to a Staff profile. Contact Admin.' });
        }
        const { classroom_id, reason } = req.body;
        const swapReq = new SwapRequest({
            requesting_staff_id: req.user.staff_id,
            classroom_id,
            reason
        });
        await swapReq.save();

        // Notify Admins and Executives (Principal, Secretary, Director)
        const admins = await User.find({ role: { $in: ['admin', 'principal', 'secretary', 'director'] } });
        const staff = await Staff.findById(req.user.staff_id);
        const classroom = await Classroom.findById(classroom_id);
        const roomName = classroom ? classroom.room_name : 'unknown room';

        for (const admin of admins) {
            const notifData = {
                recipient_id: admin._id,
                title: 'Urgent Swap Request',
                message: `Staff ${staff?.name || 'Unknown'} is requesting permission for an urgent swap in ${roomName}. Reason: ${reason}`,
                type: 'swap_request',
                related_data: { swapRequestId: swapReq._id }
            };
            await Notification.create(notifData);

            if (admin.pushSubscription) {
                sendPushNotification(admin.pushSubscription, {
                    title: notifData.title,
                    body: notifData.message,
                    icon: '/logo192.png',
                    data: { url: '/admin/swaps' }
                }).catch(e => console.error("Admin Push Error:", e));
            }
        }

        res.json({ message: 'Urgent swap request sent to admin for approval.', swapReq });
    } catch (err) {
        console.error('Swap Request Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Admin/Executive: Approve Swap Request
app.put('/api/admin/swap-request/:id/approve', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const swapReq = await SwapRequest.findById(req.params.id);
        if (!swapReq) return res.status(404).json({ error: 'Swap request not found.' });
        
        swapReq.status = 'approved';
        await swapReq.save();

        // Notify Staff
        const staffUser = await User.findOne({ staff_id: swapReq.requesting_staff_id });
        if (staffUser) {
            const notifData = {
                recipient_id: staffUser._id,
                title: 'Swap Request Approved',
                message: `The administration has approved your urgent swap request. You can now search for free staff to cover your class.`,
                type: 'swap_request',
                related_data: { swapRequestId: swapReq._id }
            };
            Notification.create(notifData);
            
            if (staffUser.pushSubscription) {
                sendPushNotification(staffUser.pushSubscription, {
                    title: notifData.title,
                    body: notifData.message,
                    icon: '/logo192.png',
                    data: { url: '/staff' }
                }).catch(e => console.error("Staff Approve Push Error:", e));
            }
        }
        res.json({ message: 'Swap request approved.', swapReq });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin/Executive: Reject Swap Request
app.put('/api/admin/swap-request/:id/reject', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const swapReq = await SwapRequest.findById(req.params.id);
        if (!swapReq) return res.status(404).json({ error: 'Swap request not found.' });
        
        swapReq.status = 'rejected';
        await swapReq.save();

        // Notify Staff
        const staffUser = await User.findOne({ staff_id: swapReq.requesting_staff_id });
        if (staffUser) {
            await Notification.create({
                recipient_id: staffUser._id,
                title: 'Swap Request Rejected',
                message: `Administration has rejected your urgent swap request.`,
                type: 'swap_request',
                related_data: { swapRequestId: swapReq._id }
            });
        }
        res.json({ message: 'Swap request rejected.', swapReq });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin/Executive: Get all swap requests
app.get('/api/admin/swap-requests', authenticateToken, (req, res, next) => {
    if (req.user.role === 'admin' || ['principal', 'secretary', 'director'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}, async (req, res) => {
    try {
        const swaps = await SwapRequest.find()
            .populate('requesting_staff_id', 'name department profile_picture')
            .populate('classroom_id', 'room_name')
            .populate('substitute_staff_id', 'name')
            .sort({ createdAt: -1 }); // Better to sort by createdAt for most recent first
        res.json(swaps);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Staff/Executive: Find Free Staff for current time
app.get('/api/staff/find-free-staff', authenticateToken, requireStaffOrExecutive, async (req, res) => {
    try {
        if (!req.user.staff_id) {
            return res.status(403).json({ error: 'Your account is not linked to a Staff profile. Contact Admin.' });
        }
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        const busyStaffTimetables = await Timetable.find({
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        }).distinct('staff_id');

        const freeStaff = await Staff.find({
            _id: { $nin: busyStaffTimetables, $ne: req.user.staff_id }
        });

        res.json(freeStaff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Staff/Executive: Request Covering from Free Staff
app.post('/api/staff/request-substitution', authenticateToken, requireStaffOrExecutive, async (req, res) => {
    try {
        if (!req.user.staff_id) {
            return res.status(403).json({ error: 'Your account is not linked to a Staff profile. Contact Admin.' });
        }
        const { target_staff_id, swap_request_id } = req.body;
        let swapReq;

        if (swap_request_id === 'auto') {
            // Find the most recent approved swap request for this staff
            swapReq = await SwapRequest.findOne({
                requesting_staff_id: req.user.staff_id,
                status: 'approved'
            }).sort({ date: -1 });
        } else {
            swapReq = await SwapRequest.findById(swap_request_id);
        }

        if (!swapReq || swapReq.status !== 'approved') {
            return res.status(403).json({ error: 'Substitution can only be requested after Admin approval.' });
        }

        const requester = await Staff.findById(req.user.staff_id);
        const targetUser = await User.findOne({ staff_id: target_staff_id });
        if (targetUser) {
            await Notification.create({
                recipient_id: targetUser._id,
                title: 'Substitution Request',
                message: `Staff ${requester.name} has requested you to cover their class (Urgent). Do you accept?`,
                type: 'substitution_request',
                related_data: { swapRequestId: swapReq._id }
            });
        }

        res.json({ message: 'Substitution request sent to the staff.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Staff/Executive: Accept Substitution Request
app.post('/api/staff/accept-substitution', authenticateToken, requireStaffOrExecutive, async (req, res) => {
    try {
        if (!req.user.staff_id) {
            return res.status(403).json({ error: 'Your account is not linked to a Staff profile. Contact Admin.' });
        }
        const { swap_request_id } = req.body;
        const swapReq = await SwapRequest.findById(swap_request_id);
        if (!swapReq) return res.status(404).json({ error: 'Request no longer exists.' });

        swapReq.substitute_staff_id = req.user.staff_id;
        swapReq.status = 'completed';
        await swapReq.save();

        // Notify Original Staff
        const originUser = await User.findOne({ staff_id: swapReq.requesting_staff_id });
        const substitute = await Staff.findById(req.user.staff_id);
        if (originUser) {
            await Notification.create({
                recipient_id: originUser._id,
                title: 'Substitution Accepted',
                message: `Staff ${substitute.name} has accepted to cover your class.`,
                type: 'swap_request',
                related_data: { swapRequestId: swapReq._id }
            });
        }

        res.json({ message: 'You have accepted the substitution. You are now authorized to check in for this classroom.', swapReq });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// BLE DATA ENDPOINT (Public - from ESP32)
// ============================================

app.post('/api/ble-data', async (req, res) => {
    console.log(`[BLE DEBUG] Room: ${req.body.esp32_id}, ID: ${req.body.beacon_uuid}, RSSI: ${req.body.rssi}`);
    try {
        const { esp32_id, beacon_uuid, rssi } = req.body;
        if (!esp32_id || !beacon_uuid || rssi === undefined) {
            return res.status(400).json({ error: 'Missing required fields: esp32_id, beacon_uuid, rssi' });
        }

        // ── STEP 1: RSSI Rolling Average Filter ─────────────────────────────
        const bufferKey = `${beacon_uuid.toUpperCase()}-${esp32_id.toUpperCase()}`;
        const readings = rssiBuffer.get(bufferKey) || [];
        readings.push(rssi);
        if (readings.length > RSSI_BUFFER_SIZE) readings.shift();
        rssiBuffer.set(bufferKey, readings);
        const avgRssi = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);

        const rssiThreshold = parseInt(process.env.RSSI_THRESHOLD || -75);
        if (avgRssi < rssiThreshold) {
            return res.json({ status: 'ignored', message: `Avg RSSI ${avgRssi} dBm below threshold ${rssiThreshold} dBm` });
        }

        // ── STEP 2: Throttle (10s per beacon+room) ──────────────────────────
        const throttleKey = bufferKey;
        const lastProcessed = bleThrottle.get(throttleKey) || 0;
        const now = new Date();
        if (now.getTime() - lastProcessed < 10000) {
            return res.json({ status: 'ignored', message: 'Throttled: Recently processed this beacon.' });
        }
        bleThrottle.set(throttleKey, now.getTime());

        // ── STEP 3: Lookup Staff (cached) ────────────────────────────────────
        let staff = staffCache.get(beacon_uuid.toUpperCase());
        if (!staff) {
            staff = await Staff.findOne({ beacon_uuid: beacon_uuid.toUpperCase() });
            if (staff) staffCache.set(beacon_uuid.toUpperCase(), staff);
        }
        if (!staff) {
            console.log(`[BLE] Unknown beacon UUID: "${beacon_uuid.toUpperCase()}"`);
            return res.status(404).json({ error: 'Staff not found for this beacon UUID' });
        }

        // ── STEP 4: Lookup Classroom (cached) ────────────────────────────────
        let classroom = classroomCache.get(esp32_id.toUpperCase());
        if (!classroom) {
            classroom = await Classroom.findOne({ esp32_id: esp32_id.toUpperCase() });
            if (classroom) classroomCache.set(esp32_id.toUpperCase(), classroom);
        }
        if (!classroom) {
            console.log(`[BLE] Unknown ESP32 ID: "${esp32_id.toUpperCase()}"`);
            return res.status(404).json({ error: 'Classroom not found for this ESP32 ID' });
        }

        // ── STEP 5: ALWAYS Update Live Location ──────────────────────────────
        // This runs regardless of class schedule — so the dashboard always shows
        // where a staff member is, even outside class hours.
        await Staff.findByIdAndUpdate(staff._id, {
            last_seen_room: classroom._id,
            last_seen_time: now,
            last_seen_rssi: avgRssi
        });
        // Invalidate cache so fresh location is returned on next lookup
        staffCache.delete(beacon_uuid.toUpperCase());
        console.log(`[BLE] 📍 ${staff.name} → ${classroom.room_name} | RSSI: ${avgRssi} dBm`);

        // ── STEP 6: Check Timetable Permission for Attendance ────────────────
        // Attendance is only marked when there is a scheduled class right now.
        const todayStr = now.toISOString().split('T')[0];
        const permission = await isStaffPermitted(staff._id, classroom._id);

        if (!permission.permitted) {
            // No class right now — but location was still updated above. That's fine.
            console.log(`[BLE] No class for ${staff.name} in ${classroom.room_name} right now. Location updated only.`);
            return res.json({
                status: 'location_updated',
                message: `Location updated: ${staff.name} is in ${classroom.room_name}`,
                staff_name: staff.name,
                room_name: classroom.room_name,
                rssi: avgRssi
            });
        }

        const slot = permission.slot;

        // ── STEP 7: Attendance Tracking ──────────────────────────────────────
        let attendance = await Attendance.findOne({
            staff_id: staff._id,
            classroom_id: classroom._id,
            date: new Date(todayStr)
        });

        if (attendance) {
            attendance.last_seen_time = now;
            if (attendance.status === 'Absent') attendance.status = 'Tracking';
            await attendance.save();

            const durationMinutes = (attendance.last_seen_time - attendance.check_in_time) / (1000 * 60);

            if (durationMinutes >= 25 && attendance.status === 'Tracking') {
                let newStatus = 'Present';
                if (slot) {
                    const startTimeDate = new Date(`${todayStr}T${slot.start_time}:00`);
                    const arrivalDiff = (attendance.check_in_time - startTimeDate) / (1000 * 60);
                    if (arrivalDiff > parseInt(process.env.TIME_WINDOW_MINUTES || 15)) {
                        newStatus = 'Late';
                    }
                }
                attendance.status = newStatus;
                await attendance.save();

                if (newStatus === 'Late') {
                    const alertMessage = `${staff.name} marked Late for class in ${classroom.room_name}`;
                    await Alert.create({ staff_id: staff._id, classroom_id: classroom._id, message: alertMessage });

                    const staffUser = await User.findOne({ staff_id: staff._id });
                    if (staffUser) {
                        if (staffUser.email) await sendEmail(staffUser.email, 'Attendance Alert: Late', `You have been marked LATE for your class in ${classroom.room_name}.`);
                        const notifData = { recipient_id: staffUser._id, title: 'Attendance Alert', message: `You have been marked LATE for your class in ${classroom.room_name}.`, type: 'late_alert' };
                        await Notification.create(notifData);
                        if (staffUser.pushSubscription) await sendPushNotification(staffUser.pushSubscription, { title: notifData.title, body: notifData.message, icon: '/logo192.png', data: { url: '/staff/notifications' } });
                    }

                    const hods = await Staff.find({ department: staff.department, is_hod: true });
                    for (const hod of hods) {
                        const hodUser = await User.findOne({ staff_id: hod._id });
                        if (hodUser) {
                            await sendEmail(hodUser.email, 'Department Lateness Alert', `HOD Alert: ${staff.name} has been marked LATE in ${classroom.room_name}.`);
                            const hodNotif = { recipient_id: hodUser._id, title: 'Dept. Lateness Alert', message: alertMessage, type: 'late_alert' };
                            await Notification.create(hodNotif);
                            if (hodUser.pushSubscription) await sendPushNotification(hodUser.pushSubscription, { title: hodNotif.title, body: hodNotif.message, icon: '/logo192.png', data: { url: '/admin/alerts' } });
                        }
                    }

                    const admins = await User.find({ role: { $in: ['admin', 'principal', 'secretary', 'director'] } });
                    for (const admin of admins) {
                        const adminNotif = { recipient_id: admin._id, title: 'Staff Lateness Alert', message: `${staff.name} is marked LATE in ${classroom.room_name}.`, type: 'late_alert' };
                        await Notification.create(adminNotif);
                        if (admin.pushSubscription) await sendPushNotification(admin.pushSubscription, { title: adminNotif.title, body: adminNotif.message, icon: '/logo192.png', data: { url: '/admin/alerts' } });
                    }
                }
                return res.json({ status: 'updated', attendance_status: newStatus, staff_name: staff.name, room_name: classroom.room_name });
            }

            return res.json({ status: 'tracking', attendance_status: attendance.status, duration_minutes: Math.round(durationMinutes), staff_name: staff.name, room_name: classroom.room_name });

        } else {
            // First detection for this class today — start tracking
            attendance = new Attendance({
                staff_id: staff._id,
                classroom_id: classroom._id,
                check_in_time: now,
                last_seen_time: now,
                status: 'Tracking',
                date: new Date(todayStr)
            });
            await attendance.save();
            console.log(`[BLE] ✅ Attendance started: ${staff.name} in ${classroom.room_name}`);
            return res.json({ status: 'started', attendance_status: 'Tracking', staff_name: staff.name, room_name: classroom.room_name });
        }

    } catch (err) {
        console.error('[BLE Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// LEGACY ENDPOINTS (For backward compatibility)
// ============================================


app.get('/api/staff', async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/classrooms', async (req, res) => {
    try {
        const classrooms = await Classroom.find();
        res.json(classrooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Real-time Dashboard Stats
app.get(['/api/admin/dashboard-stats', '/api/dashboard-stats'], authenticateToken, async (req, res) => {
    try {
        const { todayStr } = getISTDateInfo();
        const todayDate = new Date(todayStr);

        const stats = {
            totalStaff: await Staff.countDocuments(),
            totalClassrooms: await Classroom.countDocuments(),
            presentToday: await Attendance.countDocuments({
                date: todayDate,
                status: 'Present'
            }),
            lateToday: await Attendance.countDocuments({
                date: todayDate,
                status: 'Late'
            })
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/', (req, res) => {
    res.json({ message: 'Staff Presence Verification API is running' });
});

// ============================================
// CRON JOBS
// ============================================

// Job 1: Notify staff 5 minutes before class
cron.schedule('* * * * *', async () => {
    try {
        const { istDate } = getISTDateInfo();
        const notificationTime = new Date(istDate.getTime() + 5 * 60000); // 5 mins from now IST
        const { currentDay, currentTime: targetTime } = getISTDateInfo(notificationTime);

        // Find classes starting in 5 minutes
        const upcomingClasses = await Timetable.find({
            day_of_week: currentDay,
            start_time: targetTime
        }).populate('staff_id', 'name phone_number').populate('classroom_id', 'room_name');

        for (const cls of upcomingClasses) {
            const user = await User.findOne({ staff_id: cls.staff_id._id });
            if (user) {
                // Check if notification already sent to avoid duplicates (optional, but good practice)
                const exists = await Notification.findOne({
                    recipient_id: user._id,
                    type: 'upcoming_class',
                    createdAt: { $gte: new Date(now.getTime() - 60000) } // Created in last minute
                });

                if (!exists) {
                    const notifData = {
                        recipient_id: user._id,
                        title: 'Upcoming Class',
                        message: `You have a class in ${cls.classroom_id.room_name} starting in 5 minutes at ${cls.start_time}.`,
                        type: 'upcoming_class'
                    };
                    await Notification.create(notifData);

                    // Push Notification to Staff
                    if (user.pushSubscription) {
                        await sendPushNotification(user.pushSubscription, {
                            title: notifData.title,
                            body: notifData.message,
                            icon: '/logo192.png',
                            data: { url: '/staff/my-timetable' }
                        });
                    }

                    // 1. Send Email to Staff
                    await sendEmail(
                        user.email,
                        'Upcoming Class Reminder',
                        `Reminder: You have a class in ${cls.classroom_id.room_name} starting in 5 minutes.`
                    );

                    // 2. Notify HOD(s) 
                    const hods = await Staff.find({ department: cls.staff_id.department, is_hod: true });
                    for (const hod of hods) {
                        const hodUser = await User.findOne({ staff_id: hod._id });
                        if (hodUser) {
                            await sendEmail(hodUser.email, 'Upcoming Class Warning (Dept)', `HOD Alert: ${cls.staff_id.name} has a class starting in 5 minutes in ${cls.classroom_id.room_name}.`);

                            const hodNotifData = {
                                recipient_id: hodUser._id,
                                title: 'Upcoming Class (Dept)',
                                message: `${cls.staff_id.name} has a class in ${cls.classroom_id.room_name} starting in 5 minutes.`,
                                type: 'upcoming_class_dept'
                            };
                            await Notification.create(hodNotifData);

                            if (hodUser.pushSubscription) {
                                await sendPushNotification(hodUser.pushSubscription, {
                                    title: hodNotifData.title,
                                    body: hodNotifData.message,
                                    icon: '/logo192.png',
                                    data: { url: '/admin/staff-locations' }
                                });
                            }
                        }
                    }

                    // 3. Notify Admins (Executives)
                    const admins = await User.find({ role: { $in: ['admin', 'principal', 'secretary', 'director'] } });
                    for (const admin of admins) {
                        const adminNotifData = {
                            recipient_id: admin._id,
                            title: 'Upcoming Class Alert',
                            message: `Staff ${cls.staff_id.name} has a class starting in 5 minutes in ${cls.classroom_id.room_name}.`,
                            type: 'upcoming_class_admin'
                        };
                        await Notification.create(adminNotifData);

                        if (admin.pushSubscription) {
                            await sendPushNotification(admin.pushSubscription, {
                                title: adminNotifData.title,
                                body: adminNotifData.message,
                                icon: '/logo192.png',
                                data: { url: '/admin/staff-locations' }
                            });
                        }
                    }
                    console.log(`Sent 5-min warnings to ${cls.staff_id.name} and HODs`);
                }
            }
        }
    } catch (err) {
        console.error('Error in 5-min cron:', err);
    }
});

// Job 2: Alert if staff absent 15 minutes after class starts (Warning only)
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const checkTime = new Date(now.getTime() - 15 * 60000); // 15 mins ago
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[checkTime.getDay()];
        const targetTime = checkTime.toTimeString().substring(0, 5);
        const todayStr = now.toISOString().split('T')[0];

        // Find classes that started 15 minutes ago
        const startedClasses = await Timetable.find({
            day_of_week: currentDay,
            start_time: targetTime
        }).populate('staff_id', 'name department phone_number').populate('classroom_id', 'room_name');

        for (const cls of startedClasses) {
            // Check if attendance exists
            const attendance = await Attendance.findOne({
                staff_id: cls.staff_id._id,
                classroom_id: cls.classroom_id._id,
                date: new Date(todayStr)
            });

            if (!attendance) {
                console.log(`Staff ${cls.staff_id.name} is absent for class at ${cls.start_time} (Sending Warning)`);

                // 1. Create System Alert (Warning Level)
                const alertMessage = `Warning: Staff ${cls.staff_id.name} (${cls.staff_id.department}) has not arrived for class in ${cls.classroom_id.room_name} (started at ${cls.start_time}).`;
                await Alert.create({
                    staff_id: cls.staff_id._id,
                    classroom_id: cls.classroom_id._id,
                    message: alertMessage
                });

                // 2. Notify Admins
                const admins = await User.find({ role: { $in: ['admin', 'principal', 'secretary', 'director'] } });
                for (const admin of admins) {
                    const adminNotifData = {
                        recipient_id: admin._id,
                        title: 'Staff Absence Warning',
                        message: alertMessage,
                        type: 'absence_warning'
                    };
                    await Notification.create(adminNotifData);

                    if (admin.pushSubscription) {
                        await sendPushNotification(admin.pushSubscription, {
                            title: adminNotifData.title,
                            body: adminNotifData.message,
                            icon: '/logo192.png',
                            data: { url: '/admin/alerts' }
                        });
                    }
                }

                // 3. Notify HOD of the department
                // Find IDs of HODs in that department
                const hods = await Staff.find({ department: cls.staff_id.department, is_hod: true });
                for (const hod of hods) {
                    // Find User account for this HOD
                    const hodUser = await User.findOne({ staff_id: hod._id });
                    if (hodUser) {
                        // Send Email to HOD
                        await sendEmail(hodUser.email, 'Department Absence Warning', `HOD Alert: Staff ${cls.staff_id.name} is absent for class in ${cls.classroom_id.room_name}.`);

                        const hodNotifData = {
                            recipient_id: hodUser._id,
                            title: 'Dept. Absence Warning',
                            message: alertMessage,
                            type: 'absence_warning'
                        };
                        await Notification.create(hodNotifData);

                        if (hodUser.pushSubscription) {
                            await sendPushNotification(hodUser.pushSubscription, {
                                title: hodNotifData.title,
                                body: hodNotifData.message,
                                icon: '/logo192.png',
                                data: { url: '/admin/alerts' }
                            });
                        }
                    }
                }

                // 4. Notify the Staff member themselves
                const user = await User.findOne({ staff_id: cls.staff_id._id });
                if (user) {
                    const staffNotifData = {
                        recipient_id: user._id,
                        title: 'Absence Warning',
                        message: `You have not been detected for your class in ${cls.classroom_id.room_name} at ${cls.start_time}.`,
                        type: 'absence_warning'
                    };
                    await Notification.create(staffNotifData);

                    if (user.pushSubscription) {
                        await sendPushNotification(user.pushSubscription, {
                            title: staffNotifData.title,
                            body: staffNotifData.message,
                            icon: '/logo192.png',
                            data: { url: '/staff/notifications' }
                        });
                    }

                    // Send Email to Staff
                    await sendEmail(user.email, 'Absence Warning', `Absence Alert: You were not detected in ${cls.classroom_id.room_name} for your ${cls.start_time} class.`);
                }
            }
        }
    } catch (err) {
        console.error('Error in 15-min absence warning cron:', err);
    }
});

// Job 3: Cleanup stale "Tracking" sessions
// Runs every 15 minutes to finalize sessions where the class has ended or day has passed
cron.schedule('*/15 * * * *', async () => {
    try {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().substring(0, 5);
        const todayStr = now.toISOString().split('T')[0];

        // Find all records still in "Tracking" status
        const stagnantRecords = await Attendance.find({ status: 'Tracking' });

        for (const record of stagnantRecords) {
            const recordDateStr = record.date.toISOString().split('T')[0];
            const isToday = recordDateStr === todayStr;

            // 1. If it's a previous day, finalize it immediately
            if (!isToday) {
                const durationMs = record.last_seen_time - record.check_in_time;
                const durationMinutes = durationMs / (1000 * 60);

                // User Rule: If duration < 25 mins, mark as Absent
                record.status = durationMinutes < 25 ? 'Absent' : 'Present';
                await record.save();
                console.log(`[Cleanup] Finalized old record for staff ${record.staff_id} from ${recordDateStr} (Status: ${record.status})`);
                continue;
            }

            // 2. If it's today, check if their class slot for this room has ended
            // We find the slot that matches the record's classroom and staff
            const slot = await Timetable.findOne({
                staff_id: record.staff_id,
                classroom_id: record.classroom_id,
                day_of_week: currentDay
            }).sort({ end_time: -1 });

            if (slot) {
                // If now is past slot end_time + 15 mins buffer, finalize
                const [endH, endM] = slot.end_time.split(':');
                const slotEndTime = new Date(record.date);
                slotEndTime.setHours(parseInt(endH), parseInt(endM) + 15, 0);

                if (now > slotEndTime) {
                    const durationMinutes = (record.last_seen_time - record.check_in_time) / (1000 * 60);

                    if (durationMinutes < 25) {
                        record.status = 'Absent';
                    } else {
                        // Check for lateness as well
                        const startTimeDate = new Date(`${recordDateStr}T${slot.start_time}:00`);
                        const arrivalDiffMinutes = (record.check_in_time - startTimeDate) / (1000 * 60);
                        const lateWindow = parseInt(process.env.TIME_WINDOW_MINUTES || 15);

                        record.status = arrivalDiffMinutes > lateWindow ? 'Late' : 'Present';
                    }
                    await record.save();
                    console.log(`[Cleanup] Finalized today's tracking for ${record.staff_id} as class in ${record.classroom_id} ended (Status: ${record.status})`);
                }
            } else {
                // Unscheduled tracking - finalize if not seen for 1 hour
                const minutesSinceLastSeen = (now - record.last_seen_time) / (1000 * 60);
                if (minutesSinceLastSeen > 60) {
                    const durationMinutes = (record.last_seen_time - record.check_in_time) / (1000 * 60);
                    record.status = durationMinutes < 25 ? 'Absent' : 'Present';
                    await record.save();
                    console.log(`[Cleanup] Finalized unscheduled tracking for ${record.staff_id} due to inactivity`);
                }
            }
        }
    } catch (err) {
        console.error('Error in Cleanup Cron:', err);
    }
});

// Job 4: Auto-expire stale leave requests
// Runs every day at midnight. If a leave is still 'pending' or 'approved_by_principal'
// but the end_date has already passed, mark it 'expired' so it disappears from queues.
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        const expiredLeaves = await Leave.find({
            status: { $in: ['pending', 'approved_by_principal'] },
            end_date: { $lt: now }
        }).populate('staff_id', 'name');

        if (expiredLeaves.length === 0) return;

        console.log(`[Leave Expiry] Found ${expiredLeaves.length} stale leave request(s) to expire.`);

        for (const leave of expiredLeaves) {
            leave.status = 'expired';
            leave.admin_notes = (leave.admin_notes ? leave.admin_notes + ' | ' : '') +
                'Auto-expired: Leave dates passed without full approval.';
            await leave.save();

            // Notify the staff member
            const user = await User.findOne({ staff_id: leave.staff_id._id });
            if (user) {
                const notifData = {
                    recipient_id: user._id,
                    title: 'Leave Request Expired',
                    message: `Your leave request for ${new Date(leave.start_date).toLocaleDateString()} - ${new Date(leave.end_date).toLocaleDateString()} was not fully approved before the dates passed and has been automatically closed.`,
                    type: 'leave_update'
                };
                await Notification.create(notifData);

                if (user.pushSubscription) {
                    await sendPushNotification(user.pushSubscription, {
                        title: notifData.title,
                        body: notifData.message,
                        icon: '/logo192.png',
                        data: { url: '/staff/my-leaves' }
                    });
                }
            }
            console.log(`[Leave Expiry] Expired leave for ${leave.staff_id?.name} (end: ${leave.end_date?.toISOString().split('T')[0]})`);
        }
    } catch (err) {
        console.error('Error in Leave Expiry Cron:', err);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
            }
        }
    }

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Local API:      http://localhost:${PORT}`);
    console.log(`🌐 Network API:    http://${localIp}:${PORT}`);
    console.log(`📂 React Frontend: http://localhost:5173`);
});