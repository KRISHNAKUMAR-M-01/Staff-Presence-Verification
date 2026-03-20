const Staff = require('../models/Staff');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
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
        const requesterRole = req.user.role; 
        const requesterName = req.user.name;

        if (!['principal', 'secretary', 'director'].includes(requesterRole)) {
            return res.status(403).json({ message: 'Access denied. Only special members can make requests.' });
        }

        const targetStaff = await Staff.findById(staffId);
        if (!targetStaff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        const currentDay = getDayName();
        const currentTime = getCurrentTime();

        const activeClass = await Timetable.findOne({
            staff_id: staffId,
            day_of_week: currentDay,
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        }).populate('classroom_id');

        let freeStaff = null;

        if (activeClass) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            let attendance = await Attendance.findOne({
                staff_id: staffId,
                date: { $gte: startOfDay }
            });

            if (attendance) {
                attendance.status = 'Present'; 
                await attendance.save();
            } else {
                await Attendance.create({
                    staff_id: staffId,
                    classroom_id: activeClass.classroom_id._id,
                    status: 'Present',
                    date: new Date(),
                    check_in_time: new Date()
                });
            }

            const allStaff = await Staff.find({}, '_id name');
            const busyStaffTimetables = await Timetable.find({
                day_of_week: currentDay,
                start_time: { $lte: currentTime },
                end_time: { $gte: currentTime }
            }).distinct('staff_id');

            const availableStaff = allStaff.filter(s =>
                !busyStaffTimetables.some(bs => bs.toString() === s._id.toString()) &&
                s._id.toString() !== staffId
            );

            if (availableStaff.length > 0) {
                freeStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
                const freeStaffUser = await User.findOne({ staff_id: freeStaff._id });
                if (freeStaffUser) {
                    const subNotifData = {
                        recipient_id: freeStaffUser._id,
                        title: 'Class Substitution Request',
                        message: `Please cover ${activeClass.subject || 'class'} in ${activeClass.classroom_id.room_name} for ${targetStaff.name}. Requested by ${requesterRole} (${requesterName}).`,
                        type: 'meeting_request',
                        related_data: {
                            classroomId: activeClass.classroom_id._id,
                            originalStaffId: staffId,
                            requesterRole
                        }
                    };
                    await Notification.create(subNotifData);

                    if (freeStaffUser.pushSubscription) {
                        const { sendPushNotification } = require('../utils/pushService');
                        await sendPushNotification(freeStaffUser.pushSubscription, {
                            title: subNotifData.title,
                            body: subNotifData.message,
                            icon: '/logo192.png',
                            data: { url: '/staff/notifications' }
                        });
                    }

                    await sendEmail(
                        freeStaffUser.email,
                        'Class Substitution Request',
                        `Please cover ${activeClass.subject || 'class'} in ${activeClass.classroom_id.room_name} for ${targetStaff.name}. Requested by ${requesterRole} (${requesterName}).`
                    );
                }
            }
        }

        const targetUser = await User.findOne({ staff_id: staffId });
        if (targetUser) {
            let message = `${requesterRole} (${requesterName}) requests a meeting with you immediately.`;
            if (activeClass && freeStaff) {
                message += ` Your class in ${activeClass.classroom_id.room_name} will be covered by ${freeStaff.name}.`;
            } else if (activeClass && !freeStaff) {
                message += ` Note: No free staff available to cover your current class in ${activeClass.classroom_id.room_name}.`;
            }

            const targetNotifData = {
                recipient_id: targetUser._id,
                title: 'Urgent Meeting Request',
                message: message,
                type: 'meeting_request',
                related_data: { requesterRole }
            };
            await Notification.create(targetNotifData);

            if (targetUser.pushSubscription) {
                const { sendPushNotification } = require('../utils/pushService');
                await sendPushNotification(targetUser.pushSubscription, {
                    title: targetNotifData.title,
                    body: targetNotifData.message,
                    icon: '/logo192.png',
                    data: { url: '/staff/notifications' }
                });
            }

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

// Get All Staff Status (for Special roles dashboard) - OPTIMIZED
exports.getAllStaffStatus = async (req, res) => {
    try {
        const staffMembers = await Staff.find().lean();
        const currentDay = getDayName();
        const currentTime = getCurrentTime();
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // 1. Bulk Fetch all relevant data for today in just 3 queries
        const [allAttendance, allActiveClasses, allApprovedLeaves] = await Promise.all([
            Attendance.find({ date: { $gte: startOfToday, $lte: endOfToday } })
                .populate('classroom_id', 'room_name').lean(),
            Timetable.find({ 
                day_of_week: currentDay, 
                start_time: { $lte: currentTime }, 
                end_time: { $gte: currentTime } 
            }).populate('classroom_id', 'room_name').lean(),
            Leave.find({ 
                status: 'approved', 
                start_date: { $lte: endOfToday }, 
                end_date: { $gte: startOfToday } 
            }).lean()
        ]);

        // 2. Map data for O(1) lookup
        const attendanceMap = new Map();
        allAttendance.forEach(a => {
            const sid = (a.staff_id || '').toString();
            if (!sid) return;
            const existing = attendanceMap.get(sid);
            if (!existing || new Date(a.last_seen_time || a.check_in_time) > new Date(existing.last_seen_time || existing.check_in_time)) {
                attendanceMap.set(sid, a);
            }
        });

        const activeClassMap = new Map();
        allActiveClasses.forEach(c => activeClassMap.set((c.staff_id || '').toString(), c));

        const leaveMap = new Map();
        allApprovedLeaves.forEach(l => leaveMap.set((l.staff_id || '').toString(), l));

        const now = new Date();
        const signalThreshold = 5 * 60 * 1000; // 5 minutes

        // 3. Assemble status for all staff
        const staffStatus = staffMembers.map(staff => {
            const sid = staff._id.toString();
            const attendance = attendanceMap.get(sid);
            const activeClass = activeClassMap.get(sid);
            const approvedLeave = leaveMap.get(sid);

            const isStale = attendance && (now - new Date(attendance.last_seen_time || attendance.check_in_time) > signalThreshold);

            let liveStatus = 'Absent';
            if (approvedLeave) {
                liveStatus = 'On Leave';
            } else if (attendance && !isStale) {
                liveStatus = attendance.status; 
            } else if (attendance && isStale) {
                liveStatus = 'Left'; 
            }

            return {
                ...staff,
                currentStatus: liveStatus,
                lastSeen: attendance ? (attendance.last_seen_time || attendance.check_in_time) : null,
                currentLocation: (attendance && !isStale) ? attendance.classroom_id.room_name : 'Not detected',
                expectedLocation: activeClass ? activeClass.classroom_id.room_name : 'No Class Assigned',
                isCorrectLocation: activeClass && attendance && !isStale ?
                    (activeClass.classroom_id?._id?.toString() === attendance.classroom_id?._id?.toString()) :
                    (activeClass ? false : true),
                activeClass: activeClass ? {
                    subject: activeClass.subject,
                    room: activeClass.classroom_id?.room_name,
                    startTime: activeClass.start_time,
                    endTime: activeClass.end_time
                } : null
            };
        });

        res.status(200).json(staffStatus);

    } catch (error) {
        console.error('Error in getAllStaffStatus:', error);
        res.status(500).json({ message: 'Server error fetching staff status.' });
    }
};
