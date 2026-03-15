import { Router } from 'express';
import { UserController } from '../../controllers/userController';

const router = Router();
const userController = new UserController();

router.post('/saved', userController.saveProperty);
router.delete('/saved/:id', userController.unsaveProperty);
router.get('/saved', userController.getSavedProperties);

export default router;
