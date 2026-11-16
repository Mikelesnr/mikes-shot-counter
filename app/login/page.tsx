'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLE_HOME, isUserRole } from '@/types/roles';
import { Wine, Lock, LogOut, Delete, ShieldAlert, Mail, KeyRound, Store, Building2 } from 'lucide-react';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function LoginTerminalPage() {
  const router = useRouter();
  const [savedShopId, setSavedShopId] = useState<string | null>(null);
  const [savedShopName, setSavedShopName] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedId = localStorage.getItem('msc_shop_id');
      if (storedId) {
        setSavedShopId(storedId);
        setSavedShopName(localStorage.getItem('msc_shop_name'));
      }
    } catch {}
  }, []);

  const clearTerminalShop = () => {
    try {
      localStorage.removeItem('msc_shop_id');
      localStorage.removeItem('msc_shop_name');
    } catch {}
    setSavedShopId(null);
    setSavedShopName(null);
    setPin('');
    setError(null);
  };

  const goNext = (role: string, fallback: string) => {
    // Honour ?next= only for local paths; the proxy still enforces who may open what.
    const next = new URLSearchParams(window.location.search).get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    router.push(safeNext ?? (isUserRole(role) ? ROLE_HOME[role] : fallback));
    router.refresh();
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'PASSWORD', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
        return;
      }
      if ((data.user.role === 'MANAGER' || data.user.role === 'STAFF') && data.user.shopId) {
        try {
          localStorage.setItem('msc_shop_id', data.user.shopId);
          localStorage.setItem('msc_shop_name', data.user.shopName || 'Bound Venue');
        } catch {}
      }
      goNext(data.user.role, data.redirectTo || '/counter');
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const submitPin = async (value: string) => {
    if (!savedShopId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'PIN', shopId: savedShopId, pin: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect PIN.');
        setPin('');
        setLoading(false);
        return;
      }
      goNext(data.user.role, data.redirectTo || '/counter');
    } catch {
      setLoading(false);
      setPin('');
      setError('Connection error while verifying PIN.');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4 || loading) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(null);
    if (nextPin.length === 4) void submitPin(nextPin);
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {savedShopId ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Bound Shop Terminal
                  </span>
                  <h1 className="truncate text-xl font-extrabold leading-tight text-slate-900 dark:text-white">
                    {savedShopName || 'Bar Terminal'}
                  </h1>
                </div>
              </div>
              <button
                onClick={clearTerminalShop}
                type="button"
                title="Unbind this device so it can be used at another shop"
                className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-rose-500/15 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Unbind</span>
              </button>
            </div>

            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              Enter your 4-digit Staff or Manager PIN
            </p>

            <div className="flex justify-center gap-3 py-1" aria-live="polite">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`flex h-14 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all sm:h-16 sm:w-14 ${
                    pin[idx]
                      ? 'scale-105 border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  {pin[idx] ? '•' : ''}
                </div>
              ))}
            </div>

            {error && (
              <div className="alert-error" role="alert">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {DIGITS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  disabled={loading}
                  className="h-16 cursor-pointer rounded-2xl bg-slate-100 text-2xl font-bold text-slate-900 shadow-sm transition hover:bg-amber-500 hover:text-slate-950 active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPin('');
                  setError(null);
                }}
                className="h-16 cursor-pointer rounded-2xl bg-slate-100/70 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                disabled={loading}
                className="h-16 cursor-pointer rounded-2xl bg-slate-100 text-2xl font-bold text-slate-900 shadow-sm transition hover:bg-amber-500 hover:text-slate-950 active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPin((p) => p.slice(0, -1))}
                aria-label="Backspace"
                className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-slate-100/70 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              Owner or admin?{' '}
              <button onClick={clearTerminalShop} className="cursor-pointer font-semibold text-amber-600 hover:underline dark:text-amber-400">
                Sign in with email
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div className="space-y-2 pb-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                <Wine className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in with your account. Managers signing in here will bind this device to their venue.
              </p>
            </div>

            {error && (
              <div className="alert-error" role="alert">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@venue.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <KeyRound className="h-4 w-4" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>

            <div className="border-t border-slate-200 pt-4 text-center dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Opening a new bar or venue?{' '}
                <Link href="/owner/register" className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:underline dark:text-amber-400">
                  <Building2 className="h-3.5 w-3.5" />
                  Register as Shop Owner
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
