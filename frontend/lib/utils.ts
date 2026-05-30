// SI = (P × R × T) / (365 × 100)
export function calculateLoan(principal: number, tenureDays: number, rate = 12) {
  const si = (principal * rate * tenureDays) / (365 * 100);
  const total = principal + si;
  return {
    principal,
    simpleInterest: Math.round(si * 100) / 100,
    totalRepayment: Math.round(total * 100) / 100,
    tenureDays,
    rate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export const LOAN_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  sanctioned: { label: 'Sanctioned', color: 'bg-yellow-100 text-yellow-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  disbursed: { label: 'Disbursed', color: 'bg-purple-100 text-purple-800' },
  closed: { label: 'Closed', color: 'bg-green-100 text-green-800' },
};
