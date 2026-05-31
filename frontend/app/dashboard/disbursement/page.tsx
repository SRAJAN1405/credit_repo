'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Loan {
  _id: string;
  status: string;
  loanConfig: { amount: number; tenure: number; totalRepayment: number; simpleInterest: number };
  personalDetails: { fullName: string; pan: string };
  borrower: { name: string; email: string; phone?: string };
  sanctionedAt?: string;
  createdAt: string;
}

export default function DisbursementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && !['admin', 'disbursement'].includes(user.role)) router.push('/dashboard');
  }, [user, router]);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await api.get('/loans?status=sanctioned');
      setLoans(data.loans);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleDisburse = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.patch(`/loans/${selected._id}/disburse`, {});
      toast.success('Loan disbursed! Funds released. 💳');
      setSelected(null);
      await fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Disbursement failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">Disbursement — Fund Release</h1>
        <p className="text-slate-400 text-sm">Release funds for sanctioned loans to borrowers</p>
      </div>

      {/* Status Badge */}
      <div className="glass bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20 rounded-xl px-4 py-3 inline-flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-slate-300 text-sm"><span className="text-purple-400 font-semibold">{loans.length}</span> loans ready for disbursement</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Loans List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading sanctioned loans...</p>
              </div>
            </div>
          ) : loans.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-slate-400 text-sm font-medium">All clear! No sanctioned loans pending</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => setSelected(loan)}
                className={`card cursor-pointer transition-all ${
                  selected?._id === loan._id 
                    ? 'border-purple-500/50 bg-purple-500/10 shadow-glow-sm' 
                    : 'hover:border-purple-500/30'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{loan.borrower.name}</p>
                    <p className="text-slate-500 text-xs truncate">{loan.borrower.email}</p>
                    {loan.sanctionedAt && (
                      <p className="text-green-400 text-xs mt-2 font-medium">✅ Sanctioned {formatDate(loan.sanctionedAt)}</p>
                    )}
                  </div>
                  <span className="text-purple-400 font-mono text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(loan.loanConfig.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Disburse Panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass rounded-2xl p-6 animate-scale-in space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Release Funds
              </h2>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Borrower Name', value: selected.borrower.name, icon: '👤' },
                  { label: 'PAN', value: selected.personalDetails.pan, mono: true, icon: '🆔' },
                  { label: 'Loan Amount', value: formatCurrency(selected.loanConfig.amount), icon: '💵', highlight: true },
                  { label: 'Tenure', value: `${selected.loanConfig.tenure} days`, icon: '📅' },
                  { label: 'Simple Interest', value: formatCurrency(selected.loanConfig.simpleInterest), icon: '📈' },
                  { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment), icon: '✅' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-3.5 border transition-colors ${
                    item.highlight 
                      ? 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}>
                    <p className="text-slate-500 text-xs font-semibold mb-1.5">{item.label}</p>
                    <p className={`text-white text-sm font-medium ${item.mono ? 'font-mono' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="glass bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm font-semibold mb-2 flex items-center gap-2">
                  ⚠️ Confirm Disbursement
                </p>
                <p className="text-yellow-300/80 text-xs leading-relaxed">
                  This will release <span className="font-bold text-yellow-300">{formatCurrency(selected.loanConfig.amount)}</span> to {selected.borrower.name}. This action cannot be undone.
                </p>
              </div>

              {/* Disburse Button */}
              <button
                onClick={handleDisburse}
                disabled={processing}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing Disbursement...' : '💳 Release Funds Now'}
              </button>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">💳</p>
              <p className="text-slate-400 font-medium">Select a sanctioned loan to release funds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
