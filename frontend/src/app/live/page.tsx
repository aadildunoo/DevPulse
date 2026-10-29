'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radio, RefreshCw, Filter, Zap, Clock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Article, Category, Source } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function LiveNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [breakingOnly, setBreakingOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLiveNews = async () => {
    try {
      const params: Record<string, string | boolean | undefined> = {
        ordering: '-published_at',
      };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSource) params.source = selectedSource;
      if (breakingOnly) params.is_breaking = true;

      const [articlesData, catsData, sourcesData] = await Promise.all([
        api.getArticles(params),
        categories.length === 0 ? api.getCategories() : Promise.resolve(categories),
        sources.length === 0 ? api.getSources() : Promise.resolve(sources),
      ]);

      setArticles(articlesData.results || []);
      if (categories.length === 0) setCategories(catsData || []);
      if (sources.length === 0) setSources(sourcesData || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load live news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
  }, [selectedCategory, selectedSource, breakingOnly]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchLiveNews();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Live Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Ingestion Feed
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Chronological Technology Wire</h1>
          <p className="text-xs text-slate-400 mt-1">
            Unfiltered chronological log of official releases, advisories, and engineering announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-right text-[11px] font-mono text-slate-500 hidden sm:block">
              <span>Last polled: {lastUpdated}</span>
            </div>
          )}
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0f1629] text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Wire
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[#1e293b] bg-[#0c1222]">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#0f1629] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-[#0f1629] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Primary Sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Breaking toggle */}
        <button
          onClick={() => setBreakingOnly(!breakingOnly)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            breakingOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-[#0f1629] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          <Zap className="w-3 h-3 text-rose-400" />
          Breaking / Critical Only
        </button>

        <span className="ml-auto text-xs font-mono text-slate-500">
          Showing {articles.length} events
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      )}

      {/* Chronological List */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-16 border border-[#1e293b] rounded-xl bg-[#0b101e] p-8">
          <p className="text-sm text-slate-400">No live news matches the selected filter criteria.</p>
        </div>
      )}
    </div>
  );
}
