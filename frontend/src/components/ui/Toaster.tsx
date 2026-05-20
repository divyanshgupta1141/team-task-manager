'use client';
import { useToastState } from '@/hooks/useToast';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const toasts = useToastState();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md text-sm font-medium animate-in slide-in-from-bottom-2',
            toast.type === 'success' && 'bg-emerald-950/90 border-emerald-700/50 text-emerald-200',
            toast.type === 'error' && 'bg-red-950/90 border-red-700/50 text-red-200',
            toast.type === 'info' && 'bg-gray-900/90 border-gray-700/50 text-gray-200',
          )}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
          <span className="flex-1">{toast.title}</span>
        </div>
      ))}
    </div>
  );
}
