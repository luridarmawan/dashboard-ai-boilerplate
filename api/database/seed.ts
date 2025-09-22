import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { generateUUIDv7 } from '../utils/uuid';
import { fileURLToPath, pathToFileURL } from 'url';
import { glob } from 'glob';
import { removeCommentLines, readFile, addUserIdToGroup, addPermissionToGroup } from '../utils';
import { seedGroup, seedCategory, seedConfiguration } from './seeder';
import { logs } from '../utils/logs';


dotenv.config();

const prisma = new PrismaClient();
let groupAdminId: string;
let groupEditorId: string;
let groupViewerId: string;
let groupRegularUserId: string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GROUP_REGULAR_USER = 'Regular User';

// Read additional user from file
const MODULES_DIR = path.join(__dirname, '..', '..', 'modules');
const additionalUserPath = path.join(__dirname, '..', '..', 'data', 'install_only', 'users.json');
let additionalUser = readFile(additionalUserPath, true, []);

interface DefaultUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  description: string;
  groups?: string;
  status_id: number;
}

interface DefaultClient {
  name: string;
  description: string | null;
  parent_id: string | null;
  metadata?: any;
  status_id: number;
}

interface DefaultGroupPermissions {
  client_id: string | null;
  group_id: string;
  name: string;
  resource: string;
  action: string;
  status_id: number;
}

const defaultClients: DefaultClient[] = [
  {
    name: 'Internal',
    description: 'Internal Company',
    parent_id: null,
    // metadata: null,
    status_id: 0
  }
];

const superAdminEmail = process.env.VITE_SUPERADMIN?.split(',')[0] || '';
console.log('');
console.log('❗️ Seeding default database ...');
console.log('❗️👮‍♂️ Super Admin Email:', superAdminEmail);
console.log('');
let defaultUsers: DefaultUser[] = [
  {
    email: superAdminEmail,
    password: 'password',
    firstName: 'Admin',
    lastName: 'System',
    phone: '+628134567890',
    description: 'Administrator',
    status_id: 0
  },
  {
    email: 'operator@example.com',
    password: 'password',
    firstName: 'Operator',
    lastName: 'Satu',
    phone: '+628134567891',
    description: 'Operator',
    status_id: 0
  },
  {
    email: 'viewer@example.com',
    password: 'password',
    firstName: 'User',
    lastName: 'Viewer',
    phone: '+628134567891',
    description: 'Viewer Only User',
    status_id: 0
  },
  {
    email: 'user@example.com',
    password: 'password',
    firstName: 'Regular',
    lastName: 'User',
    phone: '+628134567891',
    description: GROUP_REGULAR_USER,
    status_id: 0
  },
  {
    email: 'unknown@example.com',
    password: 'unknown',
    firstName: 'Unknown',
    lastName: 'User',
    phone: '+628134567899',
    description: 'Unknown User',
    status_id: 0
  },

  // for feature test 
  {
    email: 'deleted-user@example.com',
    password: 'password',
    firstName: 'Deleted',
    lastName: 'User',
    phone: '+6280000001',
    description: 'Deleted User',
    status_id: 1
  },
  {
    email: 'pending-user@example.com',
    password: 'password',
    firstName: 'Pending',
    lastName: 'User',
    phone: '+6280000002',
    description: 'Pending User',
    status_id: 2
  },
];

// Add additional users to seed
if (additionalUser.length > 0) {
  defaultUsers = [...defaultUsers, ...additionalUser];
}

/**
 * Seed clients in the database
 * @returns Promise with client_id of the created/existing client
 */
export const seedClient = async (): Promise<string> => {
  let client_id: string | undefined;

  console.log('🏡 Seeding default clients...');

  // Seed clients first
  for (const client of defaultClients) {
    // Check if client already exists
    const existingClient = await prisma.clients.findFirst({
      where: { name: client.name }
    });

    if (existingClient) {
      console.log(` - Client with name ${client.name} already exists, skipping...`);
      client_id = existingClient.id;
      continue;
    }

    // Create client
    const clientId = generateUUIDv7();
    const newClient = await prisma.clients.create({
      data: {
        id: clientId,
        name: client.name,
        description: client.description,
        parent_id: client.parent_id,
        metadata: client.metadata,
        status_id: client.status_id,
      }
    });
    client_id = newClient.id;

    console.log(`  Created client: ${newClient.name} [${newClient.id}]`);
  }

  // Ensure we have a client_id before proceeding
  if (!client_id) {
    throw new Error('No client found or created. Cannot proceed with user seeding.');
  }

  return client_id;
};

/**
 * Seed users in the database
 * @param client_id - The client ID to associate users with
 * @returns Promise<void>
 */
export const seedUser = async (client_id: string): Promise<void> => {
  console.log('👉  Seeding default users...');

  for (const user of defaultUsers) {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: user.email }
    });

    if (existingUser) {
      console.log(` - User with email ${user.email} already exists, checking client_user_maps...`);

      // Skip creating client_user_maps for unknown@example.com user
      if (user.email === 'unknown@example.com') {
        console.log(`  🚫 Skipping client_user_maps creation for ${user.email} (intentionally unmapped)`);
        continue;
      }

      // Check if client_user_maps entry exists for this user
      const existingMapping = await prisma.client_user_maps.findFirst({
        where: {
          client_id: client_id!,
          user_id: existingUser.id
        }
      });

      if (!existingMapping) {
        // Create client_user_maps entry for existing user
        await prisma.client_user_maps.create({
          data: {
            client_id: client_id!,
            user_id: existingUser.id,
            role_id: null as any,
            ref_id: 0,
            status_id: 0
          }
        });
        console.log(`  🔗 Created client_user_maps entry for existing user: ${existingUser.email}`);
      } else {
        console.log(`  🔗 Client_user_maps entry already exists for user: ${existingUser.email}`);
      }
      continue;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(user.email + user.password, saltRounds);

    // Generate UUIDs for user and client
    const userId = generateUUIDv7();

    // Create user
    const newUser = await prisma.users.create({
      data: {
        id: userId,
        client_id: client_id,
        email: user.email,
        password_hash: passwordHash,
        phone: user.phone,
        first_name: user.firstName,
        description: user.description,
        last_name: user.lastName,
        last_seen: null,
        ip: null,
        status_id: user.status_id
      }
    });

    console.log(`  🙎‍♂️ Created user: ${newUser.email}`);

    // Skip creating client_user_maps for unknown@example.com user
    if (user.email === 'unknown@example.com') {
      console.log(`  🚫 Skipping client_user_maps creation for ${user.email} (intentionally unmapped)`);
    } else {
      // Create client_user_maps entry for the user
      await prisma.client_user_maps.create({
        data: {
          client_id: client_id!,
          user_id: userId,
          role_id: null as any,
          ref_id: 0,
          status_id: 0
        }
      });
      console.log(`  🔗 Created client_user_maps entry for user: ${newUser.email}`);

      // Create group mapping with user
      if (user.email === superAdminEmail) {
        await prisma.group_user_maps.create({
          data: {
            id: generateUUIDv7(),
            client_id: client_id!,
            user_id: userId,
            group_id: groupAdminId,
            status_id: 0
          }
        });
      }
      if (user.email === 'operator@example.com') {
        await addUserIdToGroup(client_id, userId, GROUP_REGULAR_USER);
        await prisma.group_user_maps.create({
          data: {
            id: generateUUIDv7(),
            client_id: client_id!,
            user_id: userId,
            group_id: groupEditorId,
            status_id: 0
          }
        });
      }
      if (user.email === 'viewer@example.com') {
        await addUserIdToGroup(client_id, userId, GROUP_REGULAR_USER);
        await prisma.group_user_maps.create({
          data: {
            id: generateUUIDv7(),
            client_id: client_id!,
            user_id: userId,
            group_id: groupViewerId,
            status_id: 0
          }
        });
      }
      if (user.email === 'user@example.com') {
        await prisma.group_user_maps.create({
          data: {
            id: generateUUIDv7(),
            client_id: client_id!,
            user_id: userId,
            group_id: groupRegularUserId,
            status_id: 0
          }
        });
      }

      // addition group mapping from file "data/install_only/users.json"
      if (user.groups !== undefined){
        const groups = user.groups.split(',');
        for (const groupName of groups) {
          await addUserIdToGroup(client_id, userId, groupName);
        }
      }

    }
  }
};

const seedModules = async (client_id: string): Promise<void> => {
  // custom module seeder
  console.log(``);
  console.log(`👉 SEEDING CUSTOM MODULES...`);

  const seedFiles = glob.sync('**/seed.ts', {
    cwd: MODULES_DIR,
    absolute: true
  });
  if (seedFiles.length === 0) return;

  // execute modules seeder
  for (const seedFile of seedFiles) {
    const moduleName = seedFile.split(path.sep).slice(-3)[0];
    const seedPath = pathToFileURL(seedFile).href;
    const versionPath = path.join(MODULES_DIR, moduleName, 'version.json');
    const versionInfo = readFile(versionPath, true, {});
    console.log(`🔧 Seeding module: ${moduleName} ${versionInfo.version}`);
    const seedModule = await import(seedPath);
    
    // fleksibel: mendukung export bernama `seed` atau default function
    const fn = typeof seedModule.seed === 'function' ? seedModule.seed
      : typeof seedModule.default === 'function' ? seedModule.default
      : null;

    if (!fn) {
      console.log(`  ⚠️ Module ${seedPath} does not export a seed function`);
      continue;
    }
    if (fn) {
      try {

        const result = await fn(client_id);
        if (result !== '')
          console.log(`    📋 ${result}`);

        // to model modules
        await prisma.modules.create({
          data: {
            id: generateUUIDv7(),
            client_id: client_id,
            path: moduleName,
            name: versionInfo.name,
            description: versionInfo.description,
            version: versionInfo.version,
            metadata: {},
            status_id: 0
          }
        });

        await addPermissionToGroup(client_id, 'Regular User', moduleName, moduleName + '.*', 'read');

      } catch (error) {
        console.error(`❌ Error seeding module ${moduleName}:`, error);
      }
    }
  }
}

/**
 * Main seed database function that orchestrates all seeding operations
 * @returns Promise<void>
 */
const seedDatabase = async (): Promise<void> => {
  try {
    // Seed in the correct order due to dependencies
    const client_id = await seedClient();
    await seedCategory(client_id);
    const groupIds = await seedGroup(client_id);
    groupAdminId = groupIds.groupAdminId || '';
    groupEditorId = groupIds.groupEditorId || '';
    groupViewerId = groupIds.groupViewerId || '';
    groupRegularUserId = groupIds.groupRegularUserId || '';
    await seedUser(client_id);
    await seedConfiguration(client_id);

    await seedModules(client_id);

    console.log('');
    console.log('👌 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Only run seedDatabase if not in test environment
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  seedDatabase();
}