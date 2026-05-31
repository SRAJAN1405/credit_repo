'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Calendar, IndianRupee, Clock, CheckCircle2,
  XCircle, Activity, FileText, ChevronRight, Sparkles,
  ArrowRight, CreditCard, ShieldAlert, Check, User, LogOut,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, LOAN_STATUS_LABELS } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  border: string;
  bg: string;
  text: string;
}

// ─── Motion Variants ──────────────────────────────────────────────────────────
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const detailVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, x: -10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ─── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(status: string): StatusConfig {
  const base = LOAN_STATUS_LABELS?.[status] ?? { label: status };
  const label = (base as { label: string }).label ?? status;

  switch (status) {
    case 'applied':
      return { label, icon: <Clock size={12} />, border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' };
    case 'sanctioned':
      return { label, icon: <CheckCircle2 size={12} />, border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    case 'disbursed':
      return { label, icon: <IndianRupee size={12} />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    case 'closed':
      return { label, icon: <Check size={12} />, border: 'border-zinc-600/40', bg: 'bg-zinc-800/60', text: 'text-zinc-400' };
    case 'rejected':
      return { label, icon: <XCircle size={12} />, border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' };
    default:
      return { label, icon: <Activity size={12} />, border: 'border-zinc-700', bg: 'bg-zinc-800', text: 'text-zinc-300' };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const sc = getStatusConfig(status);
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider border rounded-lg',
        size === 'lg' ? 'text-xs px-3.5 py-1.5' : 'text-[10px] px-2.5 py-1',
        sc.border, sc.bg, sc.text,
      ].join(' ')}
    >
      {sc.icon}
      {sc.label}
    </span>
  );
}

function StatCard({ label, value, color = 'text-zinc-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">{label}</p>
      <p className={`text-base font-bold font-mono tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-5">
      {icon} {children}
    </p>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center max-w-sm mx-auto"
    >
      <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 shadow-[0_0_32px_rgba(139,92,246,0.12)]">
        <Wallet size={34} className="text-violet-400" />
      </div>
      <h2 className="text-2xl font-bold text-zinc-50 mb-2">No Loans Yet</h2>
      <p className="text-sm text-zinc-500 leading-relaxed mb-8">
        You haven't applied for any loans. Get started with a quick application and instant processing.
      </p>
      <Link
        href="/borrower/apply"
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_32px_rgba(124,58,237,0.45)]"
      >
        Apply Now <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
}

// ─── Placeholder when no loan is selected ─────────────────────────────────────
function DetailPlaceholder() {
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[520px] flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-800/60 bg-zinc-900/20 p-10"
    >
      <div className="w-14 h-14 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-4 border border-zinc-700/40">
        <Wallet size={24} className="text-zinc-600" />
      </div>
      <h3 className="text-base font-bold text-zinc-300 mb-1.5">Select an Application</h3>
      <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
        Pick a loan from the list to view its details, timeline, and payment history.
      </p>
    </motion.div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-9 h-9 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 animate-pulse">Loading portfolio…</p>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: 'createdAt',    label: 'Applied',    color: 'bg-blue-500' },
  { key: 'sanctionedAt', label: 'Sanctioned', color: 'bg-amber-500' },
  { key: 'disbursedAt',  label: 'Disbursed',  color: 'bg-emerald-500' },
  { key: 'closedAt',     label: 'Closed',     color: 'bg-zinc-400' },
] as const;

function Timeline({ loan }: { loan: Loan }) {
  return (
    <div>
      <SectionLabel icon={<Clock size={12} />}>Timeline</SectionLabel>
      <div className="relative space-y-5 pl-7">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-zinc-700 to-transparent" />

        {TIMELINE_STEPS.map(({ key, label, color }) => {
          const date = loan[key as keyof Loan] as string | undefined;
          const active = !!date;
          return (
            <div key={key} className={`relative flex items-start gap-4 ${active ? '' : 'opacity-35'}`}>
              <div
                className={[
                  'absolute -left-7 mt-0.5 w-[18px] h-[18px] rounded-full border-[3px] border-zinc-950 z-10 shrink-0',
                  active ? color : 'bg-zinc-800',
                ].join(' ')}
              />
              <div>
                <p className="text-sm font-semibold text-zinc-200 leading-none">{label}</p>
                <p className="text-[11px] text-zinc-600 font-mono mt-1">
                  {date ? formatDate(date) : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payments list ────────────────────────────────────────────────────────────
function PaymentList({ payments }: { payments: Payment[] }) {
  return (
    <div>
      <SectionLabel icon={<Activity size={12} />}>Transaction History</SectionLabel>
      {payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 p-8 text-center">
          <p className="text-sm text-zinc-600">No payments recorded yet.</p>
        </div>
      ) : (
        <div
          className="space-y-2.5 max-h-64 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
        >
          {payments.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-4 py-3 hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check size={13} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Payment Received</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5">UTR: {p.utrNumber}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold font-mono text-emerald-400">+{formatCurrency(p.amount)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(p.paymentDate)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loan detail panel ────────────────────────────────────────────────────────
function LoanDetail({ loan, payments }: { loan: Loan; payments: Payment[] }) {
  const pctPaid = loan.loanConfig.totalRepayment > 0
    ? Math.round((loan.totalPaid / loan.loanConfig.totalRepayment) * 100)
    : 0;

  return (
    <motion.div
      key={loan._id}
      variants={detailVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
    >
      {/* Top highlight */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      <div className="p-6 sm:p-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-1.5">
              <CreditCard size={11} /> Loan Amount
            </p>
            <p className="text-4xl font-extrabold font-mono tabular-nums text-zinc-50 tracking-tight">
              {formatCurrency(loan.loanConfig.amount)}
            </p>
            <p className="text-xs text-zinc-500 mt-1.5">{loan.personalDetails.fullName}</p>
          </div>
          <StatusBadge status={loan.status} size="lg" />
        </div>

        {/* Rejection alert */}
        {loan.status === 'rejected' && loan.rejectionReason && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 p-4">
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Application Declined</p>
              <p className="text-sm text-red-300/70 leading-relaxed">{loan.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Repayment progress (disbursed loans only) */}
        {loan.status === 'disbursed' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Repayment Progress</span>
              <span className="font-mono font-bold text-emerald-400">{pctPaid}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${pctPaid}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Tenure" value={`${loan.loanConfig.tenure} days`} />
          <StatCard label="Interest Rate" value="12% p.a." />
          <StatCard label="Total Interest" value={formatCurrency(loan.loanConfig.simpleInterest)} color="text-amber-400" />
          <StatCard label="Total Repayment" value={formatCurrency(loan.loanConfig.totalRepayment)} />
          <StatCard label="Amount Paid" value={formatCurrency(loan.totalPaid)} color="text-emerald-400" />
          <StatCard label="Outstanding" value={formatCurrency(loan.outstandingBalance)} color="text-violet-400" />
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/60" />

        {/* Bottom two-col: timeline + payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Timeline loan={loan} />
          <PaymentList payments={payments} />
        </div>

      </div>
    </motion.div>
  );
}

// ─── Loan card (list item) ────────────────────────────────────────────────────
function LoanCard({ loan, isSelected, onClick }: { loan: Loan; isSelected: boolean; onClick: () => void }) {
  const pct = loan.loanConfig.totalRepayment > 0
    ? Math.round((loan.totalPaid / loan.loanConfig.totalRepayment) * 100)
    : 0;

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={[
        'relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-200 p-4',
        isSelected
          ? 'border-violet-500/50 bg-zinc-900 shadow-[0_0_24px_rgba(139,92,246,0.12)]'
          : 'border-zinc-800/70 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70',
      ].join(' ')}
    >
      {/* Active indicator bar */}
      {isSelected && (
        <motion.div
          layoutId="loan-indicator"
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-500 to-indigo-600 rounded-r-full"
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="pl-1">
          <p className="text-xl font-bold font-mono tabular-nums text-zinc-50">
            {formatCurrency(loan.loanConfig.amount)}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{loan.loanConfig.tenure} days tenure</p>
        </div>
        <StatusBadge status={loan.status} />
      </div>

      {/* Progress bar for disbursed */}
      {loan.status === 'disbursed' && (
        <div className="mb-3">
          <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-emerald-500 font-mono mt-1">{pct}% repaid</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <span className="text-[11px] text-zinc-600 flex items-center gap-1.5">
          <Calendar size={11} /> {formatDate(loan.createdAt)}
        </span>
        <ChevronRight size={13} className={`transition-colors ${isSelected ? 'text-violet-400' : 'text-zinc-700'}`} />
      </div>
    </motion.div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function BorrowerLoansPage() {
  const router = useRouter();
  const { user, isLoading, initAuth, logout } = useAuthStore();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetchingLoans, setFetchingLoans] = useState(true);

  useEffect(() => { initAuth(); }, [initAuth]);

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

  useEffect(() => { if (user) fetchLoans(); }, [user, fetchLoans]);

  const handleSelectLoan = async (loan: Loan) => {
    setSelectedLoan(loan);
    setPayments([]);
    try {
      const { data } = await api.get(`/payments/loan/${loan._id}`);
      setPayments(data.payments ?? []);
    } catch {
      setPayments([]);
    }
  };

  const canApply = !loans.some((l) => ['applied', 'sanctioned', 'disbursed'].includes(l.status));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-violet-500/20 selection:text-violet-200">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-48 -right-32 w-[640px] h-[640px] bg-violet-600/8 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-[0_0_14px_rgba(124,58,237,0.4)]">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-100 tracking-tight">LoanMS</span>
            <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700 border-l border-zinc-800 pl-3">
              Borrower
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                <User size={11} className="text-zinc-400" />
              </div>
              <span className="text-xs font-medium text-zinc-300">{user?.name}</span>
            </div>

            {canApply && (
              <Link
                href="/borrower/apply"
                className="hidden sm:inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-all shadow-[0_0_16px_rgba(124,58,237,0.3)]"
              >
                Apply <ArrowRight size={12} />
              </Link>
            )}

            <button
              onClick={() => { logout(); router.push('/auth/login'); }}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10">

        {fetchingLoans ? (
          <PageLoader />
        ) : loans.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── Loan list (4 cols) ── */}
            <aside className="lg:col-span-4 space-y-3">
              {/* List header */}
              <div className="flex items-center justify-between px-0.5 mb-1">
                <SectionLabel icon={<FileText size={11} />}>
                  My Applications
                </SectionLabel>
                <span className="text-[10px] font-mono font-bold text-zinc-700 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  {loans.length}
                </span>
              </div>

              <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2.5">
                {loans.map((loan) => (
                  <LoanCard
                    key={loan._id}
                    loan={loan}
                    isSelected={selectedLoan?._id === loan._id}
                    onClick={() => handleSelectLoan(loan)}
                  />
                ))}
              </motion.div>

              {/* Mobile apply CTA */}
              {canApply && (
                <Link
                  href="/borrower/apply"
                  className="sm:hidden mt-1 flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                >
                  Apply for a Loan <ArrowRight size={14} />
                </Link>
              )}
            </aside>

            {/* ── Detail panel (8 cols) ── */}
            <section className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedLoan ? (
                  <LoanDetail key={selectedLoan._id} loan={selectedLoan} payments={payments} />
                ) : (
                  <DetailPlaceholder key="placeholder" />
                )}
              </AnimatePresence>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}