'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

// Add, rename, change the PIN of, and remove people in one shop.
// Managers use it for their own shop (no shopId needed); owners pass the shop they are managing.
export function StaffManager({ shopId, canEditManagers = false, onChange }: { shopId?: string; canEditManagers?: boolean; onChange?: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const query = shopId ? `?shopId=${encodeURIComponent(shopId)}` : '';

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff${query}`);
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
      else setMsg({ ok: false, text: data.error || 'Could not load people.' });
    } catch {
      setMsg({ ok: false, text: 'Network error while loading people.' });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const call = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Something went wrong.' });
        return false;
      }
      return true;
    } catch {
      setMsg({ ok: false, text: 'Network error. Please try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call('/api/staff', 'POST', { shopId, name: newName, pin: newPin })) {
      setNewName('');
      setNewPin('');
      setMsg({ ok: true, text: 'Staff member added. They can sign in with their PIN.' });
      void load();
    }
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditPin('');
    setRemovingId(null);
    setMsg(null);
  };

  const saveEdit = async (id: string) => {
    if (await call(`/api/staff/${id}`, 'PATCH', { name: editName, pin: editPin || undefined })) {
      setEditingId(null);
      setMsg({ ok: true, text: 'Saved.' });
      void load();
    }
  };

  const remove = async (id: string) => {
    if (await call(`/api/staff/${id}`, 'DELETE')) {
      setRemovingId(null);
      setMsg({ ok: true, text: 'Removed. They are signed out immediately.' });
      void load();
      onChange?.();
    }
  };

  const canTouch = (m: Member) => m.role === 'STAFF' || (canEditManagers && m.role === 'MANAGER');

  return (
    <div className="space-y-4">
      {msg && (
        <div className={msg.ok ? 'alert-success' : 'alert-error'} role="status">
          {msg.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
        <input type="text" required autoComplete="off" placeholder="Staff full name" aria-label="Staff full name" value={newName} onChange={(e) => setNewName(e.target.value)} className="input" />
        <input type="password" inputMode="numeric" required maxLength={4} pattern="\d{4}" autoComplete="new-password" placeholder="4-digit PIN" aria-label="4-digit PIN" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="input font-mono tracking-widest" />
        <button type="submit" disabled={busy} className="btn-primary">
          <UserPlus className="h-4 w-4" /> Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading people...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No one here yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => (
            <li key={m.id} className="py-3">
              {editingId === m.id ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Name" className="input" />
                  <input type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" placeholder="New PIN (optional)" aria-label="New PIN" value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))} className="input font-mono tracking-widest" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(m.id)} disabled={busy} aria-label="Save" className="btn-primary !px-3"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancel" className="btn-secondary !px-3"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {m.role === 'MANAGER' ? 'Manager' : 'Staff'}
                      {m.email ? ` · ${m.email}` : ''}
                    </p>
                  </div>
                  {canTouch(m) &&
                    (removingId === m.id ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-rose-600 sm:inline dark:text-rose-400">Remove {m.name.split(' ')[0]}?</span>
                        <button onClick={() => remove(m.id)} disabled={busy} className="btn-danger !min-h-10 !px-3 text-xs">Yes, remove</button>
                        <button onClick={() => setRemovingId(null)} aria-label="Cancel" className="btn-secondary !min-h-10 !px-3"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => startEdit(m)} aria-label={`Edit ${m.name}`} className="btn-secondary !min-h-10 !px-3"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { setRemovingId(m.id); setEditingId(null); }} aria-label={`Remove ${m.name}`} className="btn-danger !min-h-10 !px-3"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
