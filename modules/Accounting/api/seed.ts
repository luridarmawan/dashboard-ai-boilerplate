import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { seedConfiguration } from '../../../api/utils';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configurationDataFile = 'configuration.json';

export const seed = async (client_id: string): Promise<string> => {
  const configurationPath = path.join(__dirname, '..', 'prisma', configurationDataFile);

  console.log('   - Seeding Accounting module ...');
  await seedConfiguration(client_id, configurationPath, true);

  // seeder will auto add this permission
  // await addPermissionToGroup(client_id, 'Regular User', 'Example', 'Example.*', 'read');

  return `Seeding Accounting module done`;
}
