import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Rss, Terminal, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-[#070a12] text-slate-600 dark:text-slate-400 mt-auto transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Philosophy */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base font-serif">DevPulse</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The developer-first global technology intelligence platform. Signal over noise. Evidence over hype. Practical value over vanity metrics.
            </p>
            <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
              Know what changed. Understand why it matters. Decide what to do next.
            </div>
          </div>

          {/* Intelligence Feeds */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200 font-semibold mb-3">
              Intelligence
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/live" className="hover:text-indigo-400 transition-colors">
                  Live News Ingestion
                </Link>
              </li>
              <li>
                <Link href="/ai" className="hover:text-indigo-400 transition-colors">
                  AI & Model Capabilities
                </Link>
              </li>
              <li>
                <Link href="/frameworks" className="hover:text-indigo-400 transition-colors">
                  Framework Releases & Deprecations
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-indigo-400 transition-colors">
                  Security Advisories & CVEs
                </Link>
              </li>
              <li>
                <Link href="/open-source" className="hover:text-indigo-400 transition-colors">
                  Open Source Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200 font-semibold mb-3">
              Editorial Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About DevPulse
                </Link>
              </li>
              <li>
                <Link href="/editorial" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Editorial & Source Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Contact & Errata Notices
                </Link>
              </li>
              <li>
                <Link href="/briefing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Executive Daily Briefing
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer API & System */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200 font-semibold mb-3">
              Developer Ecosystem
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/admin-dashboard" className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-indigo-600 dark:text-indigo-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Telemetry & Ingestion Ops
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:8001/api/v1/docs/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                  REST API & OpenAPI Docs
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8001/api/v1/health/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Platform Health Status
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8001/api/v1/articles/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Rss className="w-3.5 h-3.5 text-amber-500" />
                  Live Ingestion Stream
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-[#1e293b]/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div>
            © 2026 DevPulse. Engineered for software engineers, architects, and researchers.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Engineered with Next.js, Django & Python
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
