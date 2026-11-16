'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Wine, Users, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { StaffManager } from '@/components/StaffManager';

type FailedAttempt = { id: string; createdAt: string; enteredPin: string };
type Bottle = { id: string; name: string; volume: number; fullMass: number; emptyMass: number };

export default function ManagerDashboardPage() {
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [shopName, setShopName] = useState<string>('');
  const [shopId, setShopId] = useState<string>('');

  const [bottleName, setBottleName] = useState('');
  const [volume, setVolume] = useState('750');
  const [fullWeight, setFullWeight] = useState('');
  const [emptyWeight, setEmptyWeight] = useState('');

  const [bottleMsg, setBottleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<'bottle' | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/staff');
      if (res.ok) {
        const data = await res.json();
        setFailedAttempts(data.failedAttempts || []);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    }
  }, []);

  const loadBottles = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/bottles?shopId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setBottles(data.bottles || []);
        setShopName(data.shop?.name || '');
      }
    } catch (err) {
      console.error('Failed to load bottles:', err);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
    fetch('/api/counter/shops')
      .then((r) => r.json())
      .then((data) => {
        const first = data.shops?.[0];
        if (first) {
          setShopId(first.id);
          setShopName(first.name);
          void loadBottles(first.id);
        }
      })
      .catch(() => {});
  }, [loadStaff, loadBottles]);

  const handleAddBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('bottle');
    setBottleMsg(null);
    try {
      const res = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: bottleName, volume, fullWeight, emptyWeight }),
      });
      const data = await res.json();
      if (res.ok) {
        setBottleName('');
        setFullWeight('');
        setEmptyWeight('');
        setBottleMsg({ ok: true, text: 'Bottle specs saved.' });
        if (shopId) void loadBottles(shopId);
      } else {
        setBottleMsg({ ok: false, text: data.error || 'Failed to save bottle specs.' });
      }
    } catch {
      setBottleMsg({ ok: false, text: 'Network error. Please try again.' });
    }
    setBusy(null);
  };

  const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) =>
    m ? (
      <div className={m.ok ? 'alert-success' : 'alert-error'} role="status">
        {m.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{m.text}</span>
      </div>
    ) : null;

  return (
    <PageShell
      title="Shop Manager"
      subtitle={shopName ? `${shopName}: manage staff, PINs, bottle weights and terminal security.` : 'Manage staff PINs, bottle weights and terminal security.'}
    >
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        <form onSubmit={handleAddBottle} className="card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sky-600 dark:text-sky-400">
            <Wine className="h-5 w-5" />
            <h2>Register Bottle Weights</h2>
          </div>
          <Msg m={bottleMsg} />
          <div>
            <label htmlFor="bottleName" className="label">Spirit name</label>
            <input id="bottleName" type="text" required placeholder="e.g. Jameson 750ml" value={bottleName} onChange={(e) => setBottleName(e.target.value)} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="vol" className="label">Volume ml</label>
              <input id="vol" type="number" inputMode="decimal" required value={volume} onChange={(e) => setVolume(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="full" className="label">Full g</label>
              <input id="full" type="number" inputMode="decimal" step="0.1" required value={fullWeight} onChange={(e) => setFullWeight(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="empty" className="label">Empty g</label>
              <input id="empty" type="number" inputMode="decimal" step="0.1" required value={emptyWeight} onChange={(e) => setEmptyWeight(e.target.value)} className="input" />
            </div>
          </div>
          <button type="submit" disabled={busy === 'bottle'} className="btn w-full bg-sky-500 text-slate-950 hover:bg-sky-400">
            {busy === 'bottle' ? 'Saving...' : 'Save Bottle Specs'}
          </button>
        </form>
      </div>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        <section className="card space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <Wine className="h-5 w-5 text-sky-500" />
            <h2>Registered bottles ({bottles.length})</h2>
          </div>
          {bottles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No bottles yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {bottles.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-medium">{b.name}</span>
                  <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {b.volume}ml · {b.emptyMass}–{b.fullMass}g
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      <section className="card space-y-4">
        <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
          <Users className="h-5 w-5" />
          <h2>Team: add, edit or remove staff</h2>
        </div>
        <StaffManager onChange={loadStaff} />
      </section>

      <section className="card space-y-4 !border-rose-200 dark:!border-rose-900/50">
        <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="h-5 w-5" />
          <h2>Failed terminal PIN attempts</h2>
        </div>
        {failedAttempts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No failed PIN attempts recorded.</p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2">PIN entered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {failedAttempts.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap py-2 pr-4 text-slate-700 dark:text-slate-300">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="py-2 font-mono text-rose-600 dark:text-rose-300">{a.enteredPin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
