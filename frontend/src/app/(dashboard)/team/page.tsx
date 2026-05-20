'use client';
import { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/services/api.service';
import { Project, User } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Users, Loader2, ShieldCheck, UserCircle2, Mail, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive unique team members across all projects
  const allMembers = Array.from(
    projects
      .flatMap(p => p.members.map(m => m.user))
      .reduce((map, user) => { map.set(user.id, user); return map; }, new Map<string, User>())
      .values()
  );

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectService.getAll();
      setProjects(res.data.data);
    } catch {
      toast({ title: 'Failed to load team', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  if (loading) return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-gray-800" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-800 rounded w-24" />
          <div className="h-4 bg-gray-800 rounded w-40" />
        </div>
      </div>

      {/* Members Grid Skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-800 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-800/40">
              <div className="h-3 bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-gray-400">{allMembers.length} members across {projects.length} projects</p>
        </div>
      </div>

      {/* Members grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allMembers.map((member) => {
          const memberProjects = projects.filter(p => p.members.some(m => m.userId === member.id));
          return (
            <div key={member.id}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{member.name}</p>
                  <div className={cn(
                    'flex items-center gap-1 mt-0.5 text-xs font-medium',
                    member.role === 'ADMIN' ? 'text-indigo-400' : 'text-gray-400'
                  )}>
                    {member.role === 'ADMIN'
                      ? <><ShieldCheck className="w-3 h-3" /> Admin</>
                      : <><UserCircle2 className="w-3 h-3" /> Member</>
                    }
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{member.email}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400">
                  <FolderKanban className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {memberProjects.length === 0
                      ? <span className="text-xs text-gray-600">No projects</span>
                      : memberProjects.map(p => (
                        <span key={p.id} className="text-xs bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                          {p.name}
                        </span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allMembers.length === 0 && (
        <div className="text-center py-20 bg-gray-900/40 border border-gray-800 rounded-2xl">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No team members yet</p>
          <p className="text-gray-500 text-sm mt-1">Add members to your projects to see them here</p>
        </div>
      )}

      {/* Per-project breakdown */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">By Project</h2>
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{project.name}</h3>
                <span className="text-xs text-gray-500">{project.members.length} members</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">{m.user.name}</span>
                    {m.user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
