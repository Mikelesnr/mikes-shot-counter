'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wine, Scale, AlertTriangle, Store } from 'lucide-react';
import { calculateRemainingShots } from '@/lib/shotCalculator';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/roles';
import { PageShell } from '@/components/PageShell';

interface Bottle {
  id: string;
  name: string;
  volume: number;
  fullMass: number;
  emptyMass: number;
}
interface ShopOption {
  id: string;
  name: string;
  shooterSize: number;
}

export default function ShotCounterPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [shopId, setShopId] = useState('');
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [selectedBottleId, setSelectedBottleId] = useState('');
  const [scaleWeight, setScaleWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which shops can this person use? (Staff and managers get exactly one; owners their own; admin all.)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/counter/shops')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: ShopOption[] = data.shops || [];
        setShops(list);
        if (list[0]) setShopId(list[0].id);
        else setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load your shops. Check your connection.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    fetch(`/api/bottles?shopId=${encodeURIComponent(shopId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: Bottle[] = data.bottles || [];
        setBottles(list);
        setSelectedBottleId(list[0]?.id ?? '');
        setScaleWeight('');
        setError(data.error ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load bottles. Check your connection.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const shop = shops.find((s) => s.id === shopId);
  const shooterSize = shop?.shooterSize ?? 25;
  const selectedBottle = bottles.find((b) => b.id === selectedBottleId);
  const numericWeight = parseFloat(scaleWeight);

  const result = useMemo(() => {
    if (!selectedBottle || Number.isNaN(numericWeight)) return null;
    return calculateRemainingShots({
      currentWeight: numericWeight,
      emptyWeight: selectedBottle.emptyMass,
      fullWeight: selectedBottle.fullMass,
      volume: selectedBottle.volume,
      shooterSize,
    });
  }, [selectedBottle, numericWeight, shooterSize]);

  const outOfRange =
    selectedBottle && !Number.isNaN(numericWeight)
      ? numericWeight < selectedBottle.emptyMass
        ? 'This is lighter than the empty bottle. Check the scale is zeroed and the bottle is fully on it.'
        : numericWeight > selectedBottle.fullMass
          ? 'This is heavier than the full bottle. Check the reading.'
          : null
      : null;

  const pct = result?.percentage ?? 0;
  const gaugeColour = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <PageShell
      width="max-w-xl"
      title="Shot Counter"
      subtitle={shop ? `${shop.name} · shooter size ${shooterSize} ml (locked)` : 'Weigh a bottle to see the shots left'}
    >
      {error && (
        <div className="alert-error" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse text-center text-sm text-slate-500">Loading bottles...</div>
      ) : shops.length === 0 ? (
        <div className="card space-y-2 text-center">
          <Store className="mx-auto h-8 w-8 text-slate-400" />
          <p className="font-semibold">No shop to count for yet.</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {user?.role === UserRole.OWNER ? (
              <>
                Create a shop in your <Link href="/owner" className="font-semibold text-amber-600 hover:underline dark:text-amber-400">Owner portal</Link> first.
              </>
            ) : (
              'Your account is not linked to a shop. Ask your manager or the admin.'
            )}
          </p>
        </div>
      ) : (
        <div className="card space-y-5">
          {shops.length > 1 && (
            <div>
              <label htmlFor="shop" className="label">Shop</label>
              <select id="shop" value={shopId} onChange={(e) => setShopId(e.target.value)} className="input">
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {bottles.length === 0 ? (
            <div className="space-y-2 py-4 text-center">
              <Wine className="mx-auto h-8 w-8 text-slate-400" />
              <p className="font-semibold">No bottles registered yet.</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {user?.role === UserRole.MANAGER ? (
                  <>
                    Add bottle weights in the <Link href="/manager" className="font-semibold text-amber-600 hover:underline dark:text-amber-400">Manager dashboard</Link>.
                  </>
                ) : (
                  'A shop manager needs to register the bottle weights first.'
                )}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="bottle" className="label">Select Bottle</label>
                <select
                  id="bottle"
                  value={selectedBottleId}
                  onChange={(e) => {
                    setSelectedBottleId(e.target.value);
                    setScaleWeight('');
                  }}
                  className="input"
                >
                  {bottles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.volume} ml)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBottle && (
                <dl className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3 text-center text-xs dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <dt className="text-slate-500">Volume</dt>
                    <dd className="font-semibold">{selectedBottle.volume} ml</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Full</dt>
                    <dd className="font-semibold">{selectedBottle.fullMass} g</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Empty</dt>
                    <dd className="font-semibold">{selectedBottle.emptyMass} g</dd>
                  </div>
                </dl>
              )}

              <div>
                <label htmlFor="weight" className="label !text-amber-600 dark:!text-amber-400">
                  Current scale weight (g)
                </label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 845.5"
                  value={scaleWeight}
                  onChange={(e) => setScaleWeight(e.target.value)}
                  className="input !border-amber-500/50 !py-3.5 !text-2xl font-bold"
                />
              </div>

              {outOfRange && (
                <div className="alert-error" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{outOfRange}</span>
                </div>
              )}

              {result ? (
                <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center" aria-live="polite">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Remaining shots</span>
                  <div className="text-6xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{result.shots}</div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full transition-all duration-300 ${gaugeColour}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {result.remainingMl} ml left · {result.percentage}% full
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
                  <Scale className="h-4 w-4" /> Enter the scale weight to see the shots left.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
