'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, Zap, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-[10px] font-medium border border-gray-700 transition-colors cursor-pointer"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: 'Welcome back!', type: 'success' });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials';
      toast({ title: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-4 relative">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TeamFlow</span>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input {...register('email')} id="email" type="email" placeholder="you@company.com"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} id="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-200">Demo Credentials</span>
                <span className="text-[9px] bg-indigo-500/25 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-indigo-300">Quick Copy</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                  <div>
                    <p className="text-[9px] font-semibold text-indigo-400">ADMIN ACCOUNT</p>
                    <p className="font-mono text-white text-xs">admin@demo.com</p>
                  </div>
                  <div className="flex gap-1">
                    <CopyButton text="admin@demo.com" label="Email" />
                    <CopyButton text="password123" label="Pass" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold text-indigo-400">MEMBER ACCOUNT</p>
                    <p className="font-mono text-white text-xs">member@demo.com</p>
                  </div>
                  <div className="flex gap-1">
                    <CopyButton text="member@demo.com" label="Email" />
                    <CopyButton text="password123" label="Pass" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" id="login-btn" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
