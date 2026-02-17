require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
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

// Import Services
const { sendEmail } = require('./utils/emailService');

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

        // Normalize email and validate
        if (email) {
            email = email.trim().toLowerCase();
            if (/^\d/.test(email)) {
                return res.status(400).json({ error: 'Email address should not start with a number' });
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

// Import Routes
const specialRoutes = require('./routes/specialRoutes');

// ============================================
// EXECUTIVE ENDPOINTS (Protected)
// ============================================
app.use('/api/executive', specialRoutes);

// ============================================
// ADMIN ENDPOINTS (Protected)
// ============================================


// Register new user (Admin only)
app.post('/api/admin/register-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, password, role, staff_id, name } = req.body;

        // Validation: email should not start with a number
        if (email && /^\d/.test(email.trim())) {
            return res.status(400).json({ error: 'Email address should not start with a number' });
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
        const { name, beacon_uuid, department, is_hod, phone_number } = req.body;
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { name, beacon_uuid, department, is_hod, phone_number },
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

// Bulk Insert Timetable (Admin only)
app.post('/api/admin/timetable/bulk', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { classroom_id, schedule } = req.body;

        // Validation
        if (!classroom_id || !schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ error: 'Missing classroom_id or schedule array' });
        }

        // Optional: Clear existing timetable for this classroom first?
        // This is usually safer to avoid duplicates when re-uploading the same sheet.
        await Timetable.deleteMany({ classroom_id: classroom_id });

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

        res.json({ message: `Successfully imported ${insertedDocs.length} timetable entries`, count: insertedDocs.length });
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
            .populate('staff_id', 'name')
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

        const formatted = attendance.map(a => ({
            id: a._id,
            staff_id: a.staff_id._id,
            classroom_id: a.classroom_id?._id,
            staff_name: a.staff_id.name,
            room_name: a.classroom_id?.room_name || 'N/A',
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
        const { startDate, endDate, staffName } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        let alerts = await Alert.find(query)
            .populate('staff_id', 'name')
            .populate('classroom_id', 'room_name')
            .sort({ timestamp: -1 });

        if (staffName) {
            const search = staffName.toLowerCase();
            alerts = alerts.filter(al =>
                al.staff_id.name.toLowerCase().includes(search)
            );
        }

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
            .populate('staff_id', 'name department')
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

        // Handle substitution alerts if approved
        if (status === 'approved') {
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

                            await Notification.create({
                                recipient_id: sUser._id,
                                title: 'Substitution Opportunity',
                                message: substitutionMsg,
                                type: 'substitution_alert'
                            });

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
// BLE DATA ENDPOINT (Public - from ESP32)
// ============================================

app.post('/api/ble-data', async (req, res) => {
    try {
        const { esp32_id, beacon_uuid, rssi } = req.body;
        // console.log(`Received BLE scan: ESP32=${esp32_id}, UUID=${beacon_uuid}, RSSI=${rssi}`);

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
            console.log(`[BLE Error] Staff not found for UUID: "${beacon_uuid.toUpperCase()}"`);
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Find classroom by ESP32 ID
        const classroom = await Classroom.findOne({ esp32_id: esp32_id.toUpperCase() });
        if (!classroom) {
            console.log(`[BLE Error] Classroom not found for ESP32 ID: "${esp32_id.toUpperCase()}"`);
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
            // Check if there is an existing ACTIVE tracking session for today
            // If they are checking out or updating an ongoing session that just ended
            const existingTracking = await Attendance.findOne({
                staff_id: staff._id,
                classroom_id: classroom._id,
                status: 'Tracking',
                date: new Date(todayStr)
            });

            if (!existingTracking) {
                return res.json({
                    status: 'ignored',
                    message: 'No scheduled class for this staff in this room at this time'
                });
            }
            // If existing tracking session found, we allow loop to continue to update it
        }

        // Check for existing attendance record
        let attendance = await Attendance.findOne({
            staff_id: staff._id,
            classroom_id: classroom._id,
            date: new Date(todayStr)
        });

        if (attendance) {
            // Update last_seen_time
            attendance.last_seen_time = now;
            await attendance.save();

            // Calculate duration in minutes
            const durationMs = attendance.last_seen_time - attendance.check_in_time;
            const durationMinutes = durationMs / (1000 * 60);

            // If duration >= 30 mins and status is still 'Tracking', mark as Present/Late
            if (durationMinutes >= 30 && attendance.status === 'Tracking') {
                let newStatus = 'Present';

                // Only check for LATE if we have the slot info (i.e. we are still within class time)
                // If class time is over (slot is null), we just count them as Present if they met 30m duration.
                if (slot) {
                    const startTime = slot.start_time;
                    const startTimeDate = new Date(`${todayStr}T${startTime}:00`);
                    const arrivalDiffMinutes = (attendance.check_in_time - startTimeDate) / (1000 * 60);

                    if (arrivalDiffMinutes > parseInt(process.env.TIME_WINDOW_MINUTES || 15)) {
                        newStatus = 'Late';
                    }
                } else {
                    // Fallback: If no slot (after class), rely on existing status logic or simple Present
                    // If they were already tracking, they were "checked in".
                    // We can refine this by fetching the original timetable slot from the DB using attendance.classroom_id/staff_id if absolutely needed,
                    // but for now, if they stayed 30 mins, they are Present.
                }

                attendance.status = newStatus;
                await attendance.save();

                // If late, send alert (only sent once when status changes from Tracking -> Late)
                if (newStatus === 'Late') {
                    const alertMessage = `${staff.name} marked Late for class in ${classroom.room_name} (verified after 30m duration)`;
                    const alert = new Alert({
                        staff_id: staff._id,
                        classroom_id: classroom._id,
                        message: alertMessage
                    });
                    await alert.save();

                    // 1. Send Email to Staff
                    const staffEmail = staffUser?.email;
                    if (staffEmail) {
                        await sendEmail(staffEmail, 'Attendance Alert: Late', `You have been marked LATE for your class in ${classroom.room_name}.`);
                    }

                    // In-app notification for Staff
                    const staffUser = await User.findOne({ staff_id: staff._id });
                    if (staffUser) {
                        await Notification.create({
                            recipient_id: staffUser._id,
                            title: 'Attendance Alert',
                            message: `You have been marked LATE for your class in ${classroom.room_name}.`,
                            type: 'late_alert'
                        });
                    }

                    // 2. Notify HOD(s)
                    const hods = await Staff.find({ department: staff.department, is_hod: true });
                    for (const hod of hods) {
                        // In-app notification for HOD
                        const hodUser = await User.findOne({ staff_id: hod._id });
                        if (hodUser) {
                            // Send Email to HOD
                            await sendEmail(hodUser.email, 'Department Lateness Alert', `HOD Alert: ${staff.name} has been marked LATE for class in ${classroom.room_name}.`);
                            await Notification.create({
                                recipient_id: hodUser._id,
                                title: 'Dept. Lateness Alert',
                                message: alertMessage,
                                type: 'late_alert'
                            });
                        }
                    }
                }

                return res.json({ status: 'updated', message: 'Attendance confirmed (30m duration reached)', attendance_status: newStatus });
            }

            return res.json({ status: 'updated', message: `Attendance tracking. Duration: ${Math.round(durationMinutes)}m`, attendance_status: attendance.status });
        } else {
            // Create new attendance record with 'Tracking' status
            attendance = new Attendance({
                staff_id: staff._id,
                classroom_id: classroom._id,
                check_in_time: now,
                last_seen_time: now,
                status: 'Tracking',
                date: new Date(todayStr)
            });
            await attendance.save();
            return res.json({ status: 'started', message: 'Attendance tracking started', attendance_status: 'Tracking' });
        }
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

// ============================================
// CRON JOBS
// ============================================

// Job 1: Notify staff 5 minutes before class
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const notificationTime = new Date(now.getTime() + 5 * 60000); // 5 mins from now
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[notificationTime.getDay()];
        const targetTime = notificationTime.toTimeString().substring(0, 5);

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
                    await Notification.create({
                        recipient_id: user._id,
                        title: 'Upcoming Class',
                        message: `You have a class in ${cls.classroom_id.room_name} starting in 5 minutes at ${cls.start_time}.`,
                        type: 'upcoming_class'
                    });

                    // 1. Send Email to Staff
                    await sendEmail(
                        user.email,
                        'Upcoming Class Reminder',
                        `Reminder: You have a class in ${cls.classroom_id.room_name} starting in 5 minutes.`
                    );

                    // 2. Notify HOD(s) 
                    const hods = await Staff.find({ department: cls.staff_id.department, is_hod: true });
                    for (const hod of hods) {
                        // Dashboard notification for HOD
                        const hodUser = await User.findOne({ staff_id: hod._id });
                        if (hodUser) {
                            // Send Email to HOD
                            await sendEmail(hodUser.email, 'Upcoming Class Warning (Dept)', `HOD Alert: ${cls.staff_id.name} has a class starting in 5 minutes in ${cls.classroom_id.room_name}.`);
                            await Notification.create({
                                recipient_id: hodUser._id,
                                title: 'Upcoming Class (Dept)',
                                message: `${cls.staff_id.name} has a class in ${cls.classroom_id.room_name} starting in 5 minutes.`,
                                type: 'upcoming_class_dept'
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
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    await Notification.create({
                        recipient_id: admin._id,
                        title: 'Staff Absence Warning',
                        message: alertMessage,
                        type: 'absence_warning'
                    });
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
                        await Notification.create({
                            recipient_id: hodUser._id,
                            title: 'Dept. Absence Warning',
                            message: alertMessage,
                            type: 'absence_warning'
                        });
                    }
                }

                // 4. Notify the Staff member themselves
                const user = await User.findOne({ staff_id: cls.staff_id._id });
                if (user) {
                    await Notification.create({
                        recipient_id: user._id,
                        title: 'Absence Warning',
                        message: `You have not been detected for your class in ${cls.classroom_id.room_name} at ${cls.start_time}.`,
                        type: 'absence_warning'
                    });

                    // Send Email to Staff
                    await sendEmail(user.email, 'Absence Warning', `Absence Alert: You were not detected in ${cls.classroom_id.room_name} for your ${cls.start_time} class.`);
                }
            }
        }
    } catch (err) {
        console.error('Error in 15-min absence warning cron:', err);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Backend API: http://localhost:${PORT}`);
    console.log(`📂 React Frontend: http://localhost:5173`);
});
