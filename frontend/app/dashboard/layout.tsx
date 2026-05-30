'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊', roles: ['admin'] },
  { href: '/dashboard/sales', label: 'Sales', icon: '🎯', roles: ['admin', 'sales'] },
  { href: '/dashboard/sanction', label: 'Sanction', icon: '✅', roles: ['admin', 'sanction'] },
  { href: '/dashboard/disbursement', label: 'Disbursement', icon: '💳', roles: ['admin', 'disbursement'] },
  { href: '/dashboard/collection', label: 'Collection', icon: '💰', roles: ['admin', 'collection'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, initAuth, logout } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role === 'borrower') router.push('/borrower/loans');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    admin: 'text-yellow-400 bg-yellow-400/10',
    sales: 'text-blue-400 bg-blue-400/10',
    sanction: 'text-green-400 bg-green-400/10',
    disbursement: 'text-purple-400 bg-purple-400/10',
    collection: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#13131f] border-r border-[#1e2035] flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1e2035]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/25">
              L
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">LoanMS</p>
              <p className="text-slate-500 text-xs">Operations</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-[#1e2035]">
          <div className="bg-[#0d0d1a] rounded-xl p-3 border border-[#2d3748]">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-500 text-xs truncate mt-0.5">{user.email}</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-2 capitalize ${roleColors[user.role] || 'text-slate-400 bg-slate-400/10'}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-[#1e2035]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#1e2035]">
          <button
            onClick={() => { logout(); router.push('/auth/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
