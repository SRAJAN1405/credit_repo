'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, initAuth, user, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'borrower') router.push('/borrower/loans');
      else router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'borrower') router.push('/borrower/loans');
      else router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a] relative overflow-hidden px-4">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/25">
              L
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">LoanMS</span>
          </div>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-[#13131f]/60 border border-[#1e2035] rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3 font-mono uppercase tracking-wider">Quick Login (Demo)</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Borrower', email: 'borrower@lms.com', pass: 'Borrow@123' },
              { label: 'Admin', email: 'admin@lms.com', pass: 'Admin@123' },
              { label: 'Sales', email: 'sales@lms.com', pass: 'Sales@123' },
              { label: 'Sanction', email: 'sanction@lms.com', pass: 'Sanction@123' },
              { label: 'Disburse', email: 'disbursement@lms.com', pass: 'Disburse@123' },
              { label: 'Collection', email: 'collection@lms.com', pass: 'Collect@123' },
            ].map((d) => (
              <button
                key={d.label}
                onClick={() => fillDemo(d.email, d.pass)}
                className="text-xs text-slate-400 hover:text-purple-400 bg-[#0d0d1a] hover:bg-purple-500/10 border border-[#2d3748] hover:border-purple-500/50 rounded-lg px-3 py-2 transition-all font-mono text-left"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
