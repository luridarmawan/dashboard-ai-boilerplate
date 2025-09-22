import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from '../../../api/utils';
import { readFile, seedConfiguration } from '../../../api/utils';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exampleDataFile = 'example.json';
const configurationDataFile = 'configuration.json';

interface DefaultExample {
  id: string;
  client_id: string;
  name: string;
  description: string;
  external: boolean;
  status_id: number;
}

const seedData = async (client_id: string): Promise<void> => {
  try {
    const dataPath = path.join(__dirname, '..', 'prisma', exampleDataFile);
    let data = readFile(dataPath, true, []);

    for (const item of data) {
      const existingItem = await prisma.examples.findFirst({
        where: { name: item.name }
      });

      if (existingItem) {
        console.log(`    🎈 Item with name "${item.name}" already exists, skipping...`);
        continue;
      }

      item.id = generateUUIDv7();
      item.client_id = client_id;
      await prisma.examples.create({
        data: item
      });
    }

  } catch (error) {
    console.log(`❌ Error seeding example module: ${error}`);
  }
}


export const seed = async (client_id: string): Promise<string> => {
  const configurationPath = path.join(__dirname, '..', 'prisma', configurationDataFile);

  console.log('   - Seeding Example...');
  await seedData(client_id);
  await seedConfiguration(client_id, configurationPath, true);

  // seeder will auto add this permission
  // await addPermissionToGroup(client_id, 'Regular User', 'Example', 'Example.*', 'read');

  return `Seeding example module done`;
}
