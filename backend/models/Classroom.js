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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);
