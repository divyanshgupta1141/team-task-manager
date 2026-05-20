'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, Zap, ShieldCheck, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'MEMBER' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signup(data.name, data.email, data.password, data.role);
      toast({ title: 'Account created! Welcome to TeamFlow.', type: 'success' });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong';
      toast({ title: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden py-10">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-4 relative">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TeamFlow</span>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-gray-400 text-sm mb-6">Start managing your team today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input {...register('name')} id="name" placeholder="Divyansh Gupta"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input {...register('email')} id="signup-email" type="email" placeholder="you@company.com"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} id="signup-password" type={showPwd ? 'text' : 'password'} placeholder="min. 6 characters"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {(['ADMIN', 'MEMBER'] as const).map((role) => (
                  <button key={role} type="button" id={`role-${role.toLowerCase()}`}
                    onClick={() => setValue('role', role)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedRole === role ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}>
                    {role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-sm font-medium">{role === 'ADMIN' ? 'Admin' : 'Member'}</span>
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                {selectedRole === 'ADMIN' ? 'Can create projects, assign tasks, manage team.' : 'Can view and update assigned tasks.'}
              </p>
            </div>
            <button type="submit" id="signup-btn" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
