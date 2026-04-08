const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'principal', 'secretary', 'director'],
        required: true
    },
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: function () {
            return this.role === 'staff';
        }
    },
    name: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    pushSubscription: {
        type: Object,
        default: null
    },
    resetPasswordOTP: {
        type: String, // Stored as a string to preserve 6-digit leading zeros
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    profile_picture: {
        type: String,
        default: null
    },
    currentSessionId: {
        type: String,
        default: null
    },
    lastActivity: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        console.log(`🔐 Hashing password for user: ${this.email}`);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Index for efficient lookups during deletion and registration
userSchema.index({ staff_id: 1 });

module.exports = mongoose.model('User', userSchema);
