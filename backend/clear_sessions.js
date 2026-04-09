require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await mongoose.connection.collection('users').updateMany({}, {
        "$set": { currentSessionId: null, lastActivity: null }
    });
    console.log('All sessions released!');
    process.exit(0);
});
