'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, User, CreditCard, Calendar, IndianRupee, Briefcase,
  UploadCloud, FileText, ArrowRight, ArrowLeft, Loader2, Rocket,
  AlertCircle, CheckCircle2, ChevronRight, Shield, Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { calculateLoan, formatCurrency } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

interface PersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: string;
  employmentMode: string;
}

// ─── Motion Variants ────────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' } },
};

const containerVariants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Improved UI Components ─────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold tracking-[0.08em] text-slate-400 uppercase mb-2.5">
      {children}
    </label>
  );
}

function InputWrapper({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
        {icon}
      </span>
      {children}
    </div>
  );
}

const inputClass =
  'w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-violet-500 ' +
  'rounded-2xl pl-11 pr-5 py-4 text-base text-zinc-100 outline-none transition-all duration-200 ' +
  'placeholder:text-zinc-600 focus:ring-2 focus:ring-violet-500/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1 as Step, label: 'Auth' },
  { num: 2 as Step, label: 'Details' },
  { num: 3 as Step, label: 'Documents' },
  { num: 4 as Step, label: 'Configure' },
];

function Stepper({ current }: { current: Step }) {
  return (
    <nav aria-label="Application steps" className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  done
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : active
                    ? 'bg-violet-600 text-white shadow-[0_0_18px_rgba(139,92,246,0.45)] ring-2 ring-violet-500/30 ring-offset-2 ring-offset-zinc-950'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-600',
                ].join(' ')}
              >
                {done ? <Check size={14} strokeWidth={3} /> : s.num}
              </div>
              <span
                className={[
                  'text-[10px] font-bold tracking-widest uppercase',
                  done ? 'text-emerald-500' : active ? 'text-violet-400' : 'text-zinc-700',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-3 mt-[-18px] bg-zinc-800 overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: '0%' }}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Range Slider ─────────────────────────────────────────────────────────────
function RangeSlider({
  label, value, min, max, step, format, color, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; color: 'violet' | 'indigo'; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const track = color === 'violet' ? '#7c3aed' : '#4f46e5';

  return (
    <SectionCard>
      <div className="flex justify-between items-baseline mb-5">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-xl font-bold text-zinc-100 tabular-nums font-mono">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        style={{
          background: `linear-gradient(to right, ${track} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
          accentColor: track,
        }}
      />
      <div className="flex justify-between text-xs font-mono text-zinc-600 mt-4">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </SectionCard>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all duration-200"
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}

function PrimaryButton({
  onClick, disabled, loading, loadingLabel, children,
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  loadingLabel?: string; children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl text-base font-semibold bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30 transition-all duration-200"
    >
      {loading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>{children}</>
      )}
    </motion.button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ApplyPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [salarySlipFile, setSalarySlipFile] = useState<File | null>(null);
  const [salarySlipPath, setSalarySlipPath] = useState('');
  const [uploading, setUploading] = useState(false);

  const [loanAmount, setLoanAmount] = useState(200000);
  const [tenure, setTenure] = useState(180);

  const [personal, setPersonal] = useState<PersonalDetails>({
    fullName: '',
    pan: '',
    dateOfBirth: '',
    monthlySalary: '',
    employmentMode: 'salaried',
  });

  const loanCalc = calculateLoan(loanAmount, tenure);

  useEffect(() => { initAuth(); }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'borrower') router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleBRECheck = async () => {
    if (!personal.fullName || !personal.pan || !personal.dateOfBirth || !personal.monthlySalary) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    setBreErrors([]);

    try {
      await api.post('/loans/check-eligibility', {
        dateOfBirth: personal.dateOfBirth,
        monthlySalary: Number(personal.monthlySalary),
        pan: personal.pan,
        employmentMode: personal.employmentMode,
      });
      toast.success('Eligibility check passed!');
      setStep(3);
    } catch (err: any) {
      const errors = err.response?.data?.errors || [err.response?.data?.message || 'Check failed'];
      setBreErrors(errors);
      toast.error('Eligibility check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!salarySlipFile) return toast.error('Please select a file');
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('salarySlip', salarySlipFile);
      const { data } = await api.post('/loans/upload-salary-slip', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalarySlipPath(data.filename);
      toast.success('Salary slip uploaded successfully');
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await api.post('/loans/apply', {
        ...personal,
        monthlySalary: Number(personal.monthlySalary),
        salarySlip: salarySlipPath,
        amount: loanAmount,
        tenure,
      });
      toast.success('Loan application submitted successfully!');
      router.push('/borrower/loans');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-violet-500/20">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 right-0 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LoanMS</span>
          </div>
          <button
            onClick={() => router.push('/borrower/loans')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            My Loans <ChevronRight size={16} />
          </button>
        </motion.header>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Loan Application</h1>
        <p className="text-zinc-500 mb-8">Complete all steps to submit your application</p>

        <Stepper current={step} />

        {/* Main Card */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div key="step1" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="space-y-6">
                    <SectionCard className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Shield size={28} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Identity Verified</p>
                        <p className="text-sm text-zinc-500">Signed in as {user?.name}</p>
                      </div>
                      <span className="text-emerald-500 text-sm font-bold">ACTIVE</span>
                    </SectionCard>

                    <PrimaryButton onClick={() => setStep(2)}>
                      Continue to Personal Details <ArrowRight size={18} />
                    </PrimaryButton>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 - Personal Details (Improved) */}
              {step === 2 && (
                <motion.div key="step2" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                  <h2 className="text-2xl font-bold mb-1">Personal Details</h2>
                  <p className="text-zinc-500 mb-8">Used for eligibility verification</p>

                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                    {/* Full Name */}
                    <div>
                      <FieldLabel>Full Name (as per PAN)</FieldLabel>
                      <InputWrapper icon={<User size={18} />}>
                        <input
                          type="text"
                          value={personal.fullName}
                          className={inputClass}
                          placeholder="Rahul Sharma"
                          onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                        />
                      </InputWrapper>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <FieldLabel>PAN Card Number</FieldLabel>
                        <InputWrapper icon={<CreditCard size={18} />}>
                          <input
                            type="text"
                            value={personal.pan}
                            maxLength={10}
                            className={`${inputClass} font-mono tracking-widest text-lg`}
                            placeholder="ABCDE1234F"
                            onChange={(e) => setPersonal({ ...personal, pan: e.target.value.toUpperCase() })}
                          />
                        </InputWrapper>
                      </div>

                      <div>
                        <FieldLabel>Date of Birth</FieldLabel>
                        <InputWrapper icon={<Calendar size={18} />}>
                          <input
                            type="date"
                            value={personal.dateOfBirth}
                            className={`${inputClass} py-4`}
                            onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                          />
                        </InputWrapper>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <FieldLabel>Monthly Salary (₹)</FieldLabel>
                        <InputWrapper icon={<IndianRupee size={18} />}>
                          <input
                            type="number"
                            value={personal.monthlySalary}
                            className={inputClass}
                            placeholder="50000"
                            onChange={(e) => setPersonal({ ...personal, monthlySalary: e.target.value })}
                          />
                        </InputWrapper>
                      </div>

                      <div>
                        <FieldLabel>Employment Type</FieldLabel>
                        <InputWrapper icon={<Briefcase size={18} />}>
                          <select
                            value={personal.employmentMode}
                            className={`${inputClass} py-4 text-base`}
                            onChange={(e) => setPersonal({ ...personal, employmentMode: e.target.value })}
                          >
                            <option value="salaried">Salaried</option>
                            <option value="self_employed">Self Employed</option>
                            <option value="unemployed">Unemployed</option>
                          </select>
                        </InputWrapper>
                      </div>
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                      {breErrors.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400"
                        >
                          {breErrors.map((err, i) => <p key={i}>{err}</p>)}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-4 pt-4">
                      <BackButton onClick={() => setStep(1)} />
                      <PrimaryButton
                        onClick={handleBRECheck}
                        loading={loading}
                        loadingLabel="Checking Eligibility..."
                      >
                        Check Eligibility <ArrowRight size={18} />
                      </PrimaryButton>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* STEP 3 - Document Upload */}
              {step === 3 && (
                <motion.div key="step3" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                  <h2 className="text-2xl font-bold mb-1">Proof of Income</h2>
                  <p className="text-zinc-500 mb-8">Upload your latest salary slip</p>

                  <label
                    htmlFor="fileInput"
                    className={`block rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                      salarySlipFile
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-zinc-700 hover:border-violet-500 hover:bg-zinc-900/50'
                    }`}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error('File size must be less than 5MB');
                          return;
                        }
                        setSalarySlipFile(file || null);
                      }}
                    />

                    {salarySlipFile ? (
                      <div className="flex flex-col items-center gap-4">
                        <FileText size={48} className="text-emerald-400" />
                        <div className="text-center">
                          <p className="font-semibold text-emerald-400">{salarySlipFile.name}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {(salarySlipFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-zinc-400">
                        <UploadCloud size={48} />
                        <p className="text-lg font-medium">Click to upload salary slip</p>
                        <p className="text-sm">PDF, JPG, PNG • Max 5 MB</p>
                      </div>
                    )}
                  </label>

                  <div className="flex gap-4 mt-8">
                    <BackButton onClick={() => setStep(2)} />
                    <PrimaryButton
                      onClick={handleFileUpload}
                      loading={uploading}
                      loadingLabel="Uploading..."
                      disabled={!salarySlipFile}
                    >
                      Upload & Continue <ArrowRight size={18} />
                    </PrimaryButton>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 - Loan Configuration */}
              {step === 4 && (
                <motion.div key="step4" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                  <h2 className="text-2xl font-bold mb-1">Customize Your Loan</h2>
                  <p className="text-zinc-500 mb-8">Choose amount and tenure</p>

                  <div className="space-y-6">
                    <RangeSlider
                      label="Loan Amount"
                      value={loanAmount}
                      min={50000}
                      max={500000}
                      step={10000}
                      format={formatCurrency}
                      color="violet"
                      onChange={setLoanAmount}
                    />

                    <RangeSlider
                      label="Tenure (Days)"
                      value={tenure}
                      min={30}
                      max={365}
                      step={5}
                      format={(v) => `${v} days`}
                      color="indigo"
                      onChange={setTenure}
                    />

                    {/* Summary */}
                    <SectionCard>
                      <p className="uppercase text-xs font-bold text-violet-400 mb-4">Repayment Summary</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Principal</span>
                          <span className="font-medium">{formatCurrency(loanCalc.principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Interest Rate</span>
                          <span className="font-medium">12% p.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Interest Amount</span>
                          <span className="font-medium">+ {formatCurrency(loanCalc.simpleInterest)}</span>
                        </div>
                        <div className="h-px bg-zinc-800 my-2" />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Repayment</span>
                          <span className="text-violet-400">{formatCurrency(loanCalc.totalRepayment)}</span>
                        </div>
                      </div>
                    </SectionCard>

                    <div className="flex gap-4 pt-4">
                      <BackButton onClick={() => setStep(3)} />
                      <PrimaryButton
                        onClick={handleApply}
                        loading={loading}
                        loadingLabel="Submitting Application..."
                      >
                        <Rocket size={20} /> Submit Application
                      </PrimaryButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          256-bit encrypted • Processed as per RBI guidelines
        </p>
      </div>
    </div>
  );
}