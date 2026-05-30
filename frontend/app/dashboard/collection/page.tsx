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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Collection — Repayments</h1>
        <p className="text-slate-400 text-sm">Record and track borrower repayments</p>
      </div>

      <div className="bg-[#13131f] border border-[#1e2035] rounded-xl px-5 py-3 mb-6 inline-flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-slate-300 text-sm">
          <span className="text-orange-400 font-bold">{loans.length}</span> active loans
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Loan list */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-slate-400 text-sm">No active loans</p>
            </div>
          ) : (
            loans.map((loan) => {
              const pct = Math.min(100, Math.round((loan.totalPaid / loan.loanConfig.totalRepayment) * 100));
              return (
                <div
                  key={loan._id}
                  onClick={() => handleSelectLoan(loan)}
                  className={`bg-[#13131f] border rounded-xl p-4 cursor-pointer transition-all hover:border-orange-500/50 ${
                    selected?._id === loan._id ? 'border-orange-500 bg-orange-500/5' : 'border-[#1e2035]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-semibold text-sm">{loan.borrower.name}</p>
                    <span className="text-orange-400 font-mono text-sm font-bold">{formatCurrency(loan.loanConfig.amount)}</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-3">{loan.borrower.email}</p>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Outstanding</span>
                      <span className="text-slate-300 font-mono">{formatCurrency(loan.outstandingBalance)}</span>
                    </div>
                    <div className="w-full bg-[#1e2035] rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-slate-600 mt-1">{pct}% repaid</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              {/* Loan summary */}
              <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 animate-fade-in">
                <h2 className="text-lg font-bold text-white mb-4">Loan Summary</h2>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Repayment Progress</span>
                    <span className="text-orange-400 font-semibold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-[#1e2035] rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Repayment', value: formatCurrency(selected.loanConfig.totalRepayment), color: 'text-white' },
                    { label: 'Amount Paid', value: formatCurrency(selected.totalPaid), color: 'text-green-400' },
                    { label: 'Outstanding', value: formatCurrency(selected.outstandingBalance), color: 'text-orange-400' },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#0d0d1a] rounded-xl p-3 border border-[#2d3748] text-center">
                      <p className={`text-base font-bold font-mono ${item.color}`}>{item.value}</p>
                      <p className="text-slate-500 text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Record payment */}
              <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4">Record Payment</h2>
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      UTR Number <span className="text-slate-500 text-xs">(must be unique)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.utrNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, utrNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                      placeholder="e.g. UTR123456789012"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Amount (₹) <span className="text-slate-500 text-xs">max {formatCurrency(selected.outstandingBalance)}</span>
                      </label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                        placeholder="0"
                        min={1}
                        max={selected.outstandingBalance}
                        step={0.01}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Payment Date</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-orange-500/20"
                  >
                    {processing ? 'Recording...' : '💰 Record Payment'}
                  </button>
                </form>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
                  <h2 className="text-base font-bold text-white mb-4">Payment History</h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between bg-[#0d0d1a] rounded-xl px-4 py-3 border border-[#2d3748]"
                      >
                        <div>
                          <p className="text-xs font-mono text-purple-400 font-semibold">{p.utrNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(p.paymentDate)} · by {p.recordedBy?.name || 'Unknown'}
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
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-slate-400">Select a loan to record payments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
