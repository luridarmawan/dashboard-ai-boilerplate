import { PrismaClient } from '@prisma/client';
import { logs } from '../utils/'

const prisma = new PrismaClient();

/**
 * Get user groups and permissions
 * @param userId - The user ID to get groups and permissions for
 * @returns Array of user groups with their permissions
 */
export async function getUserGroupsAndPermissions(userId: string, clientId: string) {
  try {
    // Step 1: Get user group mappings
    const userGroupMaps = await prisma.group_user_maps.findMany({
      where: {
        user_id: userId,
        client_id: clientId,
        status_id: 0
      }
    });

    if (userGroupMaps.length === 0) {
      return [];
    }

    // Step 2: Get group IDs
    const groupIds = userGroupMaps.map(map => map.group_id);

    // Step 3: Get groups with their permissions
    const groups = await prisma.groups.findMany({
      where: {
        id: { in: groupIds },
        status_id: 0
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Step 4: Get permissions for these groups
    const permissionsRaw = await prisma.group_permissions.findMany({
      where: {
        group_id: { in: groupIds },
        client_id: clientId,
        status_id: 0,
        group: {
          status_id: 0,
        }
      },
      orderBy: [
        { order: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        resource: true,
        action: true,
        order: true,
        group_id: true,
        group: { 
          select: { name: true },
          where: {
            status_id: 0,
          }
        },
      },
    });

    const permissions = permissionsRaw.map(({ group, group_id, ...rest }) => ({
      ...rest,
      group_id,
      group_name: group?.name ?? null, // string | null
    }));

    // Step 5: Group permissions by group_id and format result
    // const formattedResult = groups.map(group => {
    //   const groupPermissions = permissions.filter(perm => perm.group_id === group.id);

    //   return {
    //     group_id: group.id,
    //     group_name: group.name,
    //     permissions: groupPermissions.map(permission => ({
    //       name: permission.name,
    //       resource: permission.resource,
    //       action: permission.action
    //     }))
    //   };
    // });

    return permissions;
  } catch (error) {
    console.error('Error fetching user groups and permissions:', error);
    throw error;
  }
}