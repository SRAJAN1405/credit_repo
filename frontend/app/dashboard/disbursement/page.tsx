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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Disbursement — Fund Release</h1>
        <p className="text-slate-400 text-sm">Release funds for sanctioned loans</p>
      </div>

      <div className="bg-[#13131f] border border-[#1e2035] rounded-xl px-5 py-3 mb-6 inline-flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-slate-300 text-sm"><span className="text-purple-400 font-bold">{loans.length}</span> loans ready for disbursement</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-slate-400 text-sm">No sanctioned loans pending</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => setSelected(loan)}
                className={`bg-[#13131f] border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-500/50 ${selected?._id === loan._id ? 'border-purple-500 bg-purple-500/5' : 'border-[#1e2035]'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold text-sm">{loan.borrower.name}</p>
                  <span className="text-purple-400 font-mono text-sm font-bold">{formatCurrency(loan.loanConfig.amount)}</span>
                </div>
                <p className="text-slate-500 text-xs">{loan.borrower.email}</p>
                {loan.sanctionedAt && <p className="text-green-400 text-xs mt-1">Sanctioned {formatDate(loan.sanctionedAt)}</p>}
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-5">Disburse Loan</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Borrower', value: selected.borrower.name },
                  { label: 'PAN', value: selected.personalDetails.pan, mono: true },
                  { label: 'Loan Amount', value: formatCurrency(selected.loanConfig.amount) },
                  { label: 'Tenure', value: `${selected.loanConfig.tenure} days` },
                  { label: 'Simple Interest', value: formatCurrency(selected.loanConfig.simpleInterest) },
                  { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment) },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0d0d1a] rounded-xl p-3 border border-[#2d3748]">
                    <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                    <p className={`text-white text-sm font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5">
                <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Confirm Disbursement</p>
                <p className="text-yellow-300/70 text-xs">
                  This will release <span className="font-bold text-yellow-300">{formatCurrency(selected.loanConfig.amount)}</span> to the borrower.
                  This action cannot be undone.
                </p>
              </div>

              <button
                onClick={handleDisburse}
                disabled={processing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25"
              >
                {processing ? 'Processing...' : '💳 Release Funds'}
              </button>
            </div>
          ) : (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-slate-400">Select a loan to disburse funds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
