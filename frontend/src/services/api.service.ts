import api from '@/lib/api';
import { User, Project, Task, DashboardStats, ApiResponse } from '@/types';

export const authService = {
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

export const projectService = {
  getAll: () => api.get<ApiResponse<Project[]>>('/projects'),
  getById: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: { name: string; description?: string; dueDate?: string }) =>
    api.post<ApiResponse<Project>>('/projects', data),
  update: (id: string, data: Partial<{ name: string; description: string; dueDate: string }>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (id: string, email: string) =>
    api.post(`/projects/${id}/add-member`, { email }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),
};

export const taskService = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Task[]>>('/tasks', { params }),
  create: (data: {
    title: string; description?: string; status?: string; priority?: string;
    dueDate?: string; projectId: string; assignedToId: string;
  }) => api.post<ApiResponse<Task>>('/tasks', data),
  update: (id: string, data: Partial<{
    title: string; description: string; status: string;
    priority: string; dueDate: string | null; assignedToId: string;
  }>) => api.put<ApiResponse<Task>>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/tasks/dashboard'),
};
