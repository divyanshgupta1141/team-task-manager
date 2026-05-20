'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Zap, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/team', label: 'Team', icon: Users },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TeamFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
              <span className="text-xs text-gray-500">{user?.role}</span>
            </div>
          </div>
        </div>
        <button onClick={logout} id="logout-btn"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400"
        onClick={() => setMobileOpen(!mobileOpen)} id="mobile-menu-btn">
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('lg:hidden fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <NavContent onClose={() => setMobileOpen(false)} />
      </aside>
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900/60 backdrop-blur-xl border-r border-gray-800 h-screen sticky top-0 flex-shrink-0">
        <NavContent />
      </aside>
    </>
  );
}
