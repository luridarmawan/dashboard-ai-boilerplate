import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from '../utils/uuid';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export const seedPermissions = async () => {
  try {
    console.log('🌱 Seeding permission system...');

    // Create sample client
    const clientId = generateUUIDv7();
    await prisma.clients.upsert({
      where: { id: clientId },
      update: {},
      create: {
        id: clientId,
        name: 'Sample Company',
        description: 'Sample company for testing permissions',
        status_id: 0
      }
    });

    // Create groups
    const adminGroupId = generateUUIDv7();
    const operatorGroupId = generateUUIDv7();
    const userGroupId = generateUUIDv7();

    await prisma.groups.createMany({
      data: [
        {
          id: adminGroupId,
          client_id: clientId,
          name: '!Administrator',
          description: 'Full system access',
          status_id: 0
        },
        {
          id: operatorGroupId,
          client_id: clientId,
          name: '!Operator',
          description: 'Limited administrative access',
          status_id: 0
        },
        {
          id: userGroupId,
          client_id: clientId,
          name: '!Regular User',
          description: 'Basic user access',
          status_id: 0
        }
      ],
      skipDuplicates: true
    });

    // Create permissions for Admin group (full access)
    await prisma.group_permissions.createMany({
      data: [
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: adminGroupId,
          name: '!Full System Access',
          resource: '*.*',
          action: 'manage',
          status_id: 0
        }
      ],
      skipDuplicates: true
    });

    // Create permissions for Operator group
    await prisma.group_permissions.createMany({
      data: [
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: operatorGroupId,
          name: '!Read All Modules',
          resource: '*.*',
          action: 'read',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: operatorGroupId,
          name: '!Manage Users',
          resource: 'user',
          action: 'manage',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: operatorGroupId,
          name: '!Edit Payroll',
          resource: 'payroll',
          action: 'edit',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: operatorGroupId,
          name: '!Use AI Features',
          resource: 'ai',
          action: 'create',
          status_id: 0
        }
      ],
      skipDuplicates: true
    });

    // Create permissions for Regular User group
    await prisma.group_permissions.createMany({
      data: [
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: userGroupId,
          name: '!Read Users',
          resource: 'user',
          action: 'read',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: userGroupId,
          name: '!Read Payroll',
          resource: 'payroll',
          action: 'read',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: userGroupId,
          name: '!Read Reports',
          resource: 'reports',
          action: 'read',
          status_id: 0
        },
        {
          id: generateUUIDv7(),
          client_id: clientId,
          group_id: userGroupId,
          name: '!Use AI Features',
          resource: 'ai',
          action: 'create',
          status_id: 0
        }
      ],
      skipDuplicates: true
    });

    // Get existing users and assign them to groups
    const users = await prisma.users.findMany({
      where: { status_id: 0 },
      select: { id: true, email: true }
    });

    if (users.length > 0) {
      // Assign first user as admin
      if (users[0]) {
        await prisma.group_user_maps.upsert({
          where: { 
            id: generateUUIDv7() // This won't match, so it will create
          },
          update: {},
          create: {
            id: generateUUIDv7(),
            client_id: clientId,
            group_id: adminGroupId,
            user_id: users[0].id,
            status_id: 0
          }
        });
        console.log(`✅ Assigned ${users[0].email} to Administrator group`);
      }

      // Assign second user as operator
      if (users[1]) {
        await prisma.group_user_maps.upsert({
          where: { 
            id: generateUUIDv7() // This won't match, so it will create
          },
          update: {},
          create: {
            id: generateUUIDv7(),
            client_id: clientId,
            group_id: operatorGroupId,
            user_id: users[1].id,
            status_id: 0
          }
        });
        console.log(`✅ Assigned ${users[1].email} to Operator group`);
      }

      // Assign remaining users as regular users
      for (let i = 2; i < users.length; i++) {
        await prisma.group_user_maps.upsert({
          where: { 
            id: generateUUIDv7() // This won't match, so it will create
          },
          update: {},
          create: {
            id: generateUUIDv7(),
            client_id: clientId,
            group_id: userGroupId,
            user_id: users[i].id,
            status_id: 0
          }
        });
        console.log(`✅ Assigned ${users[i].email} to Regular User group`);
      }
    }

    console.log('🎉 Permission system seeded successfully!');
    console.log('\n📋 Summary:');
    console.log('- Created 3 groups: Administrator, Operator, Regular User');
    console.log('- Administrator: Full access (*.*:manage)');
    console.log('- Operator: Read all (*.*:read), Manage users (user:manage), Edit payroll (payroll:edit)');
    console.log('- Regular User: Read users, payroll, and reports');
    console.log(`- Assigned ${users.length} users to groups`);

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
seedPermissions()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
