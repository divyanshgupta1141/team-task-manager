'use client';
import { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/services/api.service';
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { formatDate, cn } from '@/lib/utils';
import {
  FolderKanban, Plus, Trash2, Loader2, Calendar, Users, CheckSquare2,
  ChevronRight, X
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Project name required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await projectService.create(data);
      toast({ title: 'Project created!', type: 'success' });
      onCreated();
      onClose();
    } catch {
      toast({ title: 'Failed to create project', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
            <input {...register('name')} id="project-name" placeholder="e.g. Website Redesign"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} id="project-description" rows={3} placeholder="What is this project about?"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date</label>
            <input {...register('dueDate')} id="project-due-date" type="date"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 transition-all">Cancel</button>
            <button type="submit" id="create-project-btn" disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectService.getAll();
      setProjects(res.data.data);
    } catch {
      toast({ title: 'Failed to load projects', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectService.delete(id);
      toast({ title: 'Project deleted', type: 'success' });
      fetchProjects();
    } catch {
      toast({ title: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-gray-400">{projects.length} projects total</p>
          </div>
        </div>
        {isAdmin && (
          <button id="new-project-btn" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-5 bg-gray-800 rounded w-2/3" />
                <div className="h-4 bg-gray-800 rounded w-full" />
                <div className="h-4 bg-gray-800 rounded w-5/6" />
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-between">
                <div className="h-4 bg-gray-800 rounded w-20" />
                <div className="h-4 bg-gray-800 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/40 border border-gray-800 rounded-2xl">
          <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No projects yet</p>
          {isAdmin && <p className="text-gray-500 text-sm mt-1">Click &quot;New Project&quot; to get started</p>}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:bg-gray-900/80 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-semibold text-white truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(project.id)} title="Delete project"
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-800">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {project.members.length} members
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare2 className="w-3.5 h-3.5" /> {project._count?.tasks ?? 0} tasks
                </span>
                {project.dueDate && (
                  <span className={cn('flex items-center gap-1', new Date(project.dueDate) < new Date() ? 'text-red-400' : '')}>
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(project.dueDate)}
                  </span>
                )}
              </div>

              <Link href={`/projects/${project.id}`}
                className="mt-3 flex items-center justify-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                View Project <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
