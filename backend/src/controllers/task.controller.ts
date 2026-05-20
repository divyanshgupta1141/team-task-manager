import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { taskSchema, updateTaskSchema } from '../utils/validators';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { title, description, status, priority, dueDate, projectId, assignedToId } = parsed.data;

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title, description,
        status: status ?? 'TODO',
        priority: priority ?? 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { projectId, status, priority, assignedToId } = req.query;

    const where: Record<string, unknown> = {};

    if (role !== 'ADMIN') {
      where.OR = [
        { assignedToId: userId },
        { project: { members: { some: { userId } } } },
      ];
    }

    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (assignedToId) where.assignedToId = assignedToId as string;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tasks });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Members can only update their own tasks' status
    if (role === 'MEMBER') {
      if (task.assignedToId !== userId) {
        res.status(403).json({ success: false, message: 'You can only update your own tasks' });
        return;
      }
      // Members can only update status
      const { status } = parsed.data;
      const updated = await prisma.task.update({
        where: { id },
        data: { status },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      });
      res.json({ success: true, data: updated });
      return;
    }

    const updateData = {
      ...parsed.data,
      dueDate: parsed.data.dueDate === null ? null : parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    };

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const now = new Date();

    const taskWhere = role === 'ADMIN' ? {} : {
      OR: [
        { assignedToId: userId },
        { project: { members: { some: { userId } } } },
      ],
    };

    const [total, completed, inProgress, todo, overdue, recentTasks, projects] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'TODO' } }),
      prisma.task.count({
        where: { ...taskWhere, dueDate: { lt: now }, status: { not: 'COMPLETED' } },
      }),
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.project.count({
        where: role === 'ADMIN' ? {} : { members: { some: { userId } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: { total, completed, inProgress, todo, overdue, projects },
        recentTasks,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
