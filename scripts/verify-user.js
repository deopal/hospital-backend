/**
 * Script to manually verify a user's email
 * Usage: node scripts/verify-user.js <email> <role>
 * Example: node scripts/verify-user.js test@example.com patient
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const verifyUser = async () => {
  const email = process.argv[2];
  const role = process.argv[3] || 'patient';

  if (!email) {
    console.log('Usage: node scripts/verify-user.js <email> <role>');
    console.log('Example: node scripts/verify-user.js test@example.com patient');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...\n');

    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB\n');

    const collection = role === 'doctor' ? 'doctors' : 'patients';
    const db = mongoose.connection.db;

    const result = await db.collection(collection).updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ No ${role} found with email: ${email}`);
    } else if (result.modifiedCount === 0) {
      console.log(`ℹ️  ${role} ${email} is already verified`);
    } else {
      console.log(`✅ Successfully verified ${role}: ${email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

verifyUser();
