import { Router } from 'express';
import {
  createTask, getTasks, updateTask, deleteTask, getDashboardStats
} from '../controllers/task.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.post('/', authorizeRoles('ADMIN'), createTask);
router.get('/', getTasks);
router.put('/:id', updateTask);
router.delete('/:id', authorizeRoles('ADMIN'), deleteTask);

export default router;
