import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { generateUUIDv7 } from '../utils/uuid';

dotenv.config();

const prisma = new PrismaClient();

export const initializeDatabase = async () => {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Database initialized successfully');

    // Create default users if they don't exist
    // await createDefaultUsers();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export { prisma };