import { Router } from 'express';
import { ChatController } from '../../controllers/chatController';

const router = Router();
const chatController = new ChatController();

router.get('/history/:sessionId', chatController.getHistory);
router.post('/stream', chatController.streamChat);

export default router;
