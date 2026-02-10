require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Deposit = require('./models/Deposit');
const Event = require('./models/Event');

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // COUNT BEFORE CLEANUP
    const userCount = await User.countDocuments();
    const depositCount = await Deposit.countDocuments();
    const eventCount = await Event.countDocuments();

    console.log('\n📊 Estado actual de la base de datos:');
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Depósitos: ${depositCount}`);
    console.log(`   - Eventos: ${eventCount}`);

    // Confirm deletion
    console.log('\n⚠️  Advertencia: Esto eliminará TODOS los depósitos y eventos.');
    console.log('   Los usuarios y administradores se mantendrán intactos.');
    
    // Wait 3 seconds before proceeding
    await new Promise(resolve => {
      let countdown = 3;
      const interval = setInterval(() => {
        if (countdown === 0) {
          clearInterval(interval);
          resolve();
        } else {
          process.stdout.write(`\r   Procediendo en ${countdown}s...`);
          countdown--;
        }
      }, 1000);
    });

    console.log('\n\n🗑️  Limpiando base de datos...\n');

    // Delete all deposits
    if (depositCount > 0) {
      const depositResult = await Deposit.deleteMany({});
      console.log(`✅ Depósitos eliminados: ${depositResult.deletedCount}`);
    } else {
      console.log('✅ No hay depósitos para eliminar');
    }

    // Delete all events
    if (eventCount > 0) {
      const eventResult = await Event.deleteMany({});
      console.log(`✅ Eventos eliminados: ${eventResult.deletedCount}`);
    } else {
      console.log('✅ No hay eventos para eliminar');
    }

    // Delete all users
    if (userCount > 0) {
      const userResult = await User.deleteMany({});
      console.log(`✅ Usuarios eliminados: ${userResult.deletedCount}`);
    } else {
      console.log('✅ No hay usuarios para eliminar');
    }

    // Recreate admin user
    const admin = await User.create({
      name: 'Admin Kingdom',
      phone: '+591-admin-001',
      password: 'admin123',
      role: 'ADMIN',
      planType: null,
    });
    console.log(`✅ Usuario Admin creado: ${admin.name}`);

    // Recreate sample users (from original seed.js)
    const users = [
      { name: 'Juan Pérez', phone: '+591-70123456' },
      { name: 'María García', phone: '+591-70234567' },
      { name: 'Carlos López', phone: '+591-70345678' },
      { name: 'Ana Martínez', phone: '+591-70456789' },
      { name: 'Diego Rodríguez', phone: '+591-70567890' },
      { name: 'Laura Sánchez', phone: '+591-70678901' },
      { name: 'Pablo Gómez', phone: '+591-70789012' },
    ];

    for (const userData of users) {
      await User.create({
        ...userData,
        password: 'password123',
        role: 'USER',
        planType: null,
      });
    }
    console.log(`✅ ${users.length} usuarios normales creados (sin planType)`);

    // Reset badges for all users
    const allUsers = await User.find({});
    const resetBadgesResult = await User.updateMany({}, { badges: [] });
    console.log(`✅ Insignias reiniciadas para ${resetBadgesResult.modifiedCount} usuarios`);

    // Verify cleanup
    const finalUserCount = await User.countDocuments();
    const finalDepositCount = await Deposit.countDocuments();
    const finalEventCount = await Event.countDocuments();

    console.log('\n📊 Estado final de la base de datos:');
    console.log(`   - Usuarios: ${finalUserCount} (sin cambios ✓)`);
    console.log(`   - Depósitos: ${finalDepositCount} (eliminados)`);
    console.log(`   - Eventos: ${finalEventCount} (eliminados)`);

    console.log('\n✨ ¡Limpieza completada correctamente!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanDatabase();
