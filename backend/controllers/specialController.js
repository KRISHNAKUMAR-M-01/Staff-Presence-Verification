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
        const staffMembers = await Staff.find().populate('last_seen_room', 'room_name').lean();
        const currentDay = getDayName();
        const currentTime = getCurrentTime();
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // 1. Bulk Fetch all relevant data in just mapping queries
        // - Fetch only TODAY's attendance for live tracking
        // - Fetch EVERY staff's latest attendance overall for "Last Seen" data
        const [allAttendanceToday, allActiveClasses, allApprovedLeaves, allLatestAttendance] = await Promise.all([
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
            }).lean(),
            // Get most recent attendance record for each staff member overall
            Attendance.aggregate([
                { $sort: { check_in_time: -1 } },
                { $group: {
                    _id: '$staff_id',
                    latest_record: { $first: '$$ROOT' }
                }},
                { $lookup: {
                    from: 'classrooms',
                    localField: 'latest_record.classroom_id',
                    foreignField: '_id',
                    as: 'room'
                }},
                { $unwind: { path: '$room', preserveNullAndEmptyArrays: true } }
            ])
        ]);

        // 2. Map data for O(1) lookup
        const attendanceTodayMap = new Map();
        allAttendanceToday.forEach(a => {
            const sid = (a.staff_id || '').toString();
            if (!sid) return;
            const existing = attendanceTodayMap.get(sid);
            if (!existing || new Date(a.last_seen_time || a.check_in_time) > new Date(existing.last_seen_time || existing.check_in_time)) {
                attendanceTodayMap.set(sid, a);
            }
        });

        const latestAttendanceMap = new Map();
        allLatestAttendance.forEach(a => {
            if (a._id) latestAttendanceMap.set(a._id.toString(), a);
        });

        const activeClassMap = new Map();
        allActiveClasses.forEach(c => activeClassMap.set((c.staff_id || '').toString(), c));

        const leaveMap = new Map();
        allApprovedLeaves.forEach(l => leaveMap.set((l.staff_id || '').toString(), l));

        const now = new Date();
        const signalThreshold = 90 * 1000; // 90 seconds — matches Admin Dashboard for responsiveness

        // 3. Assemble status for all staff
        const staffStatus = staffMembers.map(staff => {
            const sid = staff._id.toString();
            const attendanceToday = attendanceTodayMap.get(sid);
            const latestHistory = latestAttendanceMap.get(sid);
            const activeClass = activeClassMap.get(sid);
            const approvedLeave = leaveMap.get(sid);

            const isLive = staff.last_seen_time && (now - new Date(staff.last_seen_time) < signalThreshold);
            const attendanceStale = attendanceToday && (now - new Date(attendanceToday.last_seen_time || attendanceToday.check_in_time) > signalThreshold);

            let liveStatus = 'Scanning';
            if (approvedLeave) {
                liveStatus = 'On Leave';
            } else if (isLive) {
                if (attendanceToday && !attendanceStale && ['Present', 'Late'].includes(attendanceToday.status)) {
                    liveStatus = attendanceToday.status;
                } else {
                    liveStatus = 'Tracking';
                }
            } else if (activeClass) {
                liveStatus = 'Absent';
            }

            const latestRec = latestHistory?.latest_record;
            const lastSeenTime = staff.last_seen_time || (latestRec ? (latestRec.last_seen_time || latestRec.check_in_time) : null);
            
            // Populating lastSeenRoom manually since we already have it in the staff object or latestHistory
            const lastSeenRoomName = (isLive && staff.last_seen_room) ? 
                (staff.last_seen_room.room_name || 'Classroom') : 
                (latestHistory?.room?.room_name || 'unknown');

            return {
                ...staff,
                currentStatus: liveStatus,
                lastSeen: lastSeenTime,
                lastSeenLocation: lastSeenRoomName,
                currentLocation: isLive ? 
                                 (staff.last_seen_room?.room_name || 'Classroom') : 
                                 'Not in Range',
                expectedLocation: activeClass ? (activeClass.classroom_id?.room_name || 'Unknown Room') : 'No Class Assigned',
                isCorrectLocation: activeClass && isLive ?
                    (activeClass.classroom_id?._id?.toString() === staff.last_seen_room?._id?.toString()) :
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
