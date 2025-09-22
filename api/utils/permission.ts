import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from './uuid';

const prisma = new PrismaClient();

interface DefaultPermission {
  canManage: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canRead: boolean;
}

let userPermission: DefaultPermission = {
  canManage: false,
  canCreate: false,
  canEdit: false,
  canRead: false
}

export const getPermission = async (req: any, resourceName: string): Promise<DefaultPermission> => {
  try {
    userPermission.canManage = await req.permissions!.canManage(resourceName);
    userPermission.canCreate = await req.permissions!.canCreate(resourceName);
    userPermission.canEdit = await req.permissions!.canEdit(resourceName);
    userPermission.canRead = await req.permissions!.canRead(resourceName);
  } catch (error) {
    // console.error('Error fetching permissions:', error);
  }
  return userPermission;
}

export const addPermissionToGroup = async (clientId: string, groupName: string, moduleName: string,  resourceName: string, action: string): Promise<boolean> => {
  const group = await prisma.groups.findFirst({
    where: {
      name: groupName,
      client_id: clientId,
      status_id: 0
    }
  });

  if (!group) {
    return false;
  }

  const permissions = await prisma.group_permissions.findFirst({
      where: {
        client_id: clientId,
        group_id: group.id,
        name: moduleName,
        resource: resourceName,
        action: action,
        status_id: 0
      }
  })

  if (permissions) {
    return true;
  }
 
  await prisma.group_permissions.create({
    data: {
      id: generateUUIDv7(),
      group_id: group.id,
      name: moduleName,
      resource: resourceName,
      action: action,
      client_id: clientId,
      status_id: 0
    }
  })  

  return true;
}

export const addUserIdToGroup = async (clientId: string, userId: string, groupName: string): Promise<boolean> => {
  const group = await prisma.groups.findFirst({
    where: {
      name: groupName,
      client_id: clientId,
      status_id: 0
    }
  });

  if (!group) {
    return false;
  }

  await prisma.group_user_maps.create({
    data: {
      id: generateUUIDv7(),
      client_id: clientId,
      user_id: userId,
      group_id: group.id,
      status_id: 0
    }
  });

  return true;
};

