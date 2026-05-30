'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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

export default function ApplyPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 2 data
  const [personal, setPersonal] = useState<PersonalDetails>({
    fullName: '',
    pan: '',
    dateOfBirth: '',
    monthlySalary: '',
    employmentMode: 'salaried',
  });
  const [breErrors, setBreErrors] = useState<string[]>([]);

  // Step 3 data
  const [salarySlipFile, setSalarySlipFile] = useState<File | null>(null);
  const [salarySlipPath, setSalarySlipPath] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Step 4 data
  const [loanAmount, setLoanAmount] = useState(200000);
  const [tenure, setTenure] = useState(180);

  const loanCalc = calculateLoan(loanAmount, tenure);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'borrower') router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleBRECheck = async () => {
    if (!personal.fullName || !personal.pan || !personal.dateOfBirth || !personal.monthlySalary || !personal.employmentMode) {
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
      toast.success('Eligibility check passed! ✅');
      setStep(3);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: string[]; message?: string } } };
      const errors = error.response?.data?.errors || [error.response?.data?.message || 'Check failed'];
      setBreErrors(errors);
      toast.error('Eligibility check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!salarySlipFile) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('salarySlip', salarySlipFile);
      const { data } = await api.post('/loans/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalarySlipPath(data.filename);
      toast.success('Salary slip uploaded!');
      setStep(4);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Upload failed');
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
      toast.success('Loan application submitted! 🎉');
      router.push('/borrower/loans');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = error.response?.data?.message || 'Application failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Auth' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Documents' },
    { num: 4, label: 'Configure' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d1a] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/25">
              L
            </div>
            <span className="font-semibold text-white">LoanMS</span>
          </div>
          <button
            onClick={() => router.push('/borrower/loans')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            View My Loans →
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Apply for a Loan</h1>
        <p className="text-slate-400 text-sm mb-8">Complete the steps below to submit your application</p>

        {/* Stepper */}
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s.num
                    ? 'bg-green-500 text-white'
                    : step === s.num
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                    : 'bg-[#1e2035] text-slate-500'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step === s.num ? 'text-purple-400' : step > s.num ? 'text-green-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-all ${step > s.num ? 'bg-green-500' : 'bg-[#1e2035]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Already authenticated */}
        {step === 1 && (
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-2xl">✅</div>
              <div>
                <h2 className="text-xl font-bold text-white">You're logged in!</h2>
                <p className="text-slate-400 text-sm">Authenticated as {user?.name}</p>
              </div>
            </div>
            <div className="bg-[#0d0d1a] rounded-xl p-4 border border-[#2d3748] mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="text-white ml-2">{user?.name}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-white ml-2">{user?.email}</span></div>
                <div><span className="text-slate-500">Role:</span> <span className="text-purple-400 ml-2 capitalize">{user?.role}</span></div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25"
            >
              Continue to Personal Details →
            </button>
          </div>
        )}

        {/* Step 2: Personal Details + BRE */}
        {step === 2 && (
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-1">Personal Details</h2>
            <p className="text-slate-400 text-sm mb-6">We'll verify your eligibility based on these details</p>

            {breErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 font-semibold text-sm mb-2">❌ Eligibility Check Failed</p>
                <ul className="space-y-1">
                  {breErrors.map((err, i) => (
                    <li key={i} className="text-red-300 text-sm flex items-start gap-2">
                      <span>•</span><span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    placeholder="As per PAN card"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">PAN Card</label>
                  <input
                    type="text"
                    value={personal.pan}
                    onChange={(e) => setPersonal({ ...personal, pan: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600 uppercase"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={personal.dateOfBirth}
                    onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={personal.monthlySalary}
                    onChange={(e) => setPersonal({ ...personal, monthlySalary: e.target.value })}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    placeholder="50000"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Employment Mode</label>
                  <select
                    value={personal.employmentMode}
                    onChange={(e) => setPersonal({ ...personal, employmentMode: e.target.value })}
                    className="w-full bg-[#0d0d1a] border border-[#2d3748] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="salaried">Salaried</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#0d0d1a] rounded-xl p-4 border border-[#2d3748] text-xs text-slate-500">
                <p className="font-semibold text-slate-400 mb-2">Eligibility Criteria:</p>
                <ul className="space-y-1">
                  <li>• Age: 23–50 years</li>
                  <li>• Monthly salary: ≥ ₹25,000</li>
                  <li>• Valid PAN format (e.g., ABCDE1234F)</li>
                  <li>• Employment: Salaried or Self-Employed</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-3 border border-[#2d3748] text-slate-300 rounded-xl text-sm hover:border-slate-500 transition-all">
                  Back
                </button>
                <button
                  onClick={handleBRECheck}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25"
                >
                  {loading ? 'Checking eligibility...' : 'Check Eligibility →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Salary Slip */}
        {step === 3 && (
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-1">Upload Salary Slip</h2>
            <p className="text-slate-400 text-sm mb-6">PDF, JPG, or PNG • Max 5MB</p>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                salarySlipFile
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-[#2d3748] hover:border-purple-500/50 hover:bg-purple-500/5'
              }`}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('File size must be under 5MB');
                      return;
                    }
                    setSalarySlipFile(file);
                  }
                }}
              />
              {salarySlipFile ? (
                <div>
                  <p className="text-3xl mb-3">📄</p>
                  <p className="text-green-400 font-semibold">{salarySlipFile.name}</p>
                  <p className="text-slate-500 text-xs mt-1">{(salarySlipFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-3">☁️</p>
                  <p className="text-slate-300 font-medium mb-1">Click to upload your salary slip</p>
                  <p className="text-slate-600 text-sm">PDF, JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-[#2d3748] text-slate-300 rounded-xl text-sm hover:border-slate-500 transition-all">
                Back
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading || !salarySlipFile}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25"
              >
                {uploading ? 'Uploading...' : 'Upload & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Loan Config */}
        {step === 4 && (
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-1">Configure Your Loan</h2>
            <p className="text-slate-400 text-sm mb-6">Adjust the sliders to configure your loan</p>

            <div className="space-y-8">
              {/* Amount slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">Loan Amount</label>
                  <span className="text-purple-400 font-semibold font-mono">{formatCurrency(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full"
                  style={{ background: `linear-gradient(to right, #6c63ff ${((loanAmount - 50000) / 450000) * 100}%, #1e2035 0%)` }}
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>₹50K</span><span>₹5L</span>
                </div>
              </div>

              {/* Tenure slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">Loan Tenure</label>
                  <span className="text-purple-400 font-semibold font-mono">{tenure} days</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={5}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full"
                  style={{ background: `linear-gradient(to right, #6c63ff ${((tenure - 30) / 335) * 100}%, #1e2035 0%)` }}
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>30 days</span><span>365 days</span>
                </div>
              </div>

              {/* Live Calculation */}
              <div className="bg-[#0d0d1a] rounded-2xl p-6 border border-[#2d3748]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 font-mono">Loan Summary</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Principal Amount</span>
                    <span className="text-white font-medium font-mono">{formatCurrency(loanCalc.principal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Interest Rate</span>
                    <span className="text-white font-medium font-mono">12% p.a. (Simple Interest)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tenure</span>
                    <span className="text-white font-medium font-mono">{tenure} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Simple Interest</span>
                    <span className="text-yellow-400 font-medium font-mono">{formatCurrency(loanCalc.simpleInterest)}</span>
                  </div>
                  <div className="h-px bg-[#2d3748]" />
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-semibold">Total Repayment</span>
                    <span className="text-purple-400 font-bold text-lg font-mono">{formatCurrency(loanCalc.totalRepayment)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="px-6 py-3 border border-[#2d3748] text-slate-300 rounded-xl text-sm hover:border-slate-500 transition-all">
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-500/25"
                >
                  {loading ? 'Submitting...' : '🚀 Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
