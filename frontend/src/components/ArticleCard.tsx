'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, Clock, ArrowRight, Zap, TrendingUp, Check } from 'lucide-react';
import { Article } from '@/lib/types';
import { api } from '@/lib/api';
import { getArticleImage } from '@/lib/imageHelper';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageInfo = getArticleImage(article);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('devpulse_bookmarks') || '[]');
      if (Array.isArray(saved) && saved.includes(article.id)) {
        setBookmarked(true);
      }
    } catch {
      // ignore
    }
  }, [article.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !bookmarked;
    setBookmarked(nextState);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    try {
      const saved = JSON.parse(localStorage.getItem('devpulse_bookmarks') || '[]');
      let updated: number[];
      if (nextState) {
        updated = Array.from(new Set([...saved, article.id]));
        api.addBookmark(article.id).catch(() => {});
      } else {
        updated = saved.filter((id: number) => id !== article.id);
        api.removeBookmark(article.id).catch(() => {});
      }
      localStorage.setItem('devpulse_bookmarks', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getArticleTypeLabel = (type?: string) => {
    switch (type) {
      case 'market_report':
        return 'Market Report';
      case 'technical_explainer':
        return 'Technical Explainer';
      case 'company_analysis':
        return 'Company Analysis';
      case 'major_development':
        return 'Major Development';
      case 'breaking_news':
        return 'Breaking News';
      default:
        return 'Technology News';
    }
  };

  return (
    <article
      className={`group relative rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xl dark:hover:shadow-indigo-950/20 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      <div>
        {/* Card Thumbnail Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <Link href={`/article/${article.slug}`} className="block w-full h-full">
            <Image
              src={imgError ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' : imageInfo.url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
              priority={featured}
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
          </Link>

          {/* Overlaid Desk Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            {article.is_breaking && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-950/40">
                <Zap className="w-3 h-3 fill-white" />
                Breaking
              </span>
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
              {article.editorial_desk || article.category_name || 'Technology News'}
            </span>
          </div>

          {/* Bookmark Button */}
          <div className="absolute top-3 right-3">
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm ${
                bookmarked
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-slate-950/70 border border-white/20 text-slate-200 hover:text-white hover:bg-slate-900/90'
              }`}
              title={bookmarked ? 'Saved to reading vault' : 'Save article'}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              {bookmarked ? (
                <Bookmark className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Bookmark Saved Toast */}
          {showToast && (
            <div className="absolute bottom-3 right-3 bg-indigo-600 text-white text-[10px] font-mono px-2.5 py-1 rounded shadow-md flex items-center gap-1 animate-in fade-in zoom-in-95">
              <Check className="w-3 h-3" />
              <span>{bookmarked ? 'Saved' : 'Removed'}</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Metadata Row */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{formatDate(article.published_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.read_time_minutes}m read
              </span>
            </div>

            {article.article_type && article.article_type !== 'standard_news' && (
              <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {getArticleTypeLabel(article.article_type)}
              </span>
            )}
          </div>

          {/* Headline */}
          <Link href={`/article/${article.slug}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            <h3
              className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif leading-snug line-clamp-2 ${
                featured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              }`}
            >
              {article.title}
            </h3>
          </Link>

          {/* Subheadline or Summary */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 font-sans">
            {article.subheadline || article.concise_summary || article.importance_explanation}
          </p>

          {/* Stock Tickers if present */}
          {((article.stock_symbols && article.stock_symbols.length > 0) || (article.primary_companies && article.primary_companies.length > 0)) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono">
              {article.stock_symbols?.map((sym) => (
                <Link
                  key={sym}
                  href={`/markets/${sym}`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500 transition-colors font-bold"
                >
                  <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ${sym}
                </Link>
              ))}
              {article.primary_companies?.slice(0, 2).map((comp) => (
                <span
                  key={comp}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400"
                >
                  {comp}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Source & Read link */}
      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 dark:border-[#1e293b]/70 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={article.source_name}>
          {article.source_name}
        </span>

        <Link
          href={`/article/${article.slug}`}
          className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors group-hover:translate-x-0.5 duration-150"
        >
          <span>Read Story</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  );
}
