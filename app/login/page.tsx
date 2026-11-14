'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/roles';
import {
  Wine,
  Lock,
  LogOut,
  Delete,
  ShieldAlert,
  Mail,
  KeyRound,
  Store,
  Building2,
} from 'lucide-react';

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
    const storedId = localStorage.getItem('msc_shop_id');
    const storedName = localStorage.getItem('msc_shop_name');
    if (storedId) {
      setSavedShopId(storedId);
      setSavedShopName(storedName);
    }
  }, []);

  const clearTerminalShop = () => {
    localStorage.removeItem('msc_shop_id');
    localStorage.removeItem('msc_shop_name');
    setSavedShopId(null);
    setSavedShopName(null);
    setPin('');
    setError(null);
  };

  const redirectByRole = (role: string) => {
    // Dispatch auth state change event immediately before routing
    window.dispatchEvent(new Event('msc-auth-change'));

    if (role === UserRole.ADMIN) router.push('/admin');
    else if (role === UserRole.OWNER) router.push('/dashboard');
    else if (role === UserRole.MANAGER) router.push('/manager');
    else router.push('/counter');
    
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
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
        return;
      }

      if ((data.user.role === UserRole.MANAGER || data.user.role === UserRole.STAFF) && data.user.shopId) {
        localStorage.setItem('msc_shop_id', data.user.shopId);
        localStorage.setItem('msc_shop_name', data.user.shopName || 'Bound Venue');
      }

      redirectByRole(data.user.role);
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const handlePinDigit = async (digit: string) => {
    if (pin.length >= 4 || loading) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(null);

    if (nextPin.length === 4 && savedShopId) {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'PIN', shopId: savedShopId, pin: nextPin }),
        });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
          setError(data.error || 'Incorrect PIN.');
          setPin('');
          return;
        }

        redirectByRole(data.user.role);
      } catch {
        setLoading(false);
        setPin('');
        setError('Connection error while verifying PIN.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
        {savedShopId ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                    Bound Shop Terminal
                  </span>
                  <h1 className="text-xl font-extrabold leading-tight text-slate-900 dark:text-white">
                    {savedShopName || 'Bar Terminal'}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {savedShopId}</p>
                </div>
              </div>

              <button
                onClick={clearTerminalShop}
                type="button"
                title="Unbind this device so it can be used at another shop"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Clear Shop ID</span>
              </button>
            </div>

            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              Enter your 4-digit Staff or Manager PIN
            </p>

            <div className="flex justify-center gap-3.5 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-13 h-15 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    pin[idx]
                      ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-400'
                  }`}
                >
                  {pin[idx] ? '•' : ''}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 active:scale-95 text-xl font-bold text-slate-900 dark:text-white shadow-sm transition cursor-pointer disabled:opacity-50"
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
                className="h-14 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                disabled={loading}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 active:scale-95 text-xl font-bold text-slate-900 dark:text-white shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPin((p) => p.slice(0, -1))}
                aria-label="Backspace"
                className="h-14 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div className="text-center space-y-2 pb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
                <Wine className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Sign in with your account credentials. Managers signing in here will bind this device to their venue.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@venue.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 outline-none text-sm transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
            </button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Opening a new bar or venue?{' '}
                <Link
                  href="/owner/register"
                  className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  <Building2 className="w-3.5 h-3.5" />
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