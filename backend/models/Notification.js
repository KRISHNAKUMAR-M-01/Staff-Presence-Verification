const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'alert',
            'leave_update',
            'leave_request',
            'timetable_change',
            'general',
            'late_arrival',
            'late_alert',
            'meeting_request',
            'substitution_alert',
            'upcoming_class',
            'upcoming_class_dept',
            'absence_warning'
        ],
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    related_data: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient_id: 1, is_read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
