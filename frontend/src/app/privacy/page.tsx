import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400 font-mono">Last revised: October 2026</p>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
        <p>
          DevPulse is designed with developer privacy by default. We collect only what is strictly necessary to provide personalized intelligence feeds and saved reading vault functionality.
        </p>
        <h3 className="text-base font-bold text-white">Data Collection</h3>
        <p>
          Anonymous visitors can browse all live news, framework releases, CVE security advisories, and daily briefings without creating an account or providing personal information.
        </p>
        <h3 className="text-base font-bold text-white">Bookmarks and Preferences</h3>
        <p>
          Bookmarks and followed technologies are persisted locally on your device by default, and optionally synchronized to your account profile if you register. We do not sell developer usage data or track personal browsing across external sites.
        </p>
      </div>
    </div>
  );
}
