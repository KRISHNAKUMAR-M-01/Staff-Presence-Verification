const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
    requesting_staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    classroom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    admin_response: String,
    substitute_staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
