import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required when running in production environment.');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notes_db';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB database connection established successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to MongoDB:');
    process.exit(1);
  }
};

