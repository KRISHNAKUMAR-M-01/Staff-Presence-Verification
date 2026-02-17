const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
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
    day_of_week: {
        type: String,
        required: true,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    start_time: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/  // HH:MM format
    },
    end_time: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/  // HH:MM format
    },
    subject: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
timetableSchema.index({ staff_id: 1, classroom_id: 1, day_of_week: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
