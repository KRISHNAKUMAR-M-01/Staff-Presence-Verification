const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function resetAll() {
    try {
        await mongoose.connect('mongodb+srv://KrishnaKumar:krishnakumar123@project.hcyyfct.mongodb.net/?appName=Project');
        const result = await User.updateMany(
            {}, 
            { $set: { currentSessionId: null, lastActivity: null } }
        );
        console.log(`✅ Successfully reset ${result.modifiedCount} sessions in the database.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Global Reset failed:', err);
        process.exit(1);
    }
}

resetAll();
