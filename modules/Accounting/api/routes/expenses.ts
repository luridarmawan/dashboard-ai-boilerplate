import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getPermission } from '../../../../api/utils/permission';
import { ucwords } from '../../../../api/utils/string';

const ModuleName = 'Accounting';
const router = Router();
const prisma = new PrismaClient();

// Apply authentication and permission middleware to all routes in this router
// router.use(authenticateToken);
// router.use(permissionMiddleware);
// router.use(permissionClientCheck);


// url: /accounting/expense
// no permission
router.get('/', async (req, res) => {
// router.get('/', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const { q } = req.query;
  let clientId = req.headers['x-client-id'] as string;

  // Build where clause with search filter - only active data (status_id = 0)
  const whereClause: any = {
    client_id: clientId,
    status_id: {
      not: 1
    }
  };

  // Add search filter if query parameter 'q' is provided
  if (q && typeof q === 'string' && q.trim()) {
    const searchTerm = q.trim();
    whereClause.OR = [
      {
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }
    ];
  }

  try {
    const expenses = await prisma.expenses.findMany({
      where: whereClause,
      orderBy: [
        { post_date: 'asc' }
      ]
    });

    // Check additional permissions for enhanced response
    // const canManage = await req.permissions!.canManage('expense');
    // const canCreate = await req.permissions!.canCreate('expense');
    // const canEdit = await req.permissions!.canEdit('expense');

    res.json({
      success: true,
      message: `${ucwords(ModuleName)} retrieved successfully`,
      data: {
        expenses: expenses,
        requestedBy: req.user, // Information about who made the request
        permissions: await getPermission(req, ModuleName)
      },
      requestedBy: req.user, // Information about who made the request
      // permissions: {
      //   canManage: canManage,
      //   canCreate: canCreate,
      //   canEdit: canEdit
      // }
    });

  } catch (error) {
    console.error(`Error fetching ${ucwords(ModuleName)}:Expense:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});

// router.get('/test', authenticateToken, permissionMiddleware, async (req: Request, res: Response) => {
// });

export default router;
