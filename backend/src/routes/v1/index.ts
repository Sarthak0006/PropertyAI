import { Router } from 'express';
import { SearchController } from '../../controllers/searchController';
import { PropertyController } from '../../controllers/propertyController';
import { validate } from '../../middlewares/validate';
import { searchQuerySchema, compareSchema, suggestionSchema, propertyIdSchema } from '../../validators/schemas';
import userRoutes from './userRoutes';
import chatRoutes from './chatRoutes';

const router = Router();

// ── Search Routes ───────────────────────────────────
router.get('/search', validate(searchQuerySchema, 'query'), SearchController.search);
router.get('/suggestions', validate(suggestionSchema, 'query'), SearchController.suggestions);

// ── Property Routes ─────────────────────────────────
router.get('/properties/compare', validate(compareSchema, 'query'), PropertyController.compare);
router.get('/properties/:id', PropertyController.getById);
router.get('/properties/:id/similar', PropertyController.getSimilar);

// ── User & Chat Routes ──────────────────────────────
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);

export default router;
