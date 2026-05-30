'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface LoanBrief {
  _id: string;
  status: string;
  loanConfig: { amount: number; tenure: number; totalRepayment: number };
  personalDetails: { fullName: string; pan: string; monthlySalary: number; employmentMode: string };
  borrower: { name: string; email: string; phone?: string };
  createdAt: string;
  salarySlip?: string;
}

export default function SanctionPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LoanBrief | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && !['admin', 'sanction'].includes(user.role)) router.push('/dashboard');
  }, [user, router]);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await api.get('/loans?status=applied');
      setLoans(data.loans);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      await api.patch(`/loans/${selected._id}/sanction`, {
        action,
        rejectionReason: rejectReason,
      });
      toast.success(action === 'approve' ? 'Loan sanctioned! ✅' : 'Loan rejected');
      setSelected(null);
      setRejectReason('');
      setShowRejectForm(false);
      await fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Sanction — Loan Review</h1>
        <p className="text-slate-400 text-sm">Review and approve or reject loan applications</p>
      </div>

      <div className="bg-[#13131f] border border-[#1e2035] rounded-xl px-5 py-3 mb-6 inline-flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-slate-300 text-sm"><span className="text-yellow-400 font-bold">{loans.length}</span> applications pending review</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-slate-400 text-sm">No pending applications</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => { setSelected(loan); setShowRejectForm(false); setRejectReason(''); }}
                className={`bg-[#13131f] border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-500/50 ${selected?._id === loan._id ? 'border-purple-500 bg-purple-500/5' : 'border-[#1e2035]'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold text-sm">{loan.borrower.name}</p>
                  <span className="text-purple-400 font-mono text-sm font-bold">{formatCurrency(loan.loanConfig.amount)}</span>
                </div>
                <p className="text-slate-500 text-xs">{loan.borrower.email}</p>
                <p className="text-slate-500 text-xs mt-1">{formatDate(loan.createdAt)}</p>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-5">Application Review</h2>

              {/* Borrower info */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Full Name', value: selected.personalDetails.fullName },
                  { label: 'PAN', value: selected.personalDetails.pan, mono: true },
                  { label: 'Monthly Salary', value: formatCurrency(selected.personalDetails.monthlySalary) },
                  { label: 'Employment', value: selected.personalDetails.employmentMode.replace('_', ' '), capitalize: true },
                  { label: 'Loan Amount', value: formatCurrency(selected.loanConfig.amount) },
                  { label: 'Tenure', value: `${selected.loanConfig.tenure} days` },
                  { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment) },
                  { label: 'Applied On', value: formatDate(selected.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0d0d1a] rounded-xl p-3 border border-[#2d3748]">
                    <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                    <p className={`text-white text-sm font-medium ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Salary slip */}
              {selected.salarySlip && (
                <div className="mb-5">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/${selected.salarySlip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    📎 View Salary Slip
                  </a>
                </div>
              )}

              {/* Actions */}
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all"
                  >
                    {processing ? '...' : '✅ Sanction Loan'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 font-semibold rounded-xl py-3 text-sm transition-all"
                  >
                    ❌ Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectForm(false)} className="px-4 py-2.5 border border-[#2d3748] text-slate-400 rounded-xl text-sm hover:border-slate-500 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-all"
                    >
                      {processing ? '...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">👈</p>
              <p className="text-slate-400">Select an application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
