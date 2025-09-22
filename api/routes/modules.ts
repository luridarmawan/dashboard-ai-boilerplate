// API Get Menu List
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionClientCheck } from '../middleware/clientCheck'
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

router.get('/', requirePermission('modules', PermissionAction.READ), async (_req, res) => {
  const clientId = _req.headers['x-client-id'] as string;

  // check is client exist
  const client = await prisma.clients.findUnique({
    where: {
      id: clientId,
      status_id: 0
    }
  })
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  try {
    // Get module list
    const modules = await prisma.modules.findMany({
      select: {
        path: true,
        name: true,
        description: true,
        version: true,
        metadata: true,
        status_id: true
      },
      where: {
        client_id: clientId,
        status_id: 0
      }
    })

    return res.json({
      success: true,
      message: 'Module list retrieved successfully',
      data: {
        modules: modules,
      }
    });

  } catch (error) {
    console.error('Error get module list:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

})

export default router;
