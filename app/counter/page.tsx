'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateRemainingShots } from '@/lib/shotCalculator';
import { Wine, ShieldAlert } from 'lucide-react';

interface Bottle {
  id: string;
  name: string;
  volume: number;
  fullMass: number;
  emptyMass: number;
}

export default function StaffShotCounterPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [shooterSize, setShooterSize] = useState<number>(25);
  const [selectedBottleId, setSelectedBottleId] = useState<string>('');
  const [scaleWeight, setScaleWeight] = useState<string>('');

  // 1. General Authentication Guard Check (Requires login, allows any valid role)
  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find((c) => c.trim().startsWith('msc_session='));
      const loggedInCookie = cookies.find((c) => c.trim().startsWith('msc_logged_in='));

      if (!sessionCookie && !loggedInCookie) {
        router.push('/login');
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

  useEffect(() => {
    if (!authorized) return;
    const shopId = localStorage.getItem('msc_shop_id');
    if (!shopId) return;

    fetch(`/api/bottles?shopId=${shopId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.shop) setShooterSize(data.shop.shooterSize);
        if (data.bottles) {
          setBottles(data.bottles);
          if (data.bottles[0]) setSelectedBottleId(data.bottles[0].id);
        }
      })
      .catch((err) => console.error('Failed to load bottles:', err));
  }, [authorized]);

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Session...</div>
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You must be signed in to access the counter terminal.
          </p>
        </div>
      </div>
    );
  }

  const selectedBottle = bottles.find((b) => b.id === selectedBottleId);
  const numericWeight = parseFloat(scaleWeight);

  const result =
    selectedBottle && !isNaN(numericWeight)
      ? calculateRemainingShots({
          currentWeight: numericWeight,
          emptyWeight: selectedBottle.emptyMass,
          fullWeight: selectedBottle.fullMass,
          volume: selectedBottle.volume,
          shooterSize,
        })
      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wine className="w-6 h-6 text-amber-500" />
            Shot Counter Scale Terminal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Shop Shooter Size: <span className="text-amber-600 dark:text-amber-400 font-semibold">{shooterSize} ml</span> (Locked)
          </p>
        </header>

        <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Bottle</label>
            <select
              value={selectedBottleId}
              onChange={(e) => {
                setSelectedBottleId(e.target.value);
                setScaleWeight('');
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none"
            >
              {bottles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.volume} ml)
                </option>
              ))}
            </select>
          </div>

          {selectedBottle && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Bottle Volume</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBottle.volume} ml</span>
              </div>
              <div>
                <span className="text-slate-500 block">Full Weight</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBottle.fullMass} g</span>
              </div>
              <div>
                <span className="text-slate-500 block">Empty Weight</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBottle.emptyMass} g</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
              Enter Current Scale Weight (g)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 845.5"
              value={scaleWeight}
              onChange={(e) => setScaleWeight(e.target.value)}
              className="w-full px-4 py-3 text-xl font-bold rounded-lg bg-slate-50 dark:bg-slate-950 border border-amber-500/50 text-slate-900 dark:text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>

          {result && (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
              <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-300 font-bold">Remaining Shots</span>
              <div className="text-5xl font-extrabold text-amber-600 dark:text-amber-400">{result.shots}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {result.remainingMl} ml remaining ({result.percentage}% full)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}