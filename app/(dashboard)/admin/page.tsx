'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  AlertTriangle,
  DollarSign,
  Building,
  RefreshCw,
  Sliders,
  Users,
  Wine,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
} from 'lucide-react';

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
  createdAt: string;
  _count: {
    users: number;
    bottles: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [shops, setShops] = useState<Shop[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'DUE_SOON'>('ALL');
  const [loading, setLoading] = useState(true);

  // Edit / Override State
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [tempIsPaid, setTempIsPaid] = useState<boolean>(true);
  const [tempCustomPrice, setTempCustomPrice] = useState<string>('');
  const [tempNextBilling, setTempNextBilling] = useState<string>('');

  // 1. Strict Role and Auth Guard Check on Mount
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

      if (parsed?.role?.toUpperCase() !== 'ADMIN') {
        // Not an admin - redirect to their respective fallback dashboard or counter
        const role = parsed?.role?.toUpperCase();
        if (role === 'OWNER') router.push('/dashboard');
        else if (role === 'MANAGER') router.push('/manager');
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

  const fetchShops = useCallback(async (targetPage = 1, currentFilter = filter) => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops?page=${targetPage}&limit=10&filter=${currentFilter}`);
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!authorized) return;
    let ignore = false;

    const loadShops = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/shops?page=1&limit=10&filter=${filter}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setShops(data.shops || []);
          setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to fetch shops:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadShops();

    return () => {
      ignore = true;
    };
  }, [filter, authorized]);

  const handleUpdateShop = async (shopId: string) => {
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          isPaid: tempIsPaid,
          customPrice: tempCustomPrice === '' ? null : Number(tempCustomPrice),
          nextBillingDue: tempNextBilling ? new Date(tempNextBilling).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setEditingShopId(null);
        fetchShops(pagination.page, filter);
      }
    } catch (err) {
      console.error('Failed to update shop billing:', err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Admin Privileges...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You must be logged in with an Administrator account to view this portal.
          </p>
        </div>
      </div>
    );
  }

  const totalMRR = shops
    .filter((s) => s.isPaid)
    .reduce((acc, s) => acc + s.effectivePrice, 0);

  const dueSoonCount = shops.filter((s) => s.isDueSoon).length;

  return (
    <div className="space-y-8 pb-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
      {/* Metrics Row */}
      <div className="grid sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Venues</span>
            <Building className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{pagination.total}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Filtered view count</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paid MRR (Current Page)</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">${totalMRR}</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Using custom or standard price</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Due Soon Flags</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{dueSoonCount}</div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Billing due within 7 days</p>
        </div>
      </div>

      {/* Venues Table Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
        {/* Header & Filter Tabs */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shop Activations & Billing</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage subscription states, override custom monthly pricing, and monitor renewal deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PAID', 'UNPAID', 'DUE_SOON'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filter === tab
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}

            <button
              onClick={() => fetchShops(pagination.page, filter)}
              disabled={loading}
              title="Refresh list"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-6">Venue Name</th>
                <th className="py-3 px-6">Status (isPaid)</th>
                <th className="py-3 px-6">Effective Price</th>
                <th className="py-3 px-6">Next Billing Due</th>
                <th className="py-3 px-6">Users / Bottles</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading shops from database...
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No shops found in the database for filter: <span className="font-bold">{filter}</span>.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => {
                  const isEditing = editingShopId === shop.id;
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{shop.name}</span>
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            ID: {shop.id} • {shop.shooterSize}ml
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tempIsPaid}
                              onChange={(e) => setTempIsPaid(e.target.checked)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                            />
                            <span className="text-xs font-bold">{tempIsPaid ? 'PAID' : 'UNPAID'}</span>
                          </label>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              shop.isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                            }`}
                          >
                            {shop.isPaid ? 'PAID' : 'UNPAID'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              placeholder={shop.standardPrice.toString()}
                              value={tempCustomPrice}
                              onChange={(e) => setTempCustomPrice(e.target.value)}
                              className="w-24 px-2 py-1 rounded border border-amber-500 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                            />
                            <span className="text-[10px] text-slate-400">custom</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ${shop.effectivePrice}/mo
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {shop.customPrice !== null ? `Custom (Std: $${shop.standardPrice})` : `Standard`}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs">
                        {isEditing ? (
                          <input
                            type="date"
                            value={tempNextBilling ? tempNextBilling.split('T')[0] : ''}
                            onChange={(e) => setTempNextBilling(e.target.value)}
                            className="px-2 py-1 rounded border border-amber-500 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                          />
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {new Date(shop.nextBillingDue).toLocaleDateString()}
                            </span>
                            {shop.isDueSoon && (
                              <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Due Soon
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-500" /> {shop._count.users}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wine className="w-3.5 h-3.5 text-amber-500" /> {shop._count.bottles}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateShop(shop.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingShopId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingShopId(shop.id);
                              setTempIsPaid(shop.isPaid);
                              setTempCustomPrice(shop.customPrice !== null ? shop.customPrice.toString() : '');
                              setTempNextBilling(shop.nextBillingDue);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Edit Billing</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchShops(pagination.page - 1, filter)}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchShops(pagination.page + 1, filter)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}