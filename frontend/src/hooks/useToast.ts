'use client';
import { useState, useCallback, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach((fn) => fn([...toasts]));
}

export function useToast() {
  const toast = useCallback(({ title, type = 'info' }: { title: string; type?: Toast['type'] }) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, title, type }];
    notify();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 4000);
  }, []);

  return { toast };
}

export function useToastState() {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    toastListeners.push(setState);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setState);
    };
  }, []);

  return state;
}
