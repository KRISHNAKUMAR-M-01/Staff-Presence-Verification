const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
