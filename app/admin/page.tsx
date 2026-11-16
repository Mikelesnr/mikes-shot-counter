'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Store, AlertTriangle, DollarSign, Building, RefreshCw, Sliders, Users, Wine, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PageShell } from '@/components/PageShell';

interface Shop {
  id: string;
  name: string;
  shooterSize: number;
  isPaid: boolean;
  standardPrice: number;
  customPrice: number | null;
  effectivePrice: number;
  nextBillingDue: string;
  isDueSoon: boolean;
  _count: { users: number; bottles: number };
}
interface Pagination { page: number; limit: number; total: number; totalPages: number }
interface Stats { paidMrr: number; dueSoon: number; paidShops: number }
type Filter = 'ALL' | 'PAID' | 'UNPAID' | 'DUE_SOON';

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function AdminDashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<Stats>({ paidMrr: 0, dueSoon: 0, paidShops: 0 });
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Shop | null>(null);
  const [tempIsPaid, setTempIsPaid] = useState(true);
  const [tempCustomPrice, setTempCustomPrice] = useState('');
  const [tempNextBilling, setTempNextBilling] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (page: number, f: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shops?page=${page}&limit=10&filter=${f}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load shops.');
      setShops(data.shops || []);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load shops.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, filter);
  }, [filter, load]);

  const openEdit = (shop: Shop) => {
    setEditing(shop);
    setTempIsPaid(shop.isPaid);
    setTempCustomPrice(shop.customPrice !== null ? String(shop.customPrice) : '');
    setTempNextBilling(shop.nextBillingDue.split('T')[0]);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: editing.id,
          isPaid: tempIsPaid,
          customPrice: tempCustomPrice === '' ? null : Number(tempCustomPrice),
          nextBillingDue: tempNextBilling ? new Date(tempNextBilling).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setEditing(null);
      await load(pagination.page, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ paid }: { paid: boolean }) => (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
        paid
          ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300'
      }`}
    >
      {paid ? 'PAID' : 'UNPAID'}
    </span>
  );

  return (
    <PageShell title="Admin Console" subtitle="Activate venues, override pricing and watch renewal dates.">
      {error && <div className="alert-error" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <div className="card space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Venues</span>
            <Building className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black">{pagination.total}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">In the current filter · {stats.paidShops} paid overall</p>
        </div>
        <div className="card space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paid MRR</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black">{money(stats.paidMrr)}</div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All paid shops, custom or standard price</p>
        </div>
        <div className="card space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Due within 7 days</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black">{stats.dueSoon}</div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Across all shops</p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold">Shop activations and billing</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Subscription state, custom pricing and renewal deadlines.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PAID', 'UNPAID', 'DUE_SOON'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`min-h-10 cursor-pointer rounded-xl px-3.5 text-xs font-bold transition ${
                  filter === tab
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => load(pagination.page, filter)}
              disabled={loading}
              aria-label="Refresh list"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No shops for filter <span className="font-bold">{filter.replace('_', ' ')}</span>.</div>
        ) : (
          <>
            {/* Phones and tablets: one card per shop */}
            <ul className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
              {shops.map((shop) => (
                <li key={shop.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400"><Store className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{shop.name}</p>
                        <p className="text-xs text-slate-500">{shop.shooterSize} ml shooter</p>
                      </div>
                    </div>
                    <StatusBadge paid={shop.isPaid} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Price</p>
                      <p className="font-bold">{money(shop.effectivePrice)}/mo</p>
                      <p className="text-[11px] text-slate-400">{shop.customPrice !== null ? `Custom (std ${money(shop.standardPrice)})` : 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Next billing</p>
                      <p className="font-mono font-bold">{new Date(shop.nextBillingDue).toLocaleDateString()}</p>
                      {shop.isDueSoon && <p className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> Due soon</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-500" /> {shop._count.users}</span>
                      <span className="inline-flex items-center gap-1"><Wine className="h-3.5 w-3.5 text-amber-500" /> {shop._count.bottles}</span>
                    </div>
                    <button onClick={() => openEdit(shop)} className="btn-secondary !min-h-10 !px-3 text-xs">
                      <Sliders className="h-3.5 w-3.5" /> Edit billing
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-6 py-3">Venue</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Next billing</th>
                    <th className="px-6 py-3">Users / bottles</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400"><Store className="h-4 w-4" /></div>
                          <div>
                            <span className="font-bold">{shop.name}</span>
                            <span className="block font-mono text-[11px] text-slate-400">{shop.shooterSize}ml · {shop.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge paid={shop.isPaid} /></td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold">{money(shop.effectivePrice)}/mo</span>
                        <span className="block text-[10px] text-slate-400">{shop.customPrice !== null ? `Custom (std ${money(shop.standardPrice)})` : 'Standard'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-mono">{new Date(shop.nextBillingDue).toLocaleDateString()}</span>
                        {shop.isDueSoon && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> Due soon</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-500" /> {shop._count.users}</span>
                          <span className="inline-flex items-center gap-1"><Wine className="h-3.5 w-3.5 text-amber-500" /> {shop._count.bottles}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(shop)} className="btn-secondary !min-h-9 !px-3 text-xs">
                          <Sliders className="h-3.5 w-3.5" /> Edit billing
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
            <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(pagination.page - 1, filter)} disabled={pagination.page <= 1 || loading} aria-label="Previous page" className="btn-secondary !min-h-10 !px-3"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => load(pagination.page + 1, filter)} disabled={pagination.page >= pagination.totalPages || loading} aria-label="Next page" className="btn-secondary !min-h-10 !px-3"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Edit billing: bottom sheet on phones, centred dialog on larger screens */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Edit billing for ${editing.name}`} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-5 rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold">{editing.name}</h3>
                <p className="text-xs text-slate-500">Standard price {money(editing.standardPrice)}/mo</p>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Close" className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"><X className="h-4 w-4" /></button>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
              <span className="text-sm font-semibold">Subscription paid</span>
              <input type="checkbox" checked={tempIsPaid} onChange={(e) => setTempIsPaid(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>

            <div>
              <label htmlFor="price" className="label">Custom monthly price ($)</label>
              <input id="price" type="number" inputMode="decimal" min="0" step="0.01" placeholder={`Leave empty for ${money(editing.standardPrice)}`} value={tempCustomPrice} onChange={(e) => setTempCustomPrice(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="due" className="label">Next billing date</label>
              <input id="due" type="date" value={tempNextBilling} onChange={(e) => setTempNextBilling(e.target.value)} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
