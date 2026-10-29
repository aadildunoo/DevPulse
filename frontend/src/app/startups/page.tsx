'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Article } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function StartupsDeskPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getArticles({ category: 'startups-funding' })
      .then((res) => {
        if (res.results && res.results.length > 0) {
          setArticles(res.results);
        } else {
          api.getArticles({ event_type: 'funding_round' })
            .then((r2) => setArticles(r2.results || []))
            .catch(() => {});
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
          <Rocket className="w-4 h-4" />
          <span>DevPulse Venture Desk</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
          Startups & Venture Capital Desk
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Reporting on emerging technology startups, venture capital rounds (Seed to Growth), foundation model valuations, founder departures, and ecosystem business model innovations.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900 border border-[#1e293b] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-[#1e293b] rounded-2xl bg-[#0c1222] space-y-3">
          <p className="text-sm font-mono text-slate-400">No active venture capital reports at this hour.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-indigo-400 font-semibold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Front Page
          </Link>
        </div>
      )}
    </div>
  );
}
