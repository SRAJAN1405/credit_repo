'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  hasApplied: boolean;
}

export default function SalesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'applied'>('all');

  useEffect(() => {
    if (user && !['admin', 'sales'].includes(user.role)) router.push('/dashboard');
  }, [user, router]);

  const fetchLeads = useCallback(async () => {
    try {
      const { data } = await api.get('/users/leads');
      setLeads(data.leads);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    if (filter === 'pending') return !l.hasApplied;
    if (filter === 'applied') return l.hasApplied;
    return true;
  });

  const pending = leads.filter((l) => !l.hasApplied).length;
  const applied = leads.filter((l) => l.hasApplied).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">Sales — Lead Tracking</h1>
        <p className="text-slate-400 text-sm">Monitor registered users and track conversion to loan applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-blue-400', icon: '📊' },
          { label: 'Not Applied', value: pending, color: 'text-yellow-400', icon: '⏳' },
          { label: 'Applied', value: applied, color: 'text-green-400', icon: '✅' },
        ].map((s) => (
          <div key={s.label} className="card bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color} mt-2`}>{s.value}</p>
              </div>
              <span className="text-4xl opacity-60">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'applied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-secondary px-6 py-2.5 capitalize transition-all ${
              filter === f 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-glow' 
                : ''
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading leads...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-slate-400 text-sm">No leads found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((lead) => (
                <tr key={lead._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{lead.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{lead.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatDate(lead.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs font-medium ${
                      lead.hasApplied ? 'badge-success' : 'badge-warning'
                    }`}>
                      {lead.hasApplied ? '✅ Applied' : '⏳ Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
