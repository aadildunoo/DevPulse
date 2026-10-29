'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Code2, GitCommit, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Article, Technology } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function FrameworksPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string | undefined> = {
      category: 'programming-frameworks',
      ordering: '-published_at',
    };
    if (selectedTech) params.technology = selectedTech;

    Promise.all([
      api.getArticles(params),
      api.getTechnologies({ category: 'programming-frameworks' }),
    ])
      .then(([artRes, techRes]) => {
        setArticles(artRes.results || []);
        setTechnologies(techRes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedTech]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
            Languages, Runtimes & Frameworks
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Release Tracking, Breaking Changes & Migrations
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Authoritative updates from core maintainers of React, Next.js, TypeScript, Python, Django, Rust, and Go. Understand affected versions and upgrade consequences before running dependency bumps.
        </p>
      </div>

      {/* Technology Pill Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedTech('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
            selectedTech === ''
              ? 'bg-indigo-600 text-white font-semibold'
              : 'bg-[#0f1629] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
          }`}
        >
          All Frameworks
        </button>
        {technologies.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTech(t.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              selectedTech === t.slug
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-[#0f1629] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            Showing {articles.length} framework intelligence reports
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
