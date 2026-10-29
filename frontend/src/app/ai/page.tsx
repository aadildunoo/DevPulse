'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, Sparkles, BookOpen, Scale, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Article } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function AIIntelligencePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getArticles({ category: 'ai-machine-learning', ordering: '-importance_score' })
      .then((res) => setArticles(res.results || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#0c1328] via-[#090d1a] to-[#131b36] p-6 lg:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Machine Learning & AI Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AI Foundation Models, Agents & Developer Productivity
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Rigorous coverage of LLM model releases, context architectures, coding assistants, agent frameworks, and hardware scaling. We prioritize reproducible evidence over promotional benchmarks.
          </p>
        </div>

        {/* Verification Standards Banner */}
        <div className="mt-6 pt-6 border-t border-[#1e293b]/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2 text-slate-400">
            <Scale className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Benchmark Auditing</span>
              Distinguishing vendor-reported claims from independent developer evaluation.
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Safety & Privacy</span>
              Tracking training data copyright, data retention policies, and enterprise compliance.
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Production Reliability</span>
              Monitoring inference latency, token pricing changes, and context degradation.
            </div>
          </div>
        </div>
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
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Analyzed AI Developments ({articles.length})
          </h2>
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
