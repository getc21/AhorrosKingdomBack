require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Event = require('./models/Event');

async function seedEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if primary event already exists
    const primaryEvent = await Event.findOne({ isPrimary: true });

    if (primaryEvent) {
      console.log('✅ Primary event already exists:', primaryEvent.name);
      await mongoose.connection.close();
      return;
    }

    // Find admin user (or create one if doesn't exist)
    let admin = await User.findOne({ role: 'ADMIN' });

    if (!admin) {
      console.log('⚠️ No admin user found. Creating default admin user...');
      admin = await User.create({
        name: 'Administrator',
        phone: '+591-70000000',
        password: 'admin123', // This should be hashed in production
        role: 'ADMIN',
      });
      console.log('✅ Default admin user created');
    }

    // Create main event
    const mainEvent = await Event.create({
      name: 'Campamento Kingdom 2026',
      description: 'El evento principal de ahorro para el campamento del reino',
      goal: 500,
      emoji: '🎪',
      isPrimary: true,
      isActive: true,
      createdBy: admin._id,
    });

    console.log('✅ Primary event created successfully:', mainEvent.name);

    // Create a few additional events as examples
    const additionalEvents = [
      {
        name: 'Fondo de Emergencia',
        description: 'Para gastos imprevistos y emergencias',
        goal: 200,
        emoji: '🆘',
        isPrimary: false,
        isActive: true,
      },
      {
        name: 'Viaje Familiar',
        description: 'Ahorro para viaje familiar a fin de año',
        goal: 1000,
        emoji: '✈️',
        isPrimary: false,
        isActive: true,
      },
    ];

    for (const eventData of additionalEvents) {
      const event = await Event.create({
        ...eventData,
        createdBy: admin._id,
      });
      console.log('✅ Event created:', event.name);
    }

    console.log('\n✨ Database seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedEvents();
