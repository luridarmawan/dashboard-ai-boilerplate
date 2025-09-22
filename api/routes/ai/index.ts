import { Router } from 'express';
import chatCompletionsRoutes from './chat_completions';

const router = Router();

// Mount all AI-related routes
router.use('/', chatCompletionsRoutes);

export default router;