'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, Star, GitFork, ExternalLink, Tag, ShieldCheck, Filter, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Repository } from '@/lib/types';

export default function OpenSourcePage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .getRepositories({ language: languageFilter, search })
        .then((res) => setRepositories(res.results || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [languageFilter, search]);

  const languages = ['Rust', 'TypeScript', 'Python', 'JavaScript', 'Go'];

  const getMaintenanceBadge = (status: string) => {
    if (status === 'highly_active') {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
            Developer Tooling & Ecosystem
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Open Source Discovery & Maintained Repositories
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Curated directory of vital infrastructure, AI developer toolkits, compiler toolchains, and package runtimes. We distinguish real maintenance activity from star inflation.
        </p>
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
              placeholder="Search repository or topic..."
              className="w-full bg-[#0f1629] border border-[#1e293b] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setLanguageFilter('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                languageFilter === ''
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-[#0f1629] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
              }`}
            >
              All Languages
            </button>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageFilter(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                  languageFilter === lang
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-[#0f1629] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 self-end sm:self-auto">
          {repositories.length} indexed tools
        </span>
      </div>

      {/* Repositories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="p-5 rounded-xl border border-[#1e293b] bg-[#0c1222] hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-medium text-cyan-400">
                    {repo.owner} /
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${getMaintenanceBadge(
                        repo.maintenance_status
                      )}`}
                    >
                      {repo.maintenance_status.replace('_', ' ')}
                    </span>
                    <a
                      href={repo.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-white"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-1.5">
                  <a
                    href={repo.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    {repo.name}
                  </a>
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {repo.description}
                </p>
              </div>

              <div>
                {/* Topics */}
                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {repo.topics.slice(0, 4).map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Metrics */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      {repo.stars_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-slate-500" />
                      {repo.forks_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-300">{repo.primary_language}</span>
                    {repo.latest_release_tag && (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <Tag className="w-3 h-3" />
                        {repo.latest_release_tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
