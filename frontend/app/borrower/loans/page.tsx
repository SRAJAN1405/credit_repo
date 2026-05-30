'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, LOAN_STATUS_LABELS } from '@/lib/utils';

interface Loan {
  _id: string;
  status: string;
  loanConfig: {
    amount: number;
    tenure: number;
    interestRate: number;
    simpleInterest: number;
    totalRepayment: number;
  };
  personalDetails: { fullName: string };
  totalPaid: number;
  outstandingBalance: number;
  rejectionReason?: string;
  createdAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
}

export default function BorrowerLoansPage() {
  const router = useRouter();
  const { user, isLoading, initAuth, logout } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetchingLoans, setFetchingLoans] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'borrower') router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await api.get('/loans/my-loans');
      setLoans(data.loans);
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setFetchingLoans(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchLoans();
  }, [user, fetchLoans]);

  const loadPayments = async (loanId: string) => {
    try {
      const { data } = await api.get(`/payments/loan/${loanId}`);
      setPayments(data.payments);
    } catch {
      setPayments([]);
    }
  };

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    loadPayments(loan._id);
  };

  const statusInfo = (status: string) => LOAN_STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  const canApply = !loans.some((l) => ['applied', 'sanctioned', 'disbursed'].includes(l.status));

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* Navbar */}
      <nav className="bg-[#13131f] border-b border-[#1e2035] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">L</div>
            <span className="font-semibold text-white">LoanMS</span>
            <span className="text-[#2d3748]">|</span>
            <span className="text-slate-400 text-sm">Borrower Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">{user?.name}</span>
            {canApply && (
              <Link href="/borrower/apply" className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Apply for Loan
              </Link>
            )}
            <button onClick={() => { logout(); router.push('/auth/login'); }} className="text-slate-500 hover:text-red-400 text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {fetchingLoans ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">💸</p>
            <h2 className="text-xl font-bold text-white mb-2">No Loan Applications Yet</h2>
            <p className="text-slate-400 mb-6">Apply for your first loan and get funds quickly</p>
            <Link href="/borrower/apply" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 py-3 rounded-xl inline-block transition-all shadow-lg shadow-purple-500/25">
              Apply Now
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Loan list */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">Your Applications</h2>
              {loans.map((loan) => {
                const si = statusInfo(loan.status);
                return (
                  <div
                    key={loan._id}
                    onClick={() => handleSelectLoan(loan)}
                    className={`bg-[#13131f] border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-500/50 ${
                      selectedLoan?._id === loan._id ? 'border-purple-500 bg-purple-500/5' : 'border-[#1e2035]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{formatCurrency(loan.loanConfig.amount)}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{loan.loanConfig.tenure} days</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${si.color}`}>
                        {si.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(loan.createdAt)}</div>
                    {loan.status === 'disbursed' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Repaid</span>
                          <span className="text-slate-300">{Math.round((loan.totalPaid / loan.loanConfig.totalRepayment) * 100)}%</span>
                        </div>
                        <div className="w-full bg-[#1e2035] rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (loan.totalPaid / loan.loanConfig.totalRepayment) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Loan detail */}
            <div className="lg:col-span-3">
              {selectedLoan ? (
                <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-slate-400 text-sm">Loan Amount</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(selectedLoan.loanConfig.amount)}</p>
                    </div>
                    <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${statusInfo(selectedLoan.status).color}`}>
                      {statusInfo(selectedLoan.status).label}
                    </span>
                  </div>

                  {selectedLoan.status === 'rejected' && selectedLoan.rejectionReason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                      <p className="text-red-400 font-semibold text-sm mb-1">Rejection Reason</p>
                      <p className="text-red-300 text-sm">{selectedLoan.rejectionReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Tenure', value: `${selectedLoan.loanConfig.tenure} days` },
                      { label: 'Interest Rate', value: '12% p.a.' },
                      { label: 'Simple Interest', value: formatCurrency(selectedLoan.loanConfig.simpleInterest) },
                      { label: 'Total Repayment', value: formatCurrency(selectedLoan.loanConfig.totalRepayment) },
                      { label: 'Amount Paid', value: formatCurrency(selectedLoan.totalPaid) },
                      { label: 'Outstanding', value: formatCurrency(selectedLoan.outstandingBalance) },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#0d0d1a] rounded-xl p-3 border border-[#2d3748]">
                        <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                        <p className="text-white font-semibold text-sm font-mono">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-mono">Timeline</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-slate-400">Applied:</span>
                        <span className="text-white">{formatDate(selectedLoan.createdAt)}</span>
                      </div>
                      {selectedLoan.sanctionedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-slate-400">Sanctioned:</span>
                          <span className="text-white">{formatDate(selectedLoan.sanctionedAt)}</span>
                        </div>
                      )}
                      {selectedLoan.disbursedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-slate-400">Disbursed:</span>
                          <span className="text-white">{formatDate(selectedLoan.disbursedAt)}</span>
                        </div>
                      )}
                      {selectedLoan.closedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-slate-400">Closed:</span>
                          <span className="text-white">{formatDate(selectedLoan.closedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payments */}
                  {payments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-mono">Payment History</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {payments.map((p) => (
                          <div key={p._id} className="flex items-center justify-between bg-[#0d0d1a] rounded-lg px-3 py-2.5 border border-[#2d3748]">
                            <div>
                              <p className="text-xs font-mono text-slate-400">{p.utrNumber}</p>
                              <p className="text-xs text-slate-500">{formatDate(p.paymentDate)}</p>
                            </div>
                            <p className="text-green-400 font-semibold text-sm font-mono">{formatCurrency(p.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-slate-400">Select a loan to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
