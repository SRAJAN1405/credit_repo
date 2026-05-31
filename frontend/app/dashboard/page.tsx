'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  totalLoans: number;
  appliedLoans: number;
  sanctionedLoans: number;
  disbursedLoans: number;
  closedLoans: number;
  rejectedLoans: number;
  totalBorrowers: number;
  totalPayments: number;
  totalDisbursedAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
    } else {
      // Redirect non-admins to their module
      const roleRoutes: Record<string, string> = {
        sales: '/dashboard/sales',
        sanction: '/dashboard/sanction',
        disbursement: '/dashboard/disbursement',
        collection: '/dashboard/collection',
      };
      if (roleRoutes[user.role]) router.push(roleRoutes[user.role]);
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const statCards = stats ? [
    { label: 'Total Borrowers', value: stats.totalBorrowers, icon: '👥', color: 'from-blue-600 to-blue-500', textColor: 'text-blue-400' },
    { label: 'Total Applications', value: stats.totalLoans, icon: '📋', color: 'from-purple-600 to-purple-500', textColor: 'text-purple-400' },
    { label: 'Pending Sanction', value: stats.appliedLoans, icon: '⏳', color: 'from-yellow-600 to-yellow-500', textColor: 'text-yellow-400' },
    { label: 'Sanctioned', value: stats.sanctionedLoans, icon: '✅', color: 'from-green-600 to-green-500', textColor: 'text-green-400' },
    { label: 'Disbursed', value: stats.disbursedLoans, icon: '💳', color: 'from-indigo-600 to-indigo-500', textColor: 'text-indigo-400' },
    { label: 'Closed', value: stats.closedLoans, icon: '🔒', color: 'from-emerald-600 to-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Rejected', value: stats.rejectedLoans, icon: '❌', color: 'from-red-600 to-red-500', textColor: 'text-red-400' },
    { label: 'Total Payments', value: stats.totalPayments, icon: '💰', color: 'from-orange-600 to-orange-500', textColor: 'text-orange-400' },
  ] : [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm">Welcome back, {user.name}. Here's the system snapshot.</p>
      </div>

      {stats ? (
        <>
          {/* Disbursed amount highlight */}
          <div className="glass bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Amount Disbursed</p>
            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              {formatCurrency(stats.totalDisbursedAmount)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="group card bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 hover:to-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                  </div>
                  <span className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">{card.icon}</span>
                </div>
                <div className={`h-0.5 mt-4 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
