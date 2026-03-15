import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (uri: string): Promise<void> => {
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ error }, 'Error connecting to MongoDB');
    process.exit(1);
  }
};
