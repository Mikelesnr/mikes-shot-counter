'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLE_HOME } from '@/types/roles';
import { jsPDF } from 'jspdf';
import {
  KeyRound,
  ShieldCheck,
  Store,
  ChevronDown,
  ChevronUp,
  Download,
  Building2,
  Sparkles,
  CheckCircle2,
  Calculator,
} from 'lucide-react';

interface GuideSection {
  id: string;
  badge: string;
  title: string;
  summary: string;
  steps: string[];
}

const GUIDES: GuideSection[] = [
  {
    id: 'using-shot-counter',
    badge: 'Staff & Bar Guide',
    title: 'How to Use Mike’s Shot Counter (Daily Shift Weighing)',
    summary: 'Quick-start guide for weighing open spirits and reading exact remaining shots.',
    steps: [
      '1. Open the Login Terminal on the bar tablet or POS browser.',
      '2. Enter your personal 4-digit PIN (once the device is linked to your shop).',
      '3. Select the spirit bottle from your venue’s pre-calibrated bottle list.',
      '4. Place the open bottle onto your digital scale and enter the Current Weight (g).',
      '5. Read the exact remaining shots and remaining volume calculated using your shop’s shooter size.',
      'Security Rule: Staff cannot alter Full Weight, Empty Weight, or Shooter Size.',
    ],
  },
  {
    id: 'creating-shop-and-users',
    badge: 'Owner & Manager Guide',
    title: 'How to Create a Shop, Manager & Bar Staff Accounts',
    summary: 'Complete onboarding steps for Shop Owners and Shop Managers.',
    steps: [
      '1. Shop Owner Sign-Up: Click "Register as Shop Owner" and create your owner account with Email & Password.',
      '2. Create Your Shop: In the Owner Portal, enter your venue name, set your Shooter Size (e.g., 25 ml or 30 ml), and create your first Shop Manager (Email, Password, and 4-digit PIN).',
      '3. Subscription Activation: Once Mike activates your venue’s paid status, your Manager can sign in.',
      '4. Bind Bar Terminal: Have your Shop Manager sign in once with Email & Password on the bar device. This saves the Shop ID into local storage and switches the device to 4-Digit PIN mode.',
      '5. Add Bar Staff: Inside the Manager Dashboard, create staff profiles with unique 4-digit PINs.',
      '6. Security Auditing: Check the Failed PIN Attempts log on the Manager Dashboard to detect unauthorized guesses.',
    ],
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [openId, setOpenId] = useState<string | null>('using-shot-counter');

  const downloadPdf = (guide: GuideSection) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(180, 83, 9);
    doc.text("Mike's Shot Counter", 14, 22);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(guide.title, 14, 33);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    let y = 46;
    guide.steps.forEach((step) => {
      const wrapped = doc.splitTextToSize(step, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 7 + 4;
    });

    doc.save(`${guide.id}.pdf`);
  };

  return (
    <div className="flex flex-col text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-amber-50/70 via-white to-slate-50 dark:from-amber-950/15 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-24 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gravimetric Bar Inventory & Shrinkage Control</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                Stop Guessing Pour Counts.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-500">
                  Weigh Every Drop.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                Built for bar owners and managers who want exact shot counts in seconds—with locked tare weights, instant 4-digit staff PIN terminals, and failed-PIN audit alerts.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 pt-2">
                {user ? (
                  <Link
                    href={ROLE_HOME[user.role]}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-amber-500/25 transition"
                  >
                    <KeyRound className="w-4 h-4" />
                    Open my dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-amber-500/25 transition"
                    >
                      <KeyRound className="w-4 h-4" />
                      Open Bar Terminal / Sign In
                    </Link>
                    <Link
                      href="/owner/register"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-semibold shadow-xs transition"
                    >
                      <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Register as Shop Owner
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Live Visual Preview Card (Fully Adaptive Light & Dark) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Live Scale Calculation
                      </p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        Jameson Irish Whiskey (750 ml)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    25 ml Shooter
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Full Weight
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      1,190 g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Empty Weight
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      490 g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30">
                    <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                      Scale Weight
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-200">
                      840 g
                    </span>
                  </div>
                </div>

                {/* Adaptive Shot Result Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 border border-amber-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
                    Exact Shots Remaining
                  </span>
                  <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">15.0</div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    375.0 ml remaining • 50% bottle capacity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Smart Dual-Mode Login</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Owners sign in via email & password. Once a Manager binds the bar tablet, the terminal automatically switches to a fast 4-digit PIN pad with a 3-attempt lockout.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tamper-Proof Bottle Specs</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Bar staff can only input live scale weights and read shot counts. Full weights, empty weights, and shooter sizes are strictly locked to Managers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multi-Venue Control</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Configure custom shooter sizes per venue, monitor unauthorized PIN attempts, and export printable SOP guides for your bartenders.
            </p>
          </div>
        </div>
      </section>

      {/* Expandable Instructions & PDF Manuals */}
      <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 pb-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Setup & Operating Manuals
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Expand any guide below to read step-by-step instructions or download a printable PDF copy.
          </p>
        </div>

        <div className="space-y-4">
          {GUIDES.map((guide) => {
            const isOpen = openId === guide.id;
            return (
              <div
                key={guide.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : guide.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="space-y-1 pr-4">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {guide.badge}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{guide.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{guide.summary}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <button
                        onClick={() => downloadPdf(guide)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-sm font-bold transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download Guide as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}