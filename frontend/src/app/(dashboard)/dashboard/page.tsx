'use client';
import { useEffect, useState, useCallback } from 'react';
import { taskService } from '@/services/api.service';
import { DashboardStats, Task } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDate, isOverdue, statusColors, statusLabel, priorityColors, priorityLabel, cn } from '@/lib/utils';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, FolderKanban, TrendingUp, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981'];

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await taskService.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-gray-800" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-800 rounded w-24" />
          <div className="h-4 bg-gray-800 rounded w-40" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-800 rounded w-10" />
              <div className="h-4 bg-gray-800 rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tasks Skeleton */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-gray-800 rounded w-1/4 mb-4" />
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-gray-800/40 pb-3 last:border-0 last:pb-0">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                </div>
                <div className="h-4 bg-gray-800 rounded w-12" />
                <div className="h-4 bg-gray-800 rounded w-12" />
                <div className="h-3 bg-gray-800 rounded w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart + completion Skeleton */}
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-gray-800 rounded w-1/2" />
            <div className="w-32 h-32 rounded-full border-[10px] border-gray-800 mx-auto" />
            <div className="h-4 bg-gray-800 rounded w-2/3 mx-auto" />
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-gray-800 rounded w-1/2" />
            <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-1/3" />
          </div>
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-gray-800 rounded w-1/5" />
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-800/40 border border-gray-800/80 rounded-xl flex gap-3">
              <div className="w-5 h-5 rounded bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const chartData = [
    { name: 'To Do', value: data?.stats.todo || 0 },
    { name: 'In Progress', value: data?.stats.inProgress || 0 },
    { name: 'Completed', value: data?.stats.completed || 0 },
  ].filter(d => d.value > 0);

  const completionRate = data?.stats.total
    ? Math.round((data.stats.completed / data.stats.total) * 100)
    : 0;

  const activities = data?.recentTasks.map((task) => {
    if (task.status === 'COMPLETED') {
      return {
        id: `act-${task.id}`,
        user: task.assignedTo.name,
        action: 'completed the task',
        target: task.title,
        time: '2 hours ago',
        icon: '✅',
      };
    } else if (task.status === 'IN_PROGRESS') {
      return {
        id: `act-${task.id}`,
        user: task.assignedTo.name,
        action: 'started working on',
        target: task.title,
        time: '5 hours ago',
        icon: '⚡',
      };
    } else {
      return {
        id: `act-${task.id}`,
        user: 'Admin User',
        action: 'assigned task',
        target: task.title,
        assignee: `to ${task.assignedTo.name}`,
        time: '1 day ago',
        icon: '📋',
      };
    }
  }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Tasks" value={data?.stats.total || 0} icon={CheckCircle2} color="bg-indigo-600/20 text-indigo-400" />
        <StatCard label="Completed" value={data?.stats.completed || 0} icon={CheckCircle2} color="bg-emerald-600/20 text-emerald-400" />
        <StatCard label="In Progress" value={data?.stats.inProgress || 0} icon={Clock} color="bg-blue-600/20 text-blue-400" />
        <StatCard label="To Do" value={data?.stats.todo || 0} icon={TrendingUp} color="bg-slate-600/20 text-slate-400" />
        <StatCard label="Overdue" value={data?.stats.overdue || 0} icon={AlertTriangle} color="bg-red-600/20 text-red-400" />
        <StatCard label="Projects" value={data?.stats.projects || 0} icon={FolderKanban} color="bg-purple-600/20 text-purple-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Tasks</h2>
            <a href="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-gray-800">
            {data?.recentTasks.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">No tasks yet. Create your first task!</div>
            )}
            {data?.recentTasks.slice(0, 7).map((task: Task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <div key={task.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-800/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', overdue ? 'text-red-300' : 'text-white')}>
                      {task.title}
                      {overdue && <span className="ml-2 text-xs text-red-400 font-normal">Overdue</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{task.project.name} · {task.assignedTo.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', priorityColors[task.priority])}>
                      {priorityLabel[task.priority]}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', statusColors[task.status])}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">{formatDate(task.dueDate)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart + completion */}
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Task Distribution</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                  <Legend formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">No data yet</div>
            )}
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Completion Rate</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall progress</span>
              <span className="text-sm font-bold text-white">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{data?.stats.completed} of {data?.stats.total} tasks done</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Recent Activity Feed
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.slice(0, 3).map((act) => (
            <div key={act.id} className="p-4 bg-gray-900/30 border border-gray-800/80 rounded-xl flex items-start gap-3">
              <span className="text-xl leading-none">{act.icon}</span>
              <div>
                <p className="text-xs text-gray-300">
                  <span className="font-semibold text-white">{act.user}</span> {act.action} <span className="font-semibold text-indigo-400">“{act.target}”</span> {act.assignee || ''}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{act.time}</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-gray-500 text-sm py-4 col-span-full text-center">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}
