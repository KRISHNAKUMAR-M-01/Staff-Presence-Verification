const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    classroom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    check_in_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    last_seen_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['Present', 'Late', 'Absent', 'Tracking'],
        default: 'Tracking'
    },
    date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ staff_id: 1, classroom_id: 1, date: 1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
