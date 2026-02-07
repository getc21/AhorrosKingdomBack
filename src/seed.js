require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Deposit = require('./models/Deposit');
const connectDB = require('./config/database');

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Deposit.deleteMany({});

    console.log('Creating seed data...');

    // Create admin user
    const admin = await User.create({
      name: 'Admin Kingdom',
      phone: '+591-admin-001',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'ADMIN',
      planType: 'Ahorro Campamento 2027',
    });

    console.log('✓ Admin user created');

    // Create sample users
    const user1 = await User.create({
      name: 'Juan Pérez',
      phone: '+591-70000001',
      password: 'password123',
      role: 'USER',
      planType: 'Ahorro Campamento 2027',
    });

    const user2 = await User.create({
      name: 'María García',
      phone: '+591-70000002',
      password: 'password123',
      role: 'USER',
      planType: 'Ahorro Otras Actividades',
    });

    const user3 = await User.create({
      name: 'Carlos López',
      phone: '+591-70000003',
      password: 'password123',
      role: 'USER',
      planType: 'Ahorro Campamento 2027',
    });

    console.log('✓ Sample users created');

    // Create sample deposits
    const deposits = [
      { userId: user1._id, amount: 50, createdBy: admin._id, description: 'First deposit' },
      { userId: user1._id, amount: 75, createdBy: admin._id, description: 'Second deposit' },
      { userId: user1._id, amount: 100, createdBy: admin._id, description: 'Third deposit' },
      { userId: user2._id, amount: 25, createdBy: admin._id, description: 'First deposit' },
      { userId: user2._id, amount: 50, createdBy: admin._id, description: 'Second deposit' },
      { userId: user3._id, amount: 150, createdBy: admin._id, description: 'Single deposit' },
    ];

    await Deposit.create(deposits);
    console.log('✓ Sample deposits created');

    console.log('\n========== Seed Data Created Successfully ==========\n');
    console.log('Admin Credentials:');
    console.log(`  Phone: +591-admin-001`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\nSample User Credentials:');
    console.log(`  Phone: +591-70000001, Password: password123`);
    console.log(`  Phone: +591-70000002, Password: password123`);
    console.log(`  Phone: +591-70000003, Password: password123`);
    console.log('\n=====================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
