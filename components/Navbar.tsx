'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wine, LayoutDashboard, LogOut, LogIn, UserPlus, Scale } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ROLE_HOME, ROLE_LABELS, UserRole } from '@/types/roles';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
      setSigningOut(false);
    }
  };

  const home = user ? ROLE_HOME[user.role] : '/';
  const showDashboard = user && user.role !== UserRole.STAFF;

  const navItem = (active: boolean) =>
    `inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:h-10 sm:px-4 ${
      active
        ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link href={home} className="group flex min-w-0 items-center gap-2.5">
          <div className="rounded-xl bg-amber-500 p-2 text-slate-950 shadow-md shadow-amber-500/20 transition group-hover:scale-105">
            <Wine className="h-5 w-5" />
          </div>
          <span className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg dark:text-white">
            <span className="hidden sm:inline">Mike&apos;s </span>
            <span className="text-amber-500">Shot Counter</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/counter"
                aria-label="Shot counter"
                className={navItem(pathname.startsWith('/counter'))}
              >
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Counter</span>
              </Link>

              {showDashboard && (
                <Link
                  href={ROLE_HOME[user.role]}
                  aria-label="Dashboard"
                  className={navItem(pathname.startsWith(ROLE_HOME[user.role]))}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              <div className="hidden px-2 text-right leading-tight lg:block">
                <div className="max-w-[10rem] truncate text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role]}</div>
              </div>

              <button
                onClick={handleLogout}
                disabled={signingOut}
                aria-label="Log out"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 disabled:opacity-60 sm:h-10 sm:px-4 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" aria-label="Log in" className={navItem(pathname === '/login')}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                href="/owner/register"
                aria-label="Register venue"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-sm shadow-amber-500/20 transition hover:bg-amber-400 sm:h-10 sm:px-4"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Register Venue</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
