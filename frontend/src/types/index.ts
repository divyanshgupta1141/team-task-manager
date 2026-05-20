export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  createdById: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  project: { id: string; name: string };
  assignedToId: string;
  assignedTo: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
    projects: number;
  };
  recentTasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
