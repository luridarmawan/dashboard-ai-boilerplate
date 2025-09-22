import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getPermission } from '../../../../api/utils/permission';
import { ucwords } from '../../../../api/utils/string';
import { generateUUIDv7, isValidUUIDv7 } from '../../../../api/utils/uuid';

const ModuleName = 'Accounting';
const router = Router();
const prisma = new PrismaClient();

// Apply authentication and permission middleware to all routes in this router
// TODO: add a permission check

// url: /accounting/webhook
router.post('/ocr', async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const data = req.body?.data;

  const expenseId = generateUUIDv7();
  const orderDate = data.order.date ? new Date(data.order.date + 'T00:00:00.000Z').toISOString() : null;
  const userId = req.body.user.id; // TODO: get original user id from table user
  try {
    const newExpense = await prisma.expenses.create({
      data: {
        id: expenseId,
        client_id: clientId,
        doc_id: req.body.doc_id ?? '',
        user_id: userId,
        amount: data.total,
        store_name: data.store_name,
        store_branch: data.store_branch,
        order_id: data.order.order_number ?? '-',
        order_date: orderDate,
        is_duplicate: req.body.duplicate ? true : false,
        metadata: req.body,
        status_id: 0,
      }
    });
    res.json({
      success: true,
      message: 'Expenses successful',
      data: newExpense
    });

  } catch (error) {
    console.error(`Error creating ${ucwords(ModuleName)}:Expense:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});


export default router;
