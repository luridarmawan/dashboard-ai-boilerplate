import { Router, Request, Response } from 'express';

const router = Router();

// url: /explorer/test
// no permission
router.get('/', async (req: Request, res: Response) => {

  res.json({
    success: true,
    message: 'Test successful',
    data: {}
  });

});

// router.get('/test', authenticateToken, permissionMiddleware, async (req: Request, res: Response) => {
// });

export default router;
