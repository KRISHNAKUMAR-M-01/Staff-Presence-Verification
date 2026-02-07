require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
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

// Import Middleware
const { generateToken, authenticateToken, requireAdmin, requireStaff } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// ============================================
// AUTHENTICATION ENDPOINTS (Public)
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        // Normalize email
        if (email) email = email.trim().toLowerCase();

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

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('staff_id');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ADMIN ENDPOINTS (Protected)
// ============================================

// Register new user (Admin only)
app.post('/api/admin/register-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, password, role, staff_id, name } = req.body;

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
        const { name, beacon_uuid, department } = req.body;
        const staff = new Staff({ name, beacon_uuid, department });
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
        const { name, beacon_uuid, department } = req.body;
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { name, beacon_uuid, department },
            { new: true }
        );
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
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
            end_time: t.end_time
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/timetable', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { staff_id, classroom_id, day_of_week, start_time, end_time } = req.body;
        const timetable = new Timetable({ staff_id, classroom_id, day_of_week, start_time, end_time });
        await timetable.save();

        // Notify staff about timetable change
        const user = await User.findOne({ staff_id });
        if (user) {
            await Notification.create({
                recipient_id: user._id,
                title: 'Timetable Updated',
                message: `New class scheduled on ${day_of_week} from ${start_time} to ${end_time}`,
                type: 'timetable_change'
            });
        }

        res.json({ id: timetable._id });
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

        // Get today's attendance records
        const attendance = await Attendance.find({ date: todayDate })
            .populate('staff_id', 'name department')
            .populate('classroom_id', 'room_name')
            .sort({ check_in_time: -1 });

        // Get current timetable
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        const currentSchedule = await Timetable.find({
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        })
            .populate('staff_id', 'name department')
            .populate('classroom_id', 'room_name');

        // Combine data
        const staffLocations = currentSchedule.map(schedule => {
            const attendanceRecord = attendance.find(
                a => a.staff_id._id.toString() === schedule.staff_id._id.toString() &&
                    a.classroom_id._id.toString() === schedule.classroom_id._id.toString()
            );

            return {
                staff_id: schedule.staff_id._id,
                staff_name: schedule.staff_id.name,
                department: schedule.staff_id.department,
                expected_location: schedule.classroom_id.room_name,
                actual_location: attendanceRecord ? schedule.classroom_id.room_name : 'Not checked in',
                status: attendanceRecord ? attendanceRecord.status : 'Absent',
                check_in_time: attendanceRecord ? attendanceRecord.check_in_time : null,
                is_correct_location: !!attendanceRecord
            };
        });

        res.json(staffLocations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Attendance Reports (Admin only)
app.get('/api/admin/attendance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate('staff_id', 'name')
            .populate('classroom_id', 'room_name')
            .sort({ check_in_time: -1 });

        const formatted = attendance.map(a => ({
            id: a._id,
            staff_id: a.staff_id._id,
            classroom_id: a.classroom_id._id,
            staff_name: a.staff_id.name,
            room_name: a.classroom_id.room_name,
            check_in_time: a.check_in_time,
            status: a.status,
            date: a.date
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alerts (Admin only)
app.get('/api/admin/alerts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate('staff_id', 'name')
            .populate('classroom_id', 'room_name')
            .sort({ timestamp: -1 });

        const formatted = alerts.map(al => ({
            id: al._id,
            staff_id: al.staff_id._id,
            classroom_id: al.classroom_id._id,
            staff_name: al.staff_id.name,
            room_name: al.classroom_id.room_name,
            message: al.message,
            timestamp: al.timestamp
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats (Admin only)
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);

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
            }),
            pendingLeaves: await Leave.countDocuments({ status: 'pending' })
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leave Management (Admin)
app.get('/api/admin/leaves', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('staff_id', 'name department')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/leaves/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, admin_notes } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, admin_notes, approved_by: req.user._id },
            { new: true }
        ).populate('staff_id', 'name');

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        // Notify staff
        const user = await User.findOne({ staff_id: leave.staff_id._id });
        if (user) {
            await Notification.create({
                recipient_id: user._id,
                title: 'Leave Request ' + status.charAt(0).toUpperCase() + status.slice(1),
                message: `Your leave request from ${leave.start_date.toDateString()} has been ${status}`,
                type: 'leave_update'
            });
        }

        res.json(leave);
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
        res.json(timetable);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit leave request
app.post('/api/staff/leave', authenticateToken, requireStaff, async (req, res) => {
    try {
        const { start_date, end_date, reason, leave_type } = req.body;
        const leave = new Leave({
            staff_id: req.user.staff_id,
            start_date,
            end_date,
            reason,
            leave_type
        });
        await leave.save();

        // Notify all admins
        const admins = await User.find({ role: 'admin' });
        const staff = await Staff.findById(req.user.staff_id);

        for (const admin of admins) {
            await Notification.create({
                recipient_id: admin._id,
                title: 'New Leave Request',
                message: `${staff.name} has submitted a leave request for ${new Date(start_date).toLocaleDateString()}`,
                type: 'leave_request'
            });
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

// Get staff notifications
app.get('/api/staff/notifications', authenticateToken, requireStaff, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient_id: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
app.put('/api/staff/notifications/:id/read', authenticateToken, requireStaff, async (req, res) => {
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

// Get unread notification count
app.get('/api/staff/notifications/unread-count', authenticateToken, requireStaff, async (req, res) => {
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
// BLE DATA ENDPOINT (Public - from ESP32)
// ============================================

app.post('/api/ble-data', async (req, res) => {
    try {
        const { esp32_id, beacon_uuid, rssi } = req.body;
        console.log(`Received BLE scan: ESP32=${esp32_id}, UUID=${beacon_uuid}, RSSI=${rssi}`);

        const rssiThreshold = parseInt(process.env.RSSI_THRESHOLD || -75);

        if (rssi < rssiThreshold) {
            return res.json({ status: 'ignored', message: 'RSSI below threshold' });
        }

        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
        const todayStr = now.toISOString().split('T')[0];

        // Find staff by UUID
        const staff = await Staff.findOne({ beacon_uuid: beacon_uuid.toUpperCase() });
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Find classroom by ESP32 ID
        const classroom = await Classroom.findOne({ esp32_id: esp32_id.toUpperCase() });
        if (!classroom) {
            return res.status(404).json({ error: 'Classroom not found' });
        }

        // Check timetable
        const slot = await Timetable.findOne({
            staff_id: staff._id,
            classroom_id: classroom._id,
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });

        if (!slot) {
            return res.json({
                status: 'ignored',
                message: 'No scheduled class for this staff in this room at this time'
            });
        }

        // Check if already marked
        const existing = await Attendance.findOne({
            staff_id: staff._id,
            classroom_id: classroom._id,
            date: new Date(todayStr)
        });

        if (existing) {
            return res.json({ status: 'already_marked', message: 'Attendance already recorded' });
        }

        // Determine status
        const startTime = slot.start_time;
        const startTimeDate = new Date(`${todayStr}T${startTime}:00`);
        const diffMinutes = (now - startTimeDate) / (1000 * 60);

        let status = 'Present';
        if (diffMinutes > parseInt(process.env.TIME_WINDOW_MINUTES || 15)) {
            status = 'Late';
        }

        // Record attendance
        const attendance = new Attendance({
            staff_id: staff._id,
            classroom_id: classroom._id,
            check_in_time: now,
            status: status,
            date: new Date(todayStr)
        });
        await attendance.save();

        // Generate alert and notification if late
        if (status === 'Late') {
            const alert = new Alert({
                staff_id: staff._id,
                classroom_id: classroom._id,
                message: `${staff.name} marked Late at ${currentTime} (${Math.round(diffMinutes)} minutes late)`
            });
            await alert.save();

            // Notify staff
            const user = await User.findOne({ staff_id: staff._id });
            if (user) {
                await Notification.create({
                    recipient_id: user._id,
                    title: 'Late Arrival Alert',
                    message: `You were marked late for your class at ${classroom.room_name}`,
                    type: 'late_arrival'
                });
            }
        }

        res.json({ status: 'success', attendance_status: status });
    } catch (err) {
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

app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);

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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Backend API: http://localhost:${PORT}`);
    console.log(`📂 React Frontend: http://localhost:5173`);
});
