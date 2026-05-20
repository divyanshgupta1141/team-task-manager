import { Router } from 'express';
import {
  createProject, getProjects, getProject,
  updateProject, deleteProject, addMember, removeMember
} from '../controllers/project.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles('ADMIN'), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', authorizeRoles('ADMIN'), updateProject);
router.delete('/:id', authorizeRoles('ADMIN'), deleteProject);
router.post('/:id/add-member', authorizeRoles('ADMIN'), addMember);
router.delete('/:id/members/:userId', authorizeRoles('ADMIN'), removeMember);

export default router;
