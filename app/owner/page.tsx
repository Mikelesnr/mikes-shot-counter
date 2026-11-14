'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, UserCheck, CheckCircle2, Clock, PlusCircle, ShieldAlert } from 'lucide-react';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Shop & First Manager Form State
  const [shopName, setShopName] = useState('');
  const [shooterSize, setShooterSize] = useState('25');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerPin, setManagerPin] = useState('');

  // 1. Strict Owner Role Security Guard Check on Mount
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

      if (userRole !== 'OWNER') {
        if (userRole === 'ADMIN') router.push('/admin');
        else if (userRole === 'MANAGER') router.push('/manager');
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

  const loadShops = async () => {
    try {
      const res = await fetch('/api/owner/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error('Failed to load owner shops:', err);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadShops();
    }
  }, [authorized]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/owner/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          shooterSize,
          managerName,
          managerEmail,
          managerPassword,
          managerPin,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Could not create shop.');
        return;
      }

      setSuccessMsg(
        `Shop "${data.shop.name}" created! Once Mike activates your subscription, your Manager can sign in on the bar terminal.`
      );
      setShopName('');
      setShooterSize('25');
      setManagerName('');
      setManagerEmail('');
      setManagerPassword('');
      setManagerPin('');
      loadShops();
    } catch {
      setLoading(false);
      setError('Network error while creating shop.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Owner Access...</div>
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
            You must be logged in with a Shop Owner account to view this portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shop Owner Portal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create shops, set shooter sizes, and assign your first Manager</p>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition"
          >
            Go to Login Terminal
          </Link>
        </header>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Create Shop + First Manager Form */}
          <form
            onSubmit={handleCreateShop}
            className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-lg">
              <PlusCircle className="w-5 h-5" />
              <h2>Create New Shop & Assign First Manager</h2>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                {successMsg}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">1. Shop Details</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Shop / Bar Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown Lounge"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Shooter Size (ml)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={shooterSize}
                    onChange={(e) => setShooterSize(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                2. First Shop Manager Account
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Manager Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Manager Email (First Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@venue.com"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password for terminal binding"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">4-Digit Terminal PIN</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="e.g. 1234"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Creating Shop...' : 'Create Shop & Manager'}
            </button>
          </form>

          {/* Existing Shops List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <Store className="w-5 h-5 text-sky-500 dark:text-sky-400" />
              Registered Shops ({shops.length})
            </h2>

            {shops.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
                No shops created yet. Use the form to create your first shop and manager.
              </div>
            ) : (
              shops.map((shop) => (
                <div key={shop.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{shop.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Shooter Size: {shop.shooterSize} ml</p>
                    </div>
                    {shop.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/25">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Payment
                      </span>
                    )}
                  </div>

                  {shop.users?.[0] && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                      Manager: <span className="font-medium">{shop.users[0].name}</span> ({shop.users[0].email})
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}