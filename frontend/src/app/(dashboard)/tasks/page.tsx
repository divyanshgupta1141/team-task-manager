'use client';
import { useEffect, useState, useCallback } from 'react';
import { taskService, projectService } from '@/services/api.service';
import { Task, Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { formatDate, isOverdue, statusColors, statusLabel, priorityColors, priorityLabel, cn } from '@/lib/utils';
import { CheckSquare, Plus, Trash2, Loader2, Filter, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, 'Project required'),
  assignedToId: z.string().min(1, 'Assignee required'),
});
type FormData = z.infer<typeof schema>;

export default function TasksPage() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'TODO', priority: 'MEDIUM' },
  });

  const watchedProjectId = watch('projectId');

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const [tasksRes, projectsRes] = await Promise.all([
        taskService.getAll(params),
        projectService.getAll(),
      ]);
      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
    } catch {
      toast({ title: 'Failed to load tasks', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, priorityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const proj = projects.find(p => p.id === watchedProjectId);
    setSelectedProjectMembers(proj?.members.map(m => ({ id: m.userId, name: m.user.name })) || []);
  }, [watchedProjectId, projects]);

  const onSubmit = async (data: FormData) => {
    try {
      await taskService.create(data);
      toast({ title: 'Task created!', type: 'success' });
      reset();
      setShowCreate(false);
      fetchData();
    } catch {
      toast({ title: 'Failed to create task', type: 'error' });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      toast({ title: 'Task deleted', type: 'success' });
      fetchData();
    } catch { toast({ title: 'Failed to delete', type: 'error' }); }
  };

  const onUpdateStatus = async (id: string, status: string) => {
    try {
      await taskService.update(id, { status });
      fetchData();
    } catch { toast({ title: 'Failed to update', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tasks</h1>
            <p className="text-sm text-gray-400">{tasks.length} tasks</p>
          </div>
        </div>
        {isAdmin && (
          <button id="new-task-btn" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        {(statusFilter || priorityFilter) && (
          <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 border border-red-800/50 rounded-lg">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Task table */}
      {loading ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center border-b border-gray-800/40 pb-3 last:border-0 last:pb-0">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/4" />
                </div>
                <div className="h-4 bg-gray-800 rounded w-20 hidden md:block" />
                <div className="h-4 bg-gray-800 rounded w-20 hidden lg:block" />
                <div className="h-5 bg-gray-800 rounded w-16" />
                <div className="h-5 bg-gray-800 rounded w-16" />
                <div className="h-4 bg-gray-800 rounded w-16 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/40 border border-gray-800 rounded-2xl">
          <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tasks found</p>
          <p className="text-gray-500 text-sm mt-1">
            {statusFilter || priorityFilter ? 'Try clearing filters' : isAdmin ? 'Create your first task' : 'No tasks assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Project</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Assignee</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <tr key={task.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <p className={cn('text-sm font-medium', overdue ? 'text-red-300' : 'text-white')}>
                        {task.title}
                        {overdue && <span className="ml-2 text-xs text-red-400 font-normal">Overdue</span>}
                      </p>
                      {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-400">{task.project.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-400">{task.assignedTo.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', priorityColors[task.priority])}>
                        {priorityLabel[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={task.status}
                        disabled={!isAdmin && task.assignedToId !== user?.id}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full border font-medium bg-transparent cursor-pointer focus:outline-none',
                          statusColors[task.status],
                          (!isAdmin && task.assignedToId !== user?.id) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn('text-xs', overdue ? 'text-red-400' : 'text-gray-500')}>{formatDate(task.dueDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button onClick={() => onDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Task</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
                <input {...register('title')} placeholder="Task title"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea {...register('description')} rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Project *</label>
                <select {...register('projectId')}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.projectId && <p className="text-red-400 text-xs mt-1">{errors.projectId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign To *</label>
                <select {...register('assignedToId')}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select assignee…</option>
                  {selectedProjectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {errors.assignedToId && <p className="text-red-400 text-xs mt-1">{errors.assignedToId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                  <select {...register('priority')}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date</label>
                  <input {...register('dueDate')} type="date"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
