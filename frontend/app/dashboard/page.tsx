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
    { label: 'Total Borrowers', value: stats.totalBorrowers, icon: '👥', color: 'text-blue-400' },
    { label: 'Total Applications', value: stats.totalLoans, icon: '📋', color: 'text-purple-400' },
    { label: 'Pending Sanction', value: stats.appliedLoans, icon: '⏳', color: 'text-yellow-400' },
    { label: 'Sanctioned', value: stats.sanctionedLoans, icon: '✅', color: 'text-green-400' },
    { label: 'Disbursed', value: stats.disbursedLoans, icon: '💳', color: 'text-indigo-400' },
    { label: 'Closed', value: stats.closedLoans, icon: '🔒', color: 'text-emerald-400' },
    { label: 'Rejected', value: stats.rejectedLoans, icon: '❌', color: 'text-red-400' },
    { label: 'Total Payments', value: stats.totalPayments, icon: '💰', color: 'text-orange-400' },
  ] : [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm">Welcome back, {user.name}. Here's the system at a glance.</p>
      </div>

      {stats ? (
        <>
          {/* Disbursed amount highlight */}
          <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
            <p className="text-slate-400 text-sm mb-1">Total Amount Disbursed</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(stats.totalDisbursedAmount)}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-5 hover:border-[#2d3748] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-slate-500 text-sm mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
