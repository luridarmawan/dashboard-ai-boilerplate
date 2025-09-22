// category.ts

import { generateUUIDv7 } from "../../utils";
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

/**
 * Seed categories in the database
 * @param client_id - The client ID to associate categories with
 * @returns Promise<void>
 */
export const seedCategory = async (client_id: string): Promise<void> => {
  console.log('👉  Seeding categories ...');

  await prisma.categories.createMany({
    data: [
      {
        id: generateUUIDv7(),
        client_id: client_id,
        section: 'general',
        name: 'General',
        description: 'General category',
        status_id: 0
      },
    ]
  });
};
