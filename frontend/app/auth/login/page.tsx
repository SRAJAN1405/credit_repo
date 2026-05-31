'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// Framer Motion Variants for staggering animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, initAuth, user, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
    toast.success('Demo credentials applied!', { icon: '✨' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070710] relative overflow-hidden px-4 selection:bg-purple-500/30">
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] right-[15%] w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        className="w-full max-w-md z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-white/10"
            >
              L
            </motion.div>
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              LoanMS
            </span>
          </div>
          <p className="text-slate-400/80 text-sm font-medium tracking-wide uppercase">Secure Access Portal</p>
        </motion.div>

        {/* Main Form Card (Glassmorphism) */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#11111d]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all placeholder:text-slate-600 focus:bg-black/40 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 text-white rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none transition-all placeholder:text-slate-600 focus:bg-black/40 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-2xl py-3.5 text-sm overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              {/* Button inner shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              
              <span className="flex items-center justify-center gap-2 relative z-10">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-white hover:text-purple-400 font-medium transition-colors underline decoration-white/20 underline-offset-4 hover:decoration-purple-400/50">
              Create one now
            </Link>
          </p>
        </motion.div>

        {/* Demo Credentials Drawer */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> 
              Quick Login
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { label: 'Borrower', email: 'borrower@lms.com', pass: 'Borrow@123', color: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400' },
              { label: 'Admin', email: 'admin@lms.com', pass: 'Admin@123', color: 'hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400' },
              { label: 'Sales', email: 'sales@lms.com', pass: 'Sales@123', color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400' },
              { label: 'Sanction', email: 'sanction@lms.com', pass: 'Sanction@123', color: 'hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400' },
              { label: 'Disburse', email: 'disbursement@lms.com', pass: 'Disburse@123', color: 'hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-400' },
              { label: 'Collection', email: 'collection@lms.com', pass: 'Collect@123', color: 'hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400' },
            ].map((d, i) => (
              <motion.button
                key={d.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fillDemo(d.email, d.pass)}
                className={`text-xs text-slate-400 bg-[#11111d]/50 backdrop-blur-sm border border-white/5 rounded-xl px-3 py-2.5 transition-colors font-medium flex items-center justify-between group ${d.color}`}
              >
                {d.label}
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </motion.button>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}