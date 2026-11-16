'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCheck, CheckCircle2, Clock, PlusCircle, Wine, Settings2, Trash2, AlertTriangle } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { StaffManager } from '@/components/StaffManager';

interface OwnerShop {
  id: string;
  name: string;
  shooterSize: number;
  isPaid: boolean;
  bottles: number;
  users: { id: string; name: string; email: string | null }[];
}

function ShopCard({ shop, onChanged }: { shop: OwnerShop; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(shop.name);
  const [size, setSize] = useState(String(shop.shooterSize));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typedName, setTypedName] = useState('');

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/owner/shops/${shop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, shooterSize: size }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: 'Shop details saved.' });
      onChanged();
    } else setMsg({ ok: false, text: data.error || 'Could not save.' });
  };

  const deleteShop = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/owner/shops/${shop.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmName: typedName }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) onChanged();
    else setMsg({ ok: false, text: data.error || 'Could not delete the shop.' });
  };

  return (
    <div className="card space-y-3 !p-4 sm:!p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{shop.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {shop.shooterSize} ml shooter ·{' '}
            <span className="inline-flex items-center gap-1">
              <Wine className="h-3 w-3" /> {shop.bottles} bottles
            </span>
          </p>
        </div>
        {shop.isPaid ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" /> Awaiting payment
          </span>
        )}
      </div>
      {shop.users?.[0] && (
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <UserCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          <span className="min-w-0 truncate">
            Manager: <span className="font-medium">{shop.users[0].name}</span> ({shop.users[0].email})
          </span>
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} className="btn-secondary w-full !min-h-10 text-xs" aria-expanded={open}>
        <Settings2 className="h-4 w-4" /> {open ? 'Close' : 'Manage shop and team'}
      </button>

      {open && (
        <div className="space-y-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          {msg && <div className={msg.ok ? 'alert-success' : 'alert-error'} role="status">{msg.text}</div>}

          <form onSubmit={saveDetails} className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
            <input type="text" required aria-label="Shop name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
            <input type="number" inputMode="decimal" step="0.5" min="1" required aria-label="Shooter size in ml" value={size} onChange={(e) => setSize(e.target.value)} className="input" />
            <button type="submit" disabled={busy} className="btn-primary">Save</button>
          </form>

          <div>
            <h4 className="label">Team (managers and staff)</h4>
            <StaffManager shopId={shop.id} canEditManagers onChange={onChanged} />
          </div>

          <div className="space-y-3 rounded-xl border border-rose-500/30 p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" /> Delete this shop
            </p>
            {confirmDelete ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This permanently deletes the shop, its bottles, and every manager and staff account in it. Type <span className="font-bold">{shop.name}</span> to confirm.
                </p>
                <input type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)} aria-label="Type the shop name to confirm" className="input" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setConfirmDelete(false); setTypedName(''); }} className="btn-secondary">Cancel</button>
                  <button onClick={deleteShop} disabled={busy || typedName !== shop.name} className="btn-danger">
                    <Trash2 className="h-4 w-4" /> Delete forever
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full">
                <Trash2 className="h-4 w-4" /> Delete shop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/owner/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setBusy(false);
      setError(data.error || 'Could not delete the account.');
    }
  };

  return (
    <section className="card space-y-3 !border-rose-200 dark:!border-rose-900/50">
      <h2 className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" /> Delete my account
      </h2>
      {open ? (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This permanently deletes your account, all of your shops, and every manager and staff account in them. Enter your password to confirm.
          </p>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <input type="password" required autoComplete="current-password" placeholder="Your password" aria-label="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setOpen(false); setPassword(''); setError(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={busy} className="btn-danger">
              <Trash2 className="h-4 w-4" /> {busy ? 'Deleting...' : 'Delete everything'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">Remove your owner account and everything that belongs to it.</p>
          <button onClick={() => setOpen(true)} className="btn-danger w-full sm:w-auto">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </>
      )}
    </section>
  );
}

export default function OwnerDashboardPage() {
  const [shops, setShops] = useState<OwnerShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [shopName, setShopName] = useState('');
  const [shooterSize, setShooterSize] = useState('25');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerPin, setManagerPin] = useState('');

  const loadShops = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error('Failed to load owner shops:', err);
    } finally {
      setLoadingShops(false);
    }
  }, []);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/owner/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, shooterSize, managerName, managerEmail, managerPassword, managerPin }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Could not create shop.');
        return;
      }
      setSuccessMsg(`"${data.shop.name}" created. Once Mike activates your subscription, your manager can sign in on the bar terminal.`);
      setShopName('');
      setShooterSize('25');
      setManagerName('');
      setManagerEmail('');
      setManagerPassword('');
      setManagerPin('');
      void loadShops();
    } catch {
      setLoading(false);
      setError('Network error while creating shop.');
    }
  };

  return (
    <PageShell title="Shop Owner Portal" subtitle="Create shops, set shooter sizes and assign a manager.">
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <form onSubmit={handleCreateShop} className="card space-y-5 lg:col-span-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
            <PlusCircle className="h-5 w-5" />
            <h2>Create a shop and its manager</h2>
          </div>

          {error && <div className="alert-error" role="alert">{error}</div>}
          {successMsg && <div className="alert-success" role="status">{successMsg}</div>}

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">1. Shop details</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="shopName" className="label">Shop / bar name</label>
                <input id="shopName" type="text" required placeholder="e.g. Downtown Lounge" value={shopName} onChange={(e) => setShopName(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="shooter" className="label">Shooter (ml)</label>
                <input id="shooter" type="number" inputMode="decimal" step="0.5" min="1" required value={shooterSize} onChange={(e) => setShooterSize(e.target.value)} className="input" />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">2. First shop manager</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="mName" className="label">Manager name</label>
                <input id="mName" type="text" required autoComplete="off" placeholder="Full name" value={managerName} onChange={(e) => setManagerName(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="mEmail" className="label">Manager email</label>
                <input id="mEmail" type="email" inputMode="email" required autoComplete="off" placeholder="manager@venue.com" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="mPass" className="label">Initial password</label>
                <input id="mPass" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="mPin" className="label">4-digit terminal PIN</label>
                <input id="mPin" type="password" inputMode="numeric" required maxLength={4} pattern="\d{4}" autoComplete="new-password" placeholder="e.g. 1234" value={managerPin} onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))} className="input font-mono tracking-widest" />
              </div>
            </div>
          </fieldset>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating shop...' : 'Create shop and manager'}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Store className="h-5 w-5 text-sky-500" />
            Your shops ({shops.length})
          </h2>

          {loadingShops ? (
            <div className="card animate-pulse text-sm text-slate-500">Loading...</div>
          ) : shops.length === 0 ? (
            <div className="card text-sm text-slate-500 dark:text-slate-400">
              No shops yet. Use the form to create your first shop and manager.
            </div>
          ) : (
            shops.map((shop) => <ShopCard key={shop.id} shop={shop} onChanged={loadShops} />)
          )}
        </div>
      </div>
      <DeleteAccount />
    </PageShell>
  );
}
