const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 15,
        validate: {
            validator: function (v) {
                // Not starting with a number and alphanumeric only
                return /^[A-Za-z_][A-Za-z0-9_]*$/.test(v);
            },
            message: 'Room Name must not exceed 15 characters, must not start with a number, and can only contain alphanumeric characters or underscores.'
        }
    },
    esp32_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 15,
        validate: {
            validator: function (v) {
                // Not starting with a number and alphanumeric/underscore only
                return /^[A-Za-z_][A-Za-z0-9_]*$/.test(v);
            },
            message: 'Device ID must not exceed 15 characters, must not start with a number, and can only contain alphanumeric characters or underscores.'
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
