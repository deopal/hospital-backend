import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const initDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...\n');

    const mongoUri = process.env.MONGO_URI || 
      `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.ubtyv.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`;

    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully!\n');
    console.log('📊 Database Info:');
    console.log(`   Name: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}\n`);

    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📁 Checking collections...\n');

    // Required collections for HealOrbit
    const requiredCollections = [
      'doctors',
      'patients',
      'appointments',
      'notifications',
      'contacts'
    ];

    for (const collName of requiredCollections) {
      if (collectionNames.includes(collName)) {
        console.log(`   ✓ ${collName} (exists)`);
      } else {
        await mongoose.connection.db.createCollection(collName);
        console.log(`   + ${collName} (created)`);
      }
    }

    // Create indexes for better performance
    console.log('\n📇 Creating indexes...\n');

    const db = mongoose.connection.db;

    // Doctors indexes
    await db.collection('doctors').createIndex({ email: 1 }, { unique: true });
    await db.collection('doctors').createIndex({ username: 1 }, { unique: true });
    console.log('   ✓ doctors indexes');

    // Patients indexes
    await db.collection('patients').createIndex({ email: 1 }, { unique: true });
    await db.collection('patients').createIndex({ username: 1 }, { unique: true });
    console.log('   ✓ patients indexes');

    // Appointments indexes
    await db.collection('appointments').createIndex({ patientId: 1, status: 1 });
    await db.collection('appointments').createIndex({ doctorId: 1, status: 1 });
    await db.collection('appointments').createIndex({ doctorId: 1, patientId: 1 });
    console.log('   ✓ appointments indexes');

    // Notifications indexes
    await db.collection('notifications').createIndex({ recipientId: 1, isRead: 1 });
    await db.collection('notifications').createIndex({ recipientId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ appointmentId: 1 });
    console.log('   ✓ notifications indexes');

    // Contacts indexes
    await db.collection('contacts').createIndex({ userId: 1 });
    await db.collection('contacts').createIndex({ status: 1 });
    console.log('   ✓ contacts indexes');

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 HealOrbit Database initialized successfully!');
    console.log('═══════════════════════════════════════════════\n');

    console.log('📋 Collections:');
    console.log('   • doctors     - Doctor profiles & authentication');
    console.log('   • patients    - Patient profiles & authentication');
    console.log('   • appointments - Doctor-patient appointments');
    console.log('   • notifications - User notifications (normalized)');
    console.log('   • contacts    - Contact form submissions\n');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your .env file has correct MONGO_URI');
    console.log('   2. Verify your MongoDB Atlas credentials');
    console.log('   3. Ensure your IP is whitelisted in Atlas');
    console.log('   4. Check if cluster is active\n');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

initDatabase();
