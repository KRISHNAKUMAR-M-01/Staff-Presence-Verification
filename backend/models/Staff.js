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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
