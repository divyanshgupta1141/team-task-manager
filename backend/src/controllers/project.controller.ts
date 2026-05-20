import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { projectSchema, addMemberSchema } from '../utils/validators';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, description, dueDate } = parsed.data;
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
        members: { create: { userId } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const projects = await prisma.project.findMany({
      where: role === 'ADMIN' ? {} : { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: projects });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        createdBy: { select: { id: true, name: true } },
        tasks: {
          include: { assignedTo: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    if (role !== 'ADMIN') {
      const isMember = project.members.some((m: { userId: string }) => m.userId === userId);
      if (!isMember) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    res.json({ success: true, data: project });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = projectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email } = parsed.data;
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId: id } },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'User is already a member' });
      return;
    }

    await prisma.projectMember.create({ data: { userId: userToAdd.id, projectId: id } });
    res.json({ success: true, message: 'Member added successfully', data: { user: userToAdd } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.params.userId as string;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found in this project' });
      return;
    }

    if (project.createdById === userId) {
      res.status(400).json({ success: false, message: 'Cannot remove the project creator' });
      return;
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: id } },
    });
    res.json({ success: true, message: 'Member removed' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
