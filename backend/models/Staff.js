const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Must contain at least one letter and only [A-Za-z_]
                return /^(?=.*[A-Za-z])[A-Za-z_]+$/.test(v);
            },
            message: 'Name must contain at least one letter and can only include underscores (no spaces)'
        }
    },
    beacon_uuid: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Must be exactly 32 hex characters
                return /^[0-9A-Fa-f]{32}$/.test(v);
            },
            message: 'Beacon UUID must be exactly 32 hexadecimal characters'
        }
    },
    department: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: 'Department should only contain letters and spaces'
        }
    },
    is_hod: {
        type: Boolean,
        default: false
    },
    profile_picture: {
        type: String,
        default: null
    },
    phone_number: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // Indian format: Optional +91 followed by 10 digits starting with 6, 7, 8, or 9
                return !v || /^(?:\+91[\-\s]?)?[6789]\d{9}$/.test(v);
            },
            message: 'Invalid Indian phone number. Please use 10 digits starting with 6-9 (optionally with +91).'
        }
    },
    // Live Location Tracking (updated by every BLE scan, regardless of class schedule)
    last_seen_room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        default: null
    },
    last_seen_time: {
        type: Date,
        default: null
    },
    last_seen_rssi: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// Export model
module.exports = mongoose.model('Staff', staffSchema);
