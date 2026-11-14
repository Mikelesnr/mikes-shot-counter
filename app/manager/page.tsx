'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, UserPlus, Wine } from 'lucide-react';

type FailedAttempt = {
  id: string | number;
  createdAt: string;
  enteredPin: string;
};

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [shopId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('msc_shop_id') || '';
  });
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);

  const [staffName, setStaffName] = useState('');
  const [staffPin, setStaffPin] = useState('');

  const [bottleName, setBottleName] = useState('');
  const [volume, setVolume] = useState('750');
  const [fullWeight, setFullWeight] = useState('');
  const [emptyWeight, setEmptyWeight] = useState('');

  // 1. Strict Manager Role Security Guard Check on Mount
  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find((c) => c.trim().startsWith('msc_session='));

      if (!sessionCookie) {
        router.push('/login');
        return;
      }

      const value = decodeURIComponent(sessionCookie.split('=')[1]);
      const parsed = JSON.parse(value);
      const userRole = parsed?.role?.toUpperCase();

      if (userRole !== 'MANAGER') {
        if (userRole === 'ADMIN') router.push('/admin');
        else if (userRole === 'OWNER') router.push('/dashboard');
        else router.push('/counter');
        return;
      }

      setAuthorized(true);
    } catch (err) {
      console.error('Auth verification failed:', err);
      router.push('/login');
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  const loadData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/manager/staff?shopId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setFailedAttempts(data.failedAttempts || []);
      }
    } catch (err) {
      console.error('Failed to load manager data:', err);
    }
  }, []);

  useEffect(() => {
    if (!shopId || !authorized) return;

    let cancelled = false;
    fetch(`/api/manager/staff?shopId=${shopId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setFailedAttempts(data.failedAttempts || []);
        }
      })
      .catch((err) => console.error('Failed to load staff data:', err));

    return () => {
      cancelled = true;
    };
  }, [shopId, authorized]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, name: staffName, pin: staffPin }),
      });
      if (res.ok) {
        setStaffName('');
        setStaffPin('');
        loadData(shopId);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add staff.');
      }
    } catch (err) {
      console.error('Error adding staff:', err);
    }
  };

  const handleAddBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, name: bottleName, volume, fullWeight, emptyWeight }),
      });
      if (res.ok) {
        setBottleName('');
        setFullWeight('');
        setEmptyWeight('');
        alert('Bottle specs saved.');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save bottle specs.');
      }
    } catch (err) {
      console.error('Error adding bottle:', err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Manager Access...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You must be logged in with a Shop Manager account to view this portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shop Manager Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleAddStaff} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <UserPlus className="w-5 h-5" />
              <h2>Add Bar Staff (PIN Login)</h2>
            </div>
            <input
              type="text"
              required
              placeholder="Staff Full Name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
            />
            <input
              type="text"
              required
              maxLength={4}
              pattern="\d{4}"
              placeholder="4-Digit PIN (e.g. 4821)"
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
            />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition cursor-pointer">
              Create Staff Account
            </button>
          </form>

          <form onSubmit={handleAddBottle} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold">
              <Wine className="w-5 h-5" />
              <h2>Register Bottle Weights</h2>
            </div>
            <input
              type="text"
              required
              placeholder="Spirit Name (e.g. Jameson 750ml)"
              value={bottleName}
              onChange={(e) => setBottleName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                required
                placeholder="Volume (ml)"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 outline-none"
              />
              <input
                type="number"
                step="0.1"
                required
                placeholder="Full Wt (g)"
                value={fullWeight}
                onChange={(e) => setFullWeight(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 outline-none"
              />
              <input
                type="number"
                step="0.1"
                required
                placeholder="Empty Wt (g)"
                value={emptyWeight}
                onChange={(e) => setEmptyWeight(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition cursor-pointer">
              Save Bottle Specs
            </button>
          </form>
        </div>

        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
            <ShieldAlert className="w-5 h-5" />
            <h2>Failed Terminal PIN Attempts (Security Audit)</h2>
          </div>
          {failedAttempts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No failed PIN attempts recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">PIN Entered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {failedAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="py-2 text-slate-700 dark:text-slate-300">{new Date(attempt.createdAt).toLocaleString()}</td>
                      <td className="py-2 font-mono text-rose-600 dark:text-rose-300">{attempt.enteredPin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}