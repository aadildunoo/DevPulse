'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Cpu, Shield, FileText, ArrowRight, Loader2, TrendingUp, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { SearchResponse } from '@/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-[#1e293b] gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search breaking stories, stock tickers (NVDA), companies, CVEs, or technologies..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-xs font-mono text-slate-500 dark:text-slate-400">
              Type at least 2 characters to search across all technology news, stocks, companies, CVEs, and frameworks.
            </div>
          )}

          {results && (
            <>
              {/* Technology Stocks & Companies */}
              {results.companies && results.companies.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2 font-semibold">
                    Technology Equities & Companies
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.companies.map((c) => (
                      <Link
                        key={c.id}
                        href={`/markets/${c.ticker}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0f1629] hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TrendingUp className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block truncate">
                              ${c.ticker} • {c.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{c.sector}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {results.technologies.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                    Technologies & Frameworks
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {results.technologies.map((t) => (
                      <Link
                        key={t.id}
                        href={`/tech/${t.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-lg border border-[#1e293b] bg-[#0f1629] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-medium text-slate-200">{t.name}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Advisories */}
              {results.advisories.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400 mb-2 font-semibold">
                    Security Advisories
                  </div>
                  <div className="space-y-1.5">
                    {results.advisories.map((adv) => (
                      <Link
                        key={adv.id}
                        href={`/security`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-lg border border-rose-950/40 bg-rose-950/10 hover:border-rose-700/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-xs font-mono text-rose-300 font-medium shrink-0">
                            {adv.cve_id || adv.advisory_id}
                          </span>
                          <span className="text-xs text-slate-300 truncate">{adv.title}</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0">
                          {adv.severity}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 mb-2 font-semibold">
                    DevPulse Newspaper Articles ({results.articles.length})
                  </div>
                  <div className="space-y-2">
                    {results.articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        onClick={onClose}
                        className="block p-3 rounded-xl border border-[#1e293b] bg-[#0f1629] hover:border-indigo-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-mono">
                          <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {article.editorial_desk || article.source_name}
                          </span>
                          <span className="text-slate-500">
                            {new Date(article.published_at).toLocaleDateString()}
                          </span>
                          <span className="text-emerald-400 ml-auto font-mono">
                            Signal {article.importance_score}/100
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2 font-serif">
                          {article.title}
                        </div>
                        {article.subheadline && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                            {article.subheadline}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.articles.length === 0 && results.technologies.length === 0 && (!results.companies || results.companies.length === 0) && results.advisories.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No direct matches found for &quot;{query}&quot;. Try broader technical keywords or company tickers.
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 border-t border-[#1e293b] bg-[#080c18] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>DevPulse Unified Index</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
