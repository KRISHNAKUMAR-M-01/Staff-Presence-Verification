const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        required: true,
        trim: true
    },
    esp32_id: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
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
