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
  loanConfig: { amount: number; tenure: number; totalRepayment: number };
  personalDetails: { fullName: string };
  borrower: { name: string; email: string; phone?: string };
  totalPaid: number;
  outstandingBalance: number;
  disbursedAt?: string;
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: { name: string };
}

export default function CollectionPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    utrNumber: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user && !['admin', 'collection'].includes(user.role)) router.push('/dashboard');
  }, [user, router]);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await api.get('/loans?status=disbursed');
      setLoans(data.loans);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const loadPayments = async (loanId: string) => {
    try {
      const { data } = await api.get(`/payments/loan/${loanId}`);
      setPayments(data.payments);
    } catch {
      setPayments([]);
    }
  };

  const handleSelectLoan = (loan: Loan) => {
    setSelected(loan);
    loadPayments(loan._id);
    setPaymentForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const amount = Number(paymentForm.amount);
    if (!paymentForm.utrNumber.trim()) {
      toast.error('UTR number is required');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (amount > selected.outstandingBalance) {
      toast.error(`Amount cannot exceed outstanding balance of ${formatCurrency(selected.outstandingBalance)}`);
      return;
    }

    setProcessing(true);
    try {
      const { data } = await api.post('/payments', {
        loanId: selected._id,
        utrNumber: paymentForm.utrNumber.trim(),
        amount,
        paymentDate: paymentForm.paymentDate,
      });

      toast.success(data.message);
      setPaymentForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });

      // Refresh loans and payments
      await fetchLoans();

      // If loan was closed, deselect
      if (data.loan.status === 'closed') {
        setSelected(null);
        setPayments([]);
      } else {
        // Update selected loan's balance
        setSelected((prev) =>
          prev ? { ...prev, totalPaid: data.loan.totalPaid, outstandingBalance: data.loan.outstandingBalance } : null
        );
        await loadPayments(selected._id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const progressPct = selected
    ? Math.min(100, Math.round((selected.totalPaid / selected.loanConfig.totalRepayment) * 100))
    : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">Collection — Repayments</h1>
        <p className="text-slate-400 text-sm">Record and track borrower repayments and outstanding balances</p>
      </div>

      {/* Status Badge */}
      <div className="glass bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/20 rounded-xl px-4 py-3 inline-flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-slate-300 text-sm"><span className="text-orange-400 font-semibold">{loans.length}</span> active loans</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Loans List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading active loans...</p>
              </div>
            </div>
          ) : loans.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-slate-400 text-sm font-medium">No active loans to collect</p>
            </div>
          ) : (
            loans.map((loan) => {
              const pct = Math.min(100, Math.round((loan.totalPaid / loan.loanConfig.totalRepayment) * 100));
              return (
                <div
                  key={loan._id}
                  onClick={() => handleSelectLoan(loan)}
                  className={`card cursor-pointer transition-all ${
                    selected?._id === loan._id 
                      ? 'border-orange-500/50 bg-orange-500/10 shadow-glow-sm' 
                      : 'hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{loan.borrower.name}</p>
                      <p className="text-slate-500 text-xs truncate">{loan.borrower.email}</p>
                    </div>
                    <span className="text-orange-400 font-mono text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(loan.loanConfig.amount)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Outstanding</span>
                      <span className="text-orange-300 font-semibold font-mono">{formatCurrency(loan.outstandingBalance)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-slate-600">{pct}% repaid</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              {/* Loan Summary */}
              <div className="glass rounded-2xl p-6 animate-scale-in space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📊</span> Loan Summary
                </h2>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Repayment Progress</span>
                    <span className="text-orange-400 font-semibold text-lg">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment), color: 'text-white', icon: '💰' },
                    { label: 'Amount Paid', value: formatCurrency(selected.totalPaid), color: 'text-green-400', icon: '✅' },
                    { label: 'Outstanding', value: formatCurrency(selected.outstandingBalance), color: 'text-orange-400', icon: '⏳' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:border-white/20 transition-colors">
                      <p className="text-2xl mb-1">{item.icon}</p>
                      <p className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-slate-500 text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Record Payment Form */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>💳</span> Record Payment
                </h2>
                
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  {/* UTR Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
                      UTR Number <span className="text-slate-600">(must be unique)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.utrNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, utrNumber: e.target.value.toUpperCase() })}
                      className="input font-mono uppercase"
                      placeholder="e.g. UTR123456789012"
                      required
                    />
                  </div>

                  {/* Amount & Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
                        Amount (₹) <span className="text-slate-600">max {formatCurrency(selected.outstandingBalance)}</span>
                      </label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="input"
                        placeholder="0"
                        min={1}
                        max={selected.outstandingBalance}
                        step={0.01}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Payment Date</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="btn btn-primary w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 disabled:opacity-50"
                  >
                    {processing ? 'Recording Payment...' : '💰 Record Payment'}
                  </button>
                </form>
              </div>

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="glass rounded-2xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📜</span> Payment History
                  </h2>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:border-white/20 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-mono text-purple-400 font-semibold">{p.utrNumber}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(p.paymentDate)} · by <span className="text-slate-400">{p.recordedBy?.name || 'Unknown'}</span>
                          </p>
                        </div>
                        <p className="text-green-400 font-bold font-mono text-sm">{formatCurrency(p.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">💰</p>
              <p className="text-slate-400 font-medium">Select a loan to record payments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
