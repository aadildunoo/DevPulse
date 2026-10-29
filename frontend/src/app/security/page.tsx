'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ShieldAlert, AlertTriangle, ExternalLink, Search, CheckCircle, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { SecurityAdvisory } from '@/lib/types';

export default function SecurityCenterPage() {
  const [advisories, setAdvisories] = useState<SecurityAdvisory[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdvisories = () => {
    setLoading(true);
    setError(null);
    api
      .getSecurityAdvisories({ severity: severityFilter, search })
      .then((res) => setAdvisories(res.results || []))
      .catch((err) => {
        console.warn('Security advisory fetch notice:', err);
        setError('Unable to reach DevPulse backend API. Please ensure the backend server is active on port 8001.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdvisories();
    }, 150);

    return () => clearTimeout(timer);
  }, [severityFilter, search]);


  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/40';
      case 'high':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/40';
      case 'medium':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/40';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#1b0d14] via-[#0d0914] to-[#120d20] p-6 lg:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              DevPulse Security Intelligence Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Common Vulnerabilities, CVEs & Supply-Chain Advisories
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time authoritative security notices ingested directly from primary vendor advisories, GitHub Advisory Database, and official security bulletins.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-[#1e293b] bg-[#0c1222]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CVE, package, or vulnerability..."
              className="w-full bg-[#0f1629] border border-[#1e293b] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {['', 'critical', 'high', 'medium'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-[#0f1629] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
                }`}
              >
                {sev || 'All'}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 self-end sm:self-auto">
          {advisories.length} advisories reported
        </span>
      </div>

      {/* Error / Offline Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAdvisories}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Advisory Cards List */}
      {loading ? (

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {advisories.map((adv) => (
            <div
              key={adv.id}
              className="p-5 rounded-xl border border-[#1e293b] bg-[#0c1222] hover:border-rose-500/40 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getSeverityStyle(
                        adv.severity
                      )}`}
                    >
                      {adv.severity} Severity
                    </span>
                    <span className="text-xs font-mono font-semibold text-rose-300">
                      {adv.cve_id || adv.advisory_id}
                    </span>
                    {adv.cve_id && adv.advisory_id !== adv.cve_id && (
                      <span className="text-[11px] font-mono text-slate-500">({adv.advisory_id})</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 hover:text-rose-300 transition-colors">
                    {adv.title}
                  </h3>
                </div>

                <a
                  href={adv.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-[#0f1629] border border-[#1e293b] text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 shrink-0"
                >
                  Advisory Link
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {adv.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1e293b] text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Affected Component</span>
                  <span className="font-mono text-slate-200">{adv.affected_product}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Affected Versions</span>
                  <span className="font-mono text-rose-300">{adv.affected_versions}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Patched Version</span>
                  <span className="font-mono text-emerald-400 font-semibold">{adv.patched_versions || 'See Advisory'}</span>
                </div>
              </div>

              {adv.remediation_guide && (
                <div className="bg-[#090d18] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-300">
                  <span className="font-semibold text-indigo-400 font-mono text-[11px] block mb-1">
                    Remediation Guideline:
                  </span>
                  {adv.remediation_guide}
                </div>
              )}
            </div>
          ))}

          {advisories.length === 0 && (
            <div className="text-center py-16 border border-[#1e293b] rounded-xl bg-[#0b101e] p-8">
              <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No security advisories match the specified query.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
