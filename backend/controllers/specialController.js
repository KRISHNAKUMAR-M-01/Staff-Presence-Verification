const Staff = require('../models/Staff');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Helper to get current day name
const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
};

// Helper to get current time in HH:MM format
const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Send Meeting Request
exports.sendMeetingRequest = async (req, res) => {
    try {
        const { staffId } = req.body;
        const requesterRole = req.user.role; // Assuming req.user is populated by auth middleware
        const requesterName = req.user.name;

        // Verify requester is a special role
        if (!['principal', 'secretary', 'director'].includes(requesterRole)) {
            return res.status(403).json({ message: 'Access denied. Only special members can make requests.' });
        }

        const targetStaff = await Staff.findById(staffId);
        if (!targetStaff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        const currentDay = getDayName();
        const currentTime = getCurrentTime();

        // 1. Check if Target Staff has a class currently
        const activeClass = await Timetable.findOne({
            staff_id: staffId,
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        }).populate('classroom_id');

        let freeStaff = null;

        // 2. If Target Staff has a class, handle substitution
        if (activeClass) {
            // Mark Target Staff as Present (override if needed)
            // Check if attendance already exists for today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            let attendance = await Attendance.findOne({
                staff_id: staffId,
                date: { $gte: startOfDay }
            });

            if (attendance) {
                attendance.status = 'Present'; // Ensure they are marked present
                await attendance.save();
            } else {
                // Create new attendance record if none exists
                await Attendance.create({
                    staff_id: staffId,
                    classroom_id: activeClass.classroom_id._id, // Assign to current class room initially
                    status: 'Present',
                    date: new Date(),
                    check_in_time: new Date()
                });
            }

            // Find a Free Staff member to cover the class
            // Get all staff IDs first
            const allStaff = await Staff.find({}, '_id name');

            // Find all staff who are BUSY at this time
            const busyStaffTimetables = await Timetable.find({
                day_of_week: currentDay,
                start_time: { $lte: currentTime },
                end_time: { $gte: currentTime }
            }).distinct('staff_id');

            // Filter out busy staff and the target staff
            const availableStaff = allStaff.filter(s =>
                !busyStaffTimetables.some(bs => bs.toString() === s._id.toString()) &&
                s._id.toString() !== staffId
            );

            if (availableStaff.length > 0) {
                // Pick a random free staff or first available
                freeStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];

                // Notify Free Staff
                // Find User associated with Free Staff to send notification
                const freeStaffUser = await User.findOne({ staff_id: freeStaff._id });
                if (freeStaffUser) {
                    await Notification.create({
                        recipient_id: freeStaffUser._id,
                        title: 'Class Substitution Request',
                        message: `Please cover ${activeClass.subject || 'class'} in ${activeClass.classroom_id.room_name} for ${targetStaff.name}. Requested by ${requesterRole} (${requesterName}).`,
                        type: 'meeting_request',
                        related_data: {
                            classroomId: activeClass.classroom_id._id,
                            originalStaffId: staffId,
                            requesterRole
                        }
                    });

                    // Send Email to Free Staff
                    await sendEmail(
                        freeStaffUser.email,
                        'Class Substitution Request',
                        `Please cover ${activeClass.subject || 'class'} in ${activeClass.classroom_id.room_name} for ${targetStaff.name}. Requested by ${requesterRole} (${requesterName}).`
                    );
                }
            }
        }

        // 3. Notify Target Staff
        const targetUser = await User.findOne({ staff_id: staffId });
        if (targetUser) {
            let message = `${requesterRole} (${requesterName}) requests a meeting with you immediately.`;
            if (activeClass && freeStaff) {
                message += ` Your class in ${activeClass.classroom_id.room_name} will be covered by ${freeStaff.name}.`;
            } else if (activeClass && !freeStaff) {
                message += ` Note: No free staff available to cover your current class in ${activeClass.classroom_id.room_name}.`;
            }

            await Notification.create({
                recipient_id: targetUser._id,
                title: 'Urgent Meeting Request',
                message: message,
                type: 'meeting_request',
                related_data: { requesterRole }
            });

            // Send Email to Target Staff
            await sendEmail(targetUser.email, 'Urgent Meeting Request', message);
        }

        res.status(200).json({
            message: 'Meeting request sent successfully.',
            coveredBy: freeStaff ? freeStaff.name : null
        });

    } catch (error) {
        console.error('Error in sendMeetingRequest:', error);
        res.status(500).json({ message: 'Server error processing meeting request.' });
    }
};

// Get All Staff Status (for Special roles dashboard)
exports.getAllStaffStatus = async (req, res) => {
    try {
        // This endpoint aggregates staff, their current location/status, and active class info
        // Simple implementation: Fetches all staff and latest attendance/timetable info

        const staffMembers = await Staff.find().lean();
        const currentDay = getDayName();
        const currentTime = getCurrentTime();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const statusPromises = staffMembers.map(async (staff) => {
            // Get today's attendance - joined with classroom info
            const attendance = await Attendance.findOne({
                staff_id: staff._id,
                date: { $gte: startOfDay }
            })
                .populate('classroom_id', 'room_name')
                .sort({ last_seen_time: -1 });

            // Get current active class if any
            const activeClass = await Timetable.findOne({
                staff_id: staff._id,
                day_of_week: currentDay,
                start_time: { $lte: currentTime },
                end_time: { $gte: currentTime }
            }).populate('classroom_id', 'room_name');

            const now = new Date();
            const signalThreshold = 5 * 60 * 1000; // 5 minutes
            const isStale = attendance && (now - new Date(attendance.last_seen_time || attendance.check_in_time) > signalThreshold);

            // Determine specific live status
            let liveStatus = 'Absent';
            if (attendance && !isStale) {
                liveStatus = attendance.status; // Present, Late, etc.
            } else if (attendance && isStale) {
                liveStatus = 'Left'; // Was here, but signal lost/left
            }

            return {
                ...staff,
                currentStatus: liveStatus,
                lastSeen: attendance ? (attendance.last_seen_time || attendance.check_in_time) : null,
                currentLocation: (attendance && !isStale) ? attendance.classroom_id.room_name : 'Not detected',
                expectedLocation: activeClass ? activeClass.classroom_id.room_name : 'No Class Assigned',
                isCorrectLocation: activeClass && attendance && !isStale ?
                    (activeClass.classroom_id._id.toString() === attendance.classroom_id._id.toString()) :
                    (activeClass ? false : true),
                activeClass: activeClass ? {
                    subject: activeClass.subject,
                    room: activeClass.classroom_id.room_name,
                    startTime: activeClass.start_time,
                    endTime: activeClass.end_time
                } : null
            };
        });

        const staffStatus = await Promise.all(statusPromises);
        res.status(200).json(staffStatus);

    } catch (error) {
        console.error('Error in getAllStaffStatus:', error);
        res.status(500).json({ message: 'Server error fetching staff status.' });
    }
};
