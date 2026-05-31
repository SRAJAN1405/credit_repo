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
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">Sanction — Loan Review</h1>
        <p className="text-slate-400 text-sm">Review and approve or reject loan applications for disbursement</p>
      </div>

      {/* Pending Badge */}
      <div className="glass bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20 rounded-xl px-4 py-3 inline-flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-slate-300 text-sm"><span className="text-yellow-400 font-semibold">{loans.length}</span> applications pending review</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading applications...</p>
              </div>
            </div>
          ) : loans.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-slate-400 text-sm font-medium">All clear! No pending applications</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => { setSelected(loan); setShowRejectForm(false); setRejectReason(''); }}
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
                    <p className="text-slate-600 text-xs mt-2">{formatDate(loan.createdAt)}</p>
                  </div>
                  <span className="text-purple-400 font-mono text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(loan.loanConfig.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass rounded-2xl p-6 animate-scale-in space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋</span> Application Review
              </h2>

              {/* Borrower Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', value: selected.personalDetails.fullName, icon: '👤' },
                  { label: 'PAN', value: selected.personalDetails.pan, mono: true, icon: '🆔' },
                  { label: 'Monthly Salary', value: formatCurrency(selected.personalDetails.monthlySalary), icon: '💰' },
                  { label: 'Employment', value: selected.personalDetails.employmentMode.replace('_', ' '), capitalize: true, icon: '🏢' },
                  { label: 'Loan Amount', value: formatCurrency(selected.loanConfig.amount), icon: '💵' },
                  { label: 'Tenure', value: `${selected.loanConfig.tenure} days`, icon: '📅' },
                  { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment), icon: '✅' },
                  { label: 'Applied On', value: formatDate(selected.createdAt), icon: '📝' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5 hover:border-white/20 transition-colors">
                    <p className="text-slate-500 text-xs font-semibold mb-1.5">{item.label}</p>
                    <p className={`text-white text-sm font-medium ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Salary Slip Link */}
              {selected.salarySlip && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/${selected.salarySlip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    📎 View Salary Slip Document
                  </a>
                </div>
              )}

              {/* Actions */}
              {!showRejectForm ? (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="btn btn-primary flex-1"
                  >
                    {processing ? 'Processing...' : '✅ Sanction Loan'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="btn-secondary flex-1 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
                  >
                    ❌ Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase">Rejection Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is being rejected..."
                      rows={3}
                      className="input resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectForm(false)} className="btn btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                      className="btn btn-primary flex-1 bg-red-600 hover:bg-red-500 from-red-600 to-red-600"
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-slate-400 font-medium">Select an application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
