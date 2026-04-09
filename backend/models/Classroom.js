const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Strict alphanumeric (blocking spaces as requested)
                return /^[A-Za-z0-9]+$/.test(v);
            },
            message: 'Room Name should only contain letters and numbers (no spaces or special characters)'
        }
    },
    esp32_id: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Alphanumeric and underscores only, no spaces
                return /^[A-Za-z0-9_]+$/.test(v);
            },
            message: 'Device ID should only contain letters, numbers, and underscores (no spaces)'
        }
    },
    room_uuid: {
        type: String,
        uppercase: true,
        trim: true,
        default: null   // Set this to match ROOM_UUID in the ESP32 firmware
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);
