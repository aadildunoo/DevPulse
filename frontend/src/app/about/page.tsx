import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Compass,
  Cpu,
  ShieldCheck,
  Code2,
  Terminal,
  Zap,
  Layers,
  Scale,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 pb-20">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      {/* Header */}
      <div className="space-y-4 border-b border-[#1e293b] pb-8">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Platform Overview & Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          DevPulse: The Developer-First Global Technology Intelligence Platform
        </h1>
        <p className="text-base text-slate-300 leading-relaxed max-w-3xl">
          Engineered for software engineers, systems architects, AI practitioners, security analysts, and researchers who require verified technical signal rather than promotional noise.
        </p>
      </div>

      {/* Core Objective: The 5 Essential Questions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400" />
          The Five Essential Questions
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Every report, advisory, and synthesis on DevPulse is engineered to answer five core questions for engineering teams:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
            <span className="text-xs font-mono font-bold text-cyan-400 block">01. What happened?</span>
            <p className="text-xs text-slate-300">
              Objective, verified facts regarding a model release, framework update, security advisory, or infrastructure change.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
            <span className="text-xs font-mono font-bold text-indigo-400 block">02. What changed?</span>
            <p className="text-xs text-slate-300">
              Specific breaking changes, deprecated APIs, architectural evolutions, runtime requirements, or CVSS attack vectors.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
            <span className="text-xs font-mono font-bold text-emerald-400 block">03. Why does it matter?</span>
            <p className="text-xs text-slate-300">
              Practical advantages balanced with trade-offs, performance overhead, vendor dependencies, and realistic limitations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 block">04. Who is affected?</span>
            <p className="text-xs text-slate-300">
              Precise systems, software versions, developer workflows, and tech stacks directly impacted by the change.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5 sm:col-span-2">
            <span className="text-xs font-mono font-bold text-rose-400 block">05. What actions should engineers take?</span>
            <p className="text-xs text-slate-300">
              Prioritized, actionable steps: whether to update immediately, audit dependencies, plan a migration sprint, or defer adoption.
            </p>
          </div>
        </div>
      </section>

      {/* Foundational Philosophy */}
      <section className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#0c1328] via-[#090d1a] to-[#121936] space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" />
          Our Core Philosophy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Signal over Noise</strong>
              We omit speculative social media trends and corporate marketing narratives in favor of tangible technical deliverables.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Evidence over Hype</strong>
              AI benchmark scores and performance numbers must disclose testing methodology and independent corroboration.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Context over Clickbait</strong>
              Headlines present objective facts. Analytical syntheses maintain a clear separation between source-reported reality and DevPulse evaluations.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Practical Value over Vanity Metrics</strong>
              Repository stars and social engagement are secondary to active maintenance, license clarity, and security advisories.
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Stack */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          Technical Architecture
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          DevPulse is architected as a modular, production-oriented application built on modern, battle-tested technologies:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-2">
            <span className="font-mono text-indigo-400 font-bold block">Frontend Command Center</span>
            <ul className="space-y-1 text-slate-300">
              <li>Next.js 16 (App Router)</li>
              <li>React 19 & TypeScript (Strict)</li>
              <li>Tailwind CSS Design System</li>
              <li>Keyboard Command Palette (`Cmd+K`)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-2">
            <span className="font-mono text-indigo-400 font-bold block">Backend & Intelligence API</span>
            <ul className="space-y-1 text-slate-300">
              <li>Python 3.12 / Django 6</li>
              <li>Django REST Framework</li>
              <li>OpenAPI 3 / drf-spectacular</li>
              <li>Pydantic Schema Validation</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-2">
            <span className="font-mono text-indigo-400 font-bold block">Ingestion & Security Engine</span>
            <ul className="space-y-1 text-slate-300">
              <li>Deterministic Heuristic Pipeline</li>
              <li>SSRF & Canonical Deduplication</li>
              <li>Conditional HTTP (ETag / Last-Modified)</li>
              <li>Automated Ingestion Scheduler</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
