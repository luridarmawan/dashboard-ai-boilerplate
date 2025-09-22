// group.ts

import { generateUUIDv7 } from "../../utils";
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

interface DefaultGroup {
  name: string;
  description: string | null;
  status_id: number;
}

const defaultGroups: DefaultGroup[] = [
  {
    name: 'Administrator',
    description: 'Full system access',
    status_id: 0
  },
  {
    name: 'Operator',
    description: 'Limited administrative access',
    status_id: 0
  },
  {
    name: 'Viewer',
    description: 'Read-only access to examples',
    status_id: 0
  },
  {
    name: 'Regular User',
    description: 'Basic user access',
    status_id: 0
  },
];

/**
 * Seed groups in the database
 * @param client_id - The client ID to associate groups with
 * @returns Promise<{groupAdminId: string | undefined, groupEditorId: string | undefined, groupViewerId: string | undefined}>
 */
export const seedGroup = async (client_id: string, firstInstall: boolean = true): Promise<{
    groupAdminId: string | undefined,
    groupEditorId: string | undefined,
    groupViewerId: string | undefined,
    groupRegularUserId: string | undefined,
  }> => {
  console.log('👉  Seeding default groups...');
  let groupAdminId: string | undefined;
  let groupEditorId: string | undefined;
  let groupViewerId: string | undefined;
  let groupRegularUserId: string | undefined;

  for (const group of defaultGroups) {
    // Check if group already exists
    const existingGroup = await prisma.groups.findFirst({
      where: { 
        client_id: client_id,
        name: group.name
      }
    });

    if (existingGroup) {
      console.log(` - Group with name ${group.name} already exists, skipping...`);

      // Set the group IDs for existing groups
      if (group.name === 'Administrator') {
        groupAdminId = existingGroup.id;
      }
      if (group.name === 'Operator') {
        groupEditorId = existingGroup.id;
      }
      if (group.name === 'Viewer') {
        groupViewerId = existingGroup.id;
      }
      if (group.name === 'Regular User') {
        groupRegularUserId = existingGroup.id;
      }
      continue;
    }

    // Create group
    const groupId = generateUUIDv7();
    const newGroup = await prisma.groups.create({
      data: {
        id: groupId,
        client_id: client_id,
        name: group.name,
        description: group.description,
        status_id: group.status_id,
      }
    });

    if (group.name === 'Regular User') {
      groupRegularUserId = newGroup.id;
    };
    if (group.name === 'Administrator') {
      groupAdminId = newGroup.id;
      await prisma.group_permissions.create({
        data: {
          id: generateUUIDv7(),
          client_id: client_id!,
          group_id: groupId,
          name: `Full All Access`,
          resource: `*.*`,
          action: `manage`,
          status_id: 0
        }
      });
    }
    if (group.name === 'Operator') {
      groupEditorId = newGroup.id;
      await prisma.group_permissions.create({
        data: {
          id: generateUUIDv7(),
          client_id: client_id!,
          group_id: groupId,
          name: `Can Create All`,
          resource: `*.*`,
          action: `create`,
          status_id: 0
        }
      });
      await prisma.group_permissions.create({
        data: {
          id: generateUUIDv7(),
          client_id: client_id!,
          group_id: groupId,
          name: `Can Edit All`,
          resource: `*.*`,
          action: `edit`,
          status_id: 0
        }
      });
    }
    if (group.name === 'Viewer') {
      groupViewerId = newGroup.id;
      await prisma.group_permissions.create({
        data: {
          id: generateUUIDv7(),
          client_id: client_id!,
          group_id: groupId,
          name: `Can Read All`,
          resource: `*.*`,
          action: `read`,
          status_id: 0
        }
      });
    }

    console.log(`  👥 Created group: ${newGroup.name} [${newGroup.id}]`);
  }

  return { groupAdminId, groupEditorId, groupViewerId, groupRegularUserId };
};
