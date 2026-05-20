import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isAfter, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
}

export function isOverdue(date: string | Date | null | undefined, status: string): boolean {
  if (!date || status === 'COMPLETED') return false;
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(new Date(), d);
  } catch {
    return false;
  }
}

export const statusColors: Record<string, string> = {
  TODO: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export const priorityColors: Record<string, string> = {
  LOW: 'bg-green-500/20 text-green-300 border-green-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  HIGH: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export const statusLabel: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const priorityLabel: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
