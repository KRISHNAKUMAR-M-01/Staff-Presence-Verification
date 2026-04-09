const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) throw new Error('MONGODB_URI not defined in environment');

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000, // Wait up to 30 seconds for server selection
            socketTimeoutMS: 45000,          // Close sockets after 45 seconds of inactivity
            family: 4                        // Resolve IPv4 addresses only
        });

        console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

module.exports = connectDB;
