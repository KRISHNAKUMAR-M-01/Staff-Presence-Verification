require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Import Models
const Staff = require('./models/Staff');
const Classroom = require('./models/Classroom');
const Timetable = require('./models/Timetable');
const Attendance = require('./models/Attendance');
const Alert = require('./models/Alert');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await Staff.deleteMany({});
        await Classroom.deleteMany({});
        await Timetable.deleteMany({});
        await Attendance.deleteMany({});
        await Alert.deleteMany({});
        await User.deleteMany({});
        await Leave.deleteMany({});
        await Notification.deleteMany({});

        console.log('✅ Cleared existing data');

        // Add Staff
        const staff1 = await Staff.create({
            name: 'Dr. Alice Smith',
            beacon_uuid: 'AA:BB:CC:DD:EE:01',
            department: 'Computer Science'
        });

        const staff2 = await Staff.create({
            name: 'Prof. Bob Jones',
            beacon_uuid: 'AA:BB:CC:DD:EE:02',
            department: 'Electronics'
        });

        console.log('✅ Added staff members');

        // Add Classrooms
        const classroom1 = await Classroom.create({
            room_name: 'Room 101',
            esp32_id: 'ESP32_01'
        });

        const classroom2 = await Classroom.create({
            room_name: 'Lab 204',
            esp32_id: 'ESP32_02'
        });

        console.log('✅ Added classrooms');

        // Add Sample Timetable
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        await Timetable.create({
            staff_id: staff1._id,
            classroom_id: classroom1._id,
            day_of_week: today,
            start_time: '08:00',
            end_time: '18:00'
        });

        await Timetable.create({
            staff_id: staff2._id,
            classroom_id: classroom2._id,
            day_of_week: today,
            start_time: '08:00',
            end_time: '18:00'
        });

        console.log('✅ Added timetable entries');

        // Create Admin User
        console.log('⏳ Creating admin user...');
        let adminUser;
        try {
            adminUser = await User.create({
                email: 'admin@school.com',
                password: 'admin123',
                role: 'admin',
                name: 'System Administrator'
            });
            console.log('✅ Created admin user');
            console.log('   📧 Email: admin@school.com');
            console.log('   🔑 Password: admin123');
        } catch (adminErr) {
            console.error('❌ Error creating admin user:', adminErr.message);
            if (adminErr.errors) {
                Object.keys(adminErr.errors).forEach(key => {
                    console.error(`   - ${key}: ${adminErr.errors[key].message}`);
                });
            }
            throw adminErr;
        }

        // Create Staff Users
        const staffUser1 = await User.create({
            email: 'alice@school.com',
            password: 'staff123',
            role: 'staff',
            staff_id: staff1._id,
            name: 'Dr. Alice Smith'
        });

        const staffUser2 = await User.create({
            email: 'bob@school.com',
            password: 'staff123',
            role: 'staff',
            staff_id: staff2._id,
            name: 'Prof. Bob Jones'
        });

        console.log('✅ Created staff users');
        console.log('   📧 Email: alice@school.com / Password: staff123');
        console.log('   📧 Email: bob@school.com / Password: staff123');

        // Create sample notifications
        await Notification.create({
            recipient_id: staffUser1._id,
            title: 'Welcome to the System',
            message: 'Your account has been created successfully. You can now track your attendance and manage leaves.',
            type: 'general'
        });

        await Notification.create({
            recipient_id: staffUser2._id,
            title: 'Welcome to the System',
            message: 'Your account has been created successfully. You can now track your attendance and manage leaves.',
            type: 'general'
        });

        console.log('✅ Created sample notifications');

        console.log('\n🎉 Sample data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Staff: ${await Staff.countDocuments()}`);
        console.log(`   - Classrooms: ${await Classroom.countDocuments()}`);
        console.log(`   - Timetable entries: ${await Timetable.countDocuments()}`);
        console.log(`   - Users: ${await User.countDocuments()}`);
        console.log(`   - Notifications: ${await Notification.countDocuments()}`);

        console.log('\n🔐 Login Credentials:');
        console.log('\n   ADMIN:');
        console.log('   Email: admin@school.com');
        console.log('   Password: admin123');
        console.log('\n   STAFF (Dr. Alice Smith):');
        console.log('   Email: alice@school.com');
        console.log('   Password: staff123');
        console.log('\n   STAFF (Prof. Bob Jones):');
        console.log('   Email: bob@school.com');
        console.log('   Password: staff123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
