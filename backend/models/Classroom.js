const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Must start with a letter, then alphanumeric
                return /^[A-Za-z][A-Za-z0-9]*$/.test(v);
            },
            message: 'Room Name must start with a letter and contain no spaces'
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
                // Must start with a letter, then alphanumeric/underscores
                return /^[A-Za-z][A-Za-z0-9_]*$/.test(v);
            },
            message: 'Device ID must start with a letter'
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
