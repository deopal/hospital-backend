/**
 * Database configuration
 * Handles MongoDB connection setup
 */

import mongoose from 'mongoose';

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const { MONGO_DB_USER, MONGO_DB_PASSWORD, MONGO_DB_DATABASE } = process.env;
  return `mongodb+srv://${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@cluster0.ubtyv.mongodb.net/${MONGO_DB_DATABASE}?retryWrites=true&w=majority`;
};

export const connectDatabase = async () => {
  try {
    const mongoUri = getMongoUri();

    await mongoose.connect(mongoUri);

    console.log('Database connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
    throw error;
  }
};

export default {
  connectDatabase,
  disconnectDatabase
};
