'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectService, taskService } from '@/services/api.service';
import { Project, Task } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { formatDate, isOverdue, statusColors, statusLabel, priorityColors, priorityLabel, cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, UserPlus, Trash2, Loader2, Calendar, Users, X,
  CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  assignedToId: z.string().min(1, 'Assign to someone'),
});
type TaskFormData = z.infer<typeof taskSchema>;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const fetchProject = useCallback(async () => {
    try {
      const res = await projectService.getById(id);
      setProject(res.data.data);
    } catch {
      toast({ title: 'Failed to load project', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const onCreateTask = async (data: TaskFormData) => {
    try {
      await taskService.create({ ...data, projectId: id });
      toast({ title: 'Task created!', type: 'success' });
      reset();
      setShowAddTask(false);
      fetchProject();
    } catch {
      toast({ title: 'Failed to create task', type: 'error' });
    }
  };

  const onAddMember = async () => {
    if (!memberEmail) return;
    setAddingMember(true);
    try {
      await projectService.addMember(id, memberEmail);
      toast({ title: 'Member added!', type: 'success' });
      setMemberEmail('');
      setShowAddMember(false);
      fetchProject();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add member';
      toast({ title: msg, type: 'error' });
    } finally {
      setAddingMember(false);
    }
  };

  const onDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.delete(taskId);
      toast({ title: 'Task deleted', type: 'success' });
      fetchProject();
    } catch { toast({ title: 'Failed to delete', type: 'error' }); }
  };

  const onUpdateStatus = async (taskId: string, status: string) => {
    try {
      await taskService.update(taskId, { status });
      fetchProject();
    } catch { toast({ title: 'Failed to update', type: 'error' }); }
  };

  if (loading || !project) return (
    <div className="space-y-6">
      {/* Board Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-800 rounded w-16" />
          <div className="h-7 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
          <div className="flex gap-4 pt-1">
            <div className="h-4 bg-gray-800 rounded w-20" />
            <div className="h-4 bg-gray-800 rounded w-28" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-800 rounded-xl w-28" />
          <div className="h-10 bg-gray-800 rounded-xl w-28" />
        </div>
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="grid md:grid-cols-3 gap-6 pt-4">
        {['To Do', 'In Progress', 'Completed'].map((columnName, idx) => (
          <div key={idx} className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-800 rounded w-24" />
              <div className="w-6 h-6 rounded-full bg-gray-800" />
            </div>
            <div className="space-y-3 pt-2">
              {[...Array(idx === 0 ? 2 : 1)].map((_, cardIdx) => (
                <div key={cardIdx} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/4" />
                  <div className="flex justify-between items-center pt-2">
                     <div className="h-3 bg-gray-800 rounded w-16" />
                     <div className="h-5 bg-gray-800 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tasksByStatus: Record<string, Task[]> = {
    TODO: project.tasks?.filter(t => t.status === 'TODO') || [],
    IN_PROGRESS: project.tasks?.filter(t => t.status === 'IN_PROGRESS') || [],
    COMPLETED: project.tasks?.filter(t => t.status === 'COMPLETED') || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project.members.length} members</span>
              {project.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {formatDate(project.dueDate)}</span>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowAddMember(true)} id="add-member-btn"
              className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 transition-all">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
            <button onClick={() => setShowAddTask(true)} id="add-task-btn"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm text-white font-medium transition-all">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Team Members</h2>
        <div className="flex flex-wrap gap-2">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300">{m.user.name}</span>
              <span className={cn('text-xs', m.user.role === 'ADMIN' ? 'text-indigo-400' : 'text-gray-500')}>{m.user.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid md:grid-cols-3 gap-4">
        {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => {
          const icons = { TODO: AlertCircle, IN_PROGRESS: Clock, COMPLETED: CheckCircle2 };
          const Icon = icons[status];
          return (
            <div key={status} className="bg-gray-900/60 border border-gray-800 rounded-2xl">
              <div className={cn('px-4 py-3 border-b border-gray-800 flex items-center justify-between', 'rounded-t-2xl')}>
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4',
                    status === 'TODO' ? 'text-slate-400' :
                    status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-emerald-400'
                  )} />
                  <span className="text-sm font-semibold text-white">{statusLabel[status]}</span>
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {tasksByStatus[status].length}
                </span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {tasksByStatus[status].map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  return (
                    <div key={task.id} className={cn(
                      'p-3 bg-gray-800/80 rounded-xl border hover:border-gray-600 transition-all group',
                      overdue ? 'border-red-800/50' : 'border-gray-700/50'
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                        {isAdmin && (
                          <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border', priorityColors[task.priority])}>
                          {priorityLabel[task.priority]}
                        </span>
                        {overdue && <span className="text-xs text-red-400">Overdue</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">{task.assignedTo.name}</p>
                      {task.dueDate && <p className="text-xs text-gray-600 mt-0.5">{formatDate(task.dueDate)}</p>}
                      {/* Status change */}
                      <select
                        value={task.status}
                        disabled={!isAdmin && task.assignedToId !== user?.id}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                        className={cn(
                          "mt-2 w-full text-xs bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500",
                          (!isAdmin && task.assignedToId !== user?.id) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  );
                })}
                {tasksByStatus[status].length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-6">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddTask(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Task</h2>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onCreateTask)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
                <input {...register('title')} id="task-title" placeholder="Task title"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea {...register('description')} rows={2} placeholder="Optional description"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign To *</label>
                <select {...register('assignedToId')} id="task-assign"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select member…</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.role})</option>
                  ))}
                </select>
                {errors.assignedToId && <p className="text-red-400 text-xs mt-1">{errors.assignedToId.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2.5 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 transition-all">Cancel</button>
                <button type="submit" id="create-task-btn"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Member</h2>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Member Email</label>
                <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} id="member-email"
                  type="email" placeholder="user@example.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddMember(false)}
                  className="flex-1 py-2.5 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800">Cancel</button>
                <button onClick={onAddMember} id="confirm-add-member" disabled={addingMember}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
