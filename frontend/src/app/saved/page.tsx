'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Article } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function SavedArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSavedArticles = async () => {
      try {
        const savedIds: number[] = JSON.parse(localStorage.getItem('devpulse_bookmarks') || '[]');

        if (savedIds.length === 0) {
          // Check backend bookmarks as well
          const serverBookmarks = await api.getBookmarks().catch(() => null);
          if (serverBookmarks && serverBookmarks.results.length > 0) {
            setArticles(serverBookmarks.results.map((b) => b.article));
            setLoading(false);
            return;
          }
          setArticles([]);
          setLoading(false);
          return;
        }

        // Fetch articles
        const res = await api.getArticles({ ordering: '-published_at' });
        const allArticles = res.results || [];
        const matching = allArticles.filter((a) => savedIds.includes(a.id));
        setArticles(matching);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedArticles();
  }, []);

  const clearAllBookmarks = () => {
    localStorage.removeItem('devpulse_bookmarks');
    setArticles([]);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-5 border-b border-[#1e293b]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
              Personal Reading Vault
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Saved Articles & Research</h1>
        </div>

        {articles.length > 0 && (
          <button
            onClick={clearAllBookmarks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-950 bg-rose-950/20 text-xs text-rose-400 hover:bg-rose-900/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Vault
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-20 border border-[#1e293b] rounded-2xl bg-[#0b101e] p-8 space-y-4">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Your reading vault is currently empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Save articles across DevPulse by clicking the bookmark icon on any analysis card or story detail page to review later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Explore For You Feed
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
