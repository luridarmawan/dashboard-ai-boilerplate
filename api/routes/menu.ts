// API Get Menu List
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionClientCheck } from '../middleware/clientCheck'
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { getPermission } from '../utils/permission';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = path.join(__dirname, '..', '..', 'modules');

const prisma = new PrismaClient();
const router = Router();

router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

router.get('/', async (_req, res) => {
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
    let menus: any[] = [];

    // Get module list
    const modules = await prisma.modules.findMany({
      select: {
        path: true,
      },
      where: {
        client_id: clientId,
        status_id: 0
      }
    })

    // get menu from available module
    for (const mod of modules) {
      const modulePath = mod.path;
      const moduleMenuFile = path.join(MODULES_DIR, modulePath, 'server', 'menu.ts');
      if (!fs.existsSync(moduleMenuFile)) {
        continue
      }

      const permission = await getPermission(_req, modulePath);
      if (!permission.canRead) {
        continue;
      }

      const moduleMenuPath = pathToFileURL(moduleMenuFile).href;
      const moduleMenu = await import(moduleMenuPath);
      // fleksibel: mendukung export bernama `getMenu` atau default function
      const fn = typeof moduleMenu.getMenu === 'function' ? moduleMenu.getMenu
        : typeof moduleMenu.default === 'function' ? moduleMenu.default
        : null;
      if (fn) {
        const menu = await fn(clientId);
        if (Array.isArray(menu)) {
          menus.push(...menu);
        } else {
          menus.push(menu);
        }
      }
    }
    menus.sort((a, b) => a.name.localeCompare(b.name));

    return res.json({
      success: true,
      message: 'Menu retrieved successfully',
      data: {
        menus: menus,
      }
    });

  } catch (error) {
    console.error('Error get menu configuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

})

export default router;
