import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { generateUUIDv7 } from '../utils/uuid';
import Step from '../utils/step';

dotenv.config();
const spinner = new Step();

const prisma = new PrismaClient();

export const initializeDatabase = async () => {
  try {
    // Test the connection
    spinner.start('Initializing database...');
    await prisma.$connect();

    spinner.stop('Database initialized successfully');
    // Create default users if they don't exist
    // await createDefaultUsers();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export { prisma };