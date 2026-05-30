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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Sales — Lead Tracking</h1>
        <p className="text-slate-400 text-sm">Monitor registered users and track who hasn't applied yet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-white' },
          { label: 'Not Applied', value: pending, color: 'text-yellow-400' },
          { label: 'Applied', value: applied, color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'applied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-[#13131f] border border-[#1e2035] text-slate-400 hover:text-white hover:border-[#2d3748]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No leads found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2035]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead._id} className="border-b border-[#1e2035] last:border-0 hover:bg-[#1a1a2e] transition-colors">
                  <td className="px-5 py-4 text-white text-sm font-medium">{lead.name}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{lead.email}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{lead.phone || '—'}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{formatDate(lead.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      lead.hasApplied ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {lead.hasApplied ? 'Applied' : 'Not Applied'}
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
