import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { permissionClientCheck } from '../middleware/clientCheck';
import { isValidUUIDv7 } from '../utils/uuid';
import { logs } from '../utils';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

router.get('/:id', requirePermission('groups', PermissionAction.READ), async (_req, res) => {
  try {
    const clientId = _req.headers['x-client-id'] as string;
    const { id } = _req.params;
    const { order, q } = _req.query as { order?: string, q?: string };

    if (!isValidUUIDv7(id) || !isValidUUIDv7(clientId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid group member ID or no client id provided.`
      });
    }

    // Get group user maps first to get the mapping IDs
    const groupUserMaps = await prisma.group_user_maps.findMany({
      where: {
        group_id: id,
        client_id: clientId,
        status_id: 0,
      },
      select: {
        id: true, // ID from group_user_maps table
        user_id: true,
      }
    });

    // Extract user IDs
    const userIds = groupUserMaps.map(map => map.user_id);

    if (userIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group members not found'
      });
    }

    // Determine ordering - default to first_name if no order specified
    const orderBy = order === 'email' ? { email: 'asc' as const } :
      order === 'last_name' ? { last_name: 'asc' as const } :
        order === 'alias' ? { alias: 'asc' as const } :
          { first_name: 'asc' as const }; // default

    const whereClause: any = {
      id: {
        in: userIds
      },
      client_id: clientId,
      status_id: { not: 1 }
    };

    // Add search filter if query parameter 'q' is provided
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        {
          first_name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          last_name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get user details
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        alias: true,
        description: true,
        avatar: true,
        last_seen: true,
      },
      orderBy: orderBy
    });

    // Create a map of user_id to user data for easy lookup
    const userMap = new Map(users.map(user => [user.id, user]));

    // Combine group_user_maps ID with user data
    const groupMembers = groupUserMaps
      .map(map => {
        const user = userMap.get(map.user_id);
        if (!user) return null;

        return {
          id: map.id, // ID from group_user_maps table
          user_id: map.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          alias: user.alias,
          description: user.description,
          avatar: user.avatar,
          last_seen: user.last_seen,
        };
      })
      .filter(member => member !== null);



    res.json({
      success: true,
      message: 'Group members retrieved successfully',
      data: {
        members: groupMembers
      }
    });

  } catch (error) {
    logs('Error fetching group members:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});


router.delete('/:groupId/:id', requirePermission('groups', PermissionAction.MANAGE), async (_req, res) => {
  const clientId = _req.headers['x-client-id'] as string;
  const { groupId, id } = _req.params;

  if (!isValidUUIDv7(id) || !isValidUUIDv7(clientId) || !isValidUUIDv7(groupId)) {
    return res.status(400).json({
      success: false,
      message: `Invalid group member ID or no client id provided.`
    });
  }

  const groupUserMaps = await prisma.group_user_maps.findFirst({
    where: {
      id: id,
      group_id: groupId,
      client_id: clientId,
      status_id: 0,
    }
  });

  if (!groupUserMaps) {
    return res.status(404).json({
      success: false,
      message: 'Group member not found'
    });
  }

  try {
    // Soft delete by setting status_id to 1
    await prisma.group_user_maps.update({
      where: {
        id: id,
        group_id: groupId,
        client_id: clientId,
      },
      data: { status_id: 1 }
    });

  } catch (error) {
    logs('Error deleting group member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

  res.json({
    success: true,
    message: 'Group members deleted successfully',
  });
});

export default router;

