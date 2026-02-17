const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: 'Name should only contain letters and spaces'
        }
    },
    beacon_uuid: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
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
    phone_number: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^\+?[\d\s-]{10,}$/.test(v);
            },
            message: 'Invalid phone number format'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
