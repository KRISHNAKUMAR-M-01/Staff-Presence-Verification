const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function reset() {
    try {
        await mongoose.connect('mongodb+srv://KrishnaKumar:krishnakumar123@project.hcyyfct.mongodb.net/?appName=Project');
        await User.updateOne(
            { email: 'kriskanna17@gmail.com' }, 
            { $set: { currentSessionId: null, lastActivity: null } }
        );
        console.log('✅ Session cleared for kriskanna17@gmail.com');
        process.exit(0);
    } catch (err) {
        console.error('❌ Reset failed:', err);
        process.exit(1);
    }
}

reset();
