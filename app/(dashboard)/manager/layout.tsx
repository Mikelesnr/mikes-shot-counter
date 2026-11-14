import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';

export default function ManagerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">Shop Operations & Security Control</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Manage bar staff PINs, calibrate bottle weights, and inspect terminal security logs.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full w-fit">
          <ShieldAlert className="w-3.5 h-3.5" /> Manager Clearance
        </span>
      </div>
      {children}
    </div>
  );
}