import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Scale, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Standards & Ethics
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Editorial & Source Verification Policy
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          How DevPulse collects, evaluates, ranks, and verifies technology developments for software engineers.
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            1. Core Principles
          </h2>
          <p>
            DevPulse is guided by four foundational rules:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Signal over noise:</strong> We prioritize substantive technical changes over corporate marketing announcements.</li>
            <li><strong>Evidence over hype:</strong> Benchmark claims require methodology disclosure and independent corroboration.</li>
            <li><strong>Context over clickbait:</strong> Headlines report concrete facts, not speculative sensationalism.</li>
            <li><strong>Practical value:</strong> Analysis answers what developers must do, what broke, and who is affected.</li>
          </ul>
        </section>

        <section className="space-y-3" id="sources">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. Source Tiers & Verification
          </h2>
          <p>
            Every ingested report is attributed to its origin and categorized under a transparent reliability tier:
          </p>
          <div className="space-y-2">
            <div className="p-3.5 rounded-lg border border-[#1e293b] bg-[#0c1222]">
              <span className="font-mono text-emerald-400 font-semibold block text-xs">Authoritative Tier</span>
              Official engineering blogs, direct repository release feeds, official security advisories (e.g. NIST, GitHub Advisory Database).
            </div>
            <div className="p-3.5 rounded-lg border border-[#1e293b] bg-[#0c1222]">
              <span className="font-mono text-indigo-400 font-semibold block text-xs">Verified Independent Tier</span>
              Reputable research institutes, audited security research laboratories, and established standards bodies.
            </div>
            <div className="p-3.5 rounded-lg border border-[#1e293b] bg-[#0c1222]">
              <span className="font-mono text-slate-400 font-semibold block text-xs">Community Curated Tier</span>
              Open-source discoveries and ecosystem feedback, flagged with uncertainty indicators until verified.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            3. Corrections & Transparency
          </h2>
          <p>
            When an error is detected or a vendor revises an advisory, DevPulse publishes a transparent correction notice directly attached to the affected intelligence report, maintaining a complete revision record.
          </p>
        </section>
      </div>
    </div>
  );
}
