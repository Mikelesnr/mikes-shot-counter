'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wine, LayoutDashboard, LogOut, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, userRole, refreshAuth } = useAuth();
  const isDarkMode = useSyncExternalStore(
    (onStoreChange) => {
      const observer = new MutationObserver(onStoreChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => true,
  );

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      document.cookie = 'msc_session=; Max-Age=0; path=/;';
      document.cookie = 'msc_logged_in=; Max-Age=0; path=/;';
      window.dispatchEvent(new Event('msc-auth-change'));
      refreshAuth();
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Dynamically map dashboard href based on role with /counter as the fallback
  let dashboardHref = '/counter';

  if (userRole === 'ADMIN') {
    dashboardHref = '/admin';
  } else if (userRole === 'OWNER') {
    dashboardHref = '/dashboard';
  } else if (userRole === 'MANAGER') {
    dashboardHref = '/manager';
  } else if (userRole === 'STAFF') {
    dashboardHref = '/counter';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Wine className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
            Mike&apos;s <span className="text-amber-500">Shot Counter</span>
          </span>
        </Link>

        {/* Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {isLoggedIn ? (
            <>
              <Link
                href={dashboardHref}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  pathname.startsWith(dashboardHref)
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>

              <Link
                href="/owner/register"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Venue</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}