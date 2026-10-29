import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of Use</h1>
        <p className="text-xs text-slate-400 font-mono">Last revised: October 2026</p>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
        <p>
          By accessing DevPulse, you agree to these terms of use. DevPulse provides aggregated news summaries, structured technical analysis, and security advisories for educational and professional software development guidance.
        </p>
        <h3 className="text-base font-bold text-white">Attribution and Intellectual Property</h3>
        <p>
          All referenced articles remain the intellectual property of their respective primary publishers. DevPulse produces original objective summaries, impact assessments, and technical synthesis under fair-use principles, always providing direct outbound links to primary sources.
        </p>
        <h3 className="text-base font-bold text-white">Security Advisories Disclaimer</h3>
        <p>
          While DevPulse strives for timely and accurate security disclosures, critical systems should always be audited directly against official vendor release channels and CVE authoritative databases prior to production deployment.
        </p>
      </div>
    </div>
  );
}
