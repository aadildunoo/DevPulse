'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ExternalLink,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowLeft,
  TrendingUp,
  Building2,
  BookOpen,
  Check,
  FileText,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ArticleDetail } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';
import Image from 'next/image';
import { getArticleImage } from '@/lib/imageHelper';

export default function ArticleDetailPage() {
  return (
    <React.Suspense fallback={<div className="max-w-4xl mx-auto py-16 text-center text-sm font-mono text-slate-500">Loading publication...</div>}>
      <ArticleDetailContent />
    </React.Suspense>
  );
}

function ArticleDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getArticle(slug)
      .then((data) => {
        setArticle(data);
        try {
          const saved = JSON.parse(localStorage.getItem('devpulse_bookmarks') || '[]');
          if (Array.isArray(saved) && saved.includes(data.id)) {
            setBookmarked(true);
          }
        } catch {
          // ignore
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleBookmark = () => {
    if (!article) return;
    const nextState = !bookmarked;
    setBookmarked(nextState);

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

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="h-6 w-36 bg-slate-800 rounded animate-pulse" />
        <div className="h-16 w-full bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-6 w-3/4 bg-slate-800/60 rounded animate-pulse" />
        <div className="h-96 w-full bg-slate-900 border border-[#1e293b] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-slate-200">Article not found</h2>
        <p className="text-sm text-slate-400">The requested article could not be retrieved from the archives.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-400 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Front Page
        </Link>
      </div>
    );
  }

  const paragraphs = article.paragraphs && article.paragraphs.length > 0
    ? article.paragraphs
    : (article.body_paragraphs && article.body_paragraphs.length > 0
      ? article.body_paragraphs
      : [article.summary_raw || article.title]);

  const leadParagraph = paragraphs[0];
  const detailedParagraphs = paragraphs.slice(1);
  const imageInfo = getArticleImage(article);

  const getArticleTypeBadge = (type?: string) => {
    switch (type) {
      case 'market_report':
        return { label: 'Market Report', color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' };
      case 'technical_explainer':
        return { label: 'Technical Explainer', color: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30' };
      case 'company_analysis':
        return { label: 'Company Analysis', color: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30' };
      case 'major_development':
        return { label: 'Major Industry Development', color: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' };
      case 'breaking_news':
        return { label: 'Breaking News', color: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' };
      default:
        return { label: 'Technology News', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const typeBadge = getArticleTypeBadge(article.article_type);

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Newspaper Breadcrumbs */}
      <nav className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pt-2 border-b border-slate-200 dark:border-[#1e293b]/60 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>DevPulse</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{article.editorial_desk || 'Technology Desk'}</span>
          {article.category && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
              <Link href={`/?category=${article.category.slug}`} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                {article.category.name}
              </Link>
            </>
          )}
        </div>

        {/* Font Size & Action Tools */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-[#1e293b] rounded-lg p-0.5">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}
              title="Standard font size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded text-xs ${fontSize === 'large' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}
              title="Large font size"
            >
              A+
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1 p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            title="Print or export article"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Newspaper Headline & Byline Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {article.is_breaking && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-600 text-white shadow-sm shadow-rose-950/20">
              <Zap className="w-3.5 h-3.5 fill-white" />
              Breaking Development
            </span>
          )}

          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${typeBadge.color}`}>
            {typeBadge.label}
          </span>

          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            Signal {article.importance_score}/100
          </span>

          {/* Stock Tickers */}
          {article.stock_symbols?.map((sym) => (
            <Link
              key={sym}
              href={`/markets/${sym}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hover:border-cyan-400 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              ${sym}
            </Link>
          ))}
        </div>

        {/* Large Factual Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18] font-serif">
          {article.title}
        </h1>

        {/* Informative Subheadline */}
        {article.subheadline && (
          <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed font-sans border-l-2 border-indigo-600 dark:border-indigo-500 pl-4 py-1">
            {article.subheadline}
          </p>
        )}

        {/* Article Metadata Bar */}
        <div className="py-4 border-y border-slate-200 dark:border-[#1e293b] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Editorial Desk / Byline</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{article.author || article.editorial_desk || 'Technology Newsdesk'}</span>
            </div>

            <div className="border-l border-slate-200 dark:border-[#1e293b] pl-4">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Original Reporting</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{article.source.name}</span>
            </div>

            <div className="border-l border-[#1e293b] pl-4">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Published</span>
              <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {article.updated_at && article.updated_at !== article.published_at && (
              <div className="border-l border-[#1e293b] pl-4">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Updated</span>
                <span>{new Date(article.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}

            <div className="border-l border-slate-200 dark:border-[#1e293b] pl-4">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Reading Time</span>
              <span>{article.read_time_minutes} min read</span>
            </div>
          </div>

          {/* Social Share & Save Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-[#0c1222] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Copy article link to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                bookmarked
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-[#0c1222] text-slate-700 dark:text-slate-300'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Schema.org NewsArticle Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: article.title,
              datePublished: article.published_at,
              dateModified: article.updated_at || article.published_at,
              description: article.subheadline || article.title,
              author: {
                '@type': 'Person',
                name: article.author || article.editorial_desk || 'Technology Newsdesk',
              },
              publisher: {
                '@type': 'Organization',
                name: 'DevPulse',
                url: 'http://localhost:3000',
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': article.canonical_url,
              },
            }),
          }}
        />
      </header>

      {/* Featured Hero Article Image */}
      <div className="space-y-2">
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-slate-900 shadow-xl">
          <Image
            src={imageInfo.url}
            alt={imageInfo.caption}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 px-1 pt-1 gap-1">
          <span className="italic">{imageInfo.caption}</span>
          <span className="shrink-0 text-slate-500 dark:text-slate-500 font-semibold">{imageInfo.credit}</span>
        </div>
      </div>

      {/* Primary Newspaper Article Body */}
      <section className={`space-y-6 text-slate-800 dark:text-slate-200 leading-relaxed font-sans ${fontSize === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
        {/* Lead Paragraph (High Prominence) */}
        {leadParagraph && (
          <p className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 font-medium leading-relaxed tracking-normal border-b border-slate-200 dark:border-[#1e293b]/50 pb-6 first-letter:text-5xl first-letter:font-bold first-letter:text-indigo-600 dark:first-letter:text-indigo-400 first-letter:mr-2 first-letter:float-left">
            {leadParagraph}
          </p>
        )}

        {/* Detailed Reporting Paragraphs */}
        {detailedParagraphs.map((para, i) => (
          <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-300">
            {para}
          </p>
        ))}

        {/* Background & Context Section */}
        {article.background_context && (
          <div className="my-8 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0b101e] space-y-3 shadow-sm dark:shadow-inner">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
              <BookOpen className="w-4 h-4" />
              <span>Background & Context</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {article.background_context}
            </p>
          </div>
        )}

        {/* Why It Matters Section */}
        {article.why_it_matters_text && (
          <div className="my-8 p-6 sm:p-7 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-gradient-to-br dark:from-[#0c142b] dark:via-[#090e1c] dark:to-[#0c142b] space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
              <span>Why It Matters</span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
              {article.why_it_matters_text}
            </p>
          </div>
        )}

        {/* Technical or Business Implications Section */}
        {article.implications_analysis && (
          <div className="my-8 p-6 sm:p-7 rounded-2xl border border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/60 dark:bg-emerald-950/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Technical & Business Implications</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {article.implications_analysis}
            </p>
          </div>
        )}

        {/* What Happens Next Section */}
        {article.what_happens_next && (
          <div className="my-8 p-6 sm:p-7 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              <span>What Happens Next (Timeline to Watch)</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {article.what_happens_next}
            </p>
          </div>
        )}
      </section>

      {/* Sources & Further Reading Section */}
      <section className="p-6 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-800 dark:text-slate-300 font-bold">
              Sources & Further Reading (Attributed Evidence)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Transparent Attribution</span>
        </div>

        <div className="space-y-2.5">
          <a
            href={article.canonical_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#080c16] hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">{article.title}</span>
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono shrink-0">{article.source.name}</span>
          </a>

          {article.sources_and_references?.map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#080c16] hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">{ref.title}</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0">{ref.publisher}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Editorial Transparency & Errata Notice */}
      <section className="p-5 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#080c16] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Editorial Integrity & Corrections Policy</span>
          </div>
          <Link href="/contact" className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
            Submit Correction / Report Errata
          </Link>
        </div>

        {article.corrections && article.corrections.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
            {article.corrections.map((corr) => (
              <div key={corr.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-amber-700 dark:text-amber-400">
                  <span>Correction Applied</span>
                  <span>{new Date(corr.corrected_at).toLocaleString()}</span>
                </div>
                <p><strong>Correction:</strong> {corr.correction_text}</p>
                {corr.editor_notes && <p className="text-slate-600 dark:text-slate-400"><strong>Notes:</strong> {corr.editor_notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            DevPulse upholds strict standards of factual integrity. No errata or post-publication corrections have been recorded for this article. All factual claims are corroborated against authoritative primary documentation, regulatory filings, or direct maintainer announcements.
          </p>
        )}
      </section>

      {/* Related Stories from the Same Editorial Desk */}
      {article.related_articles && article.related_articles.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
              Related Coverage from {article.editorial_desk || 'the Desk'}
            </h3>
            <Link href="/" className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Stories →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {article.related_articles.map((item) => (
              <Link
                key={item.id}
                href={`/article/${item.slug}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#0f172a] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 block mb-1">
                    {item.editorial_desk || item.source_name}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 line-clamp-3 mb-2 font-serif leading-snug">
                    {item.title}
                  </h4>
                  {item.subheadline && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 font-sans">
                      {item.subheadline}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {new Date(item.published_at).toLocaleDateString()} • {item.read_time_minutes}m read
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
