'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Cpu,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Users,
  Building2,
  Rocket,
  Code2,
  RefreshCw,
  Bookmark,
  Flame,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Article, Category, Technology, DailyBriefing, MarketOverview } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';
import { BreakingNewsTicker } from '@/components/BreakingNewsTicker';
import { getArticleImage } from '@/lib/imageHelper';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [breakingArticles, setBreakingArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [feedData, breakingData, trendingData, catsData, techsData, briefingData, marketData] = await Promise.all([
        api.getForYouFeed(),
        api.getBreakingNews().catch(() => ({ count: 0, results: [] })),
        api.getTrendingNews().catch(() => ({ count: 0, results: [] })),
        api.getCategories(),
        api.getTechnologies({ trending: true }),
        api.getDailyBriefing().catch(() => null),
        api.getMarketOverview().catch(() => null),
      ]);

      setArticles(feedData.results || []);
      setBreakingArticles(breakingData.results || []);
      setTrendingArticles(trendingData.results || []);
      setCategories(catsData || []);
      setTechnologies(techsData || []);
      if (briefingData) setBriefing(briefingData);
      if (marketData) setMarketOverview(marketData);
    } catch (err) {
      console.error('Failed to load DevPulse home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered articles
  const filteredArticles = articles.filter((a) => {
    if (selectedCategory !== 'all' && a.category_slug !== selectedCategory) {
      return false;
    }
    return true;
  });

  const leadStory = filteredArticles[0] || articles[0];
  const leadImageInfo = getArticleImage(leadStory);
  const secondaryStories = filteredArticles.filter((a) => a.id !== leadStory?.id).slice(0, 3);
  const remainingStories = filteredArticles.filter(
    (a) => a.id !== leadStory?.id && !secondaryStories.some((s) => s.id === a.id)
  );

  // Category specific groupings
  const aiArticles = articles.filter((a) => a.category_slug === 'ai-machine-learning').slice(0, 3);
  const marketArticles = articles
    .filter((a) => a.category_slug === 'tech-markets' || (a.stock_symbols && a.stock_symbols.length > 0))
    .slice(0, 3);
  const layoffArticles = articles
    .filter((a) => a.category_slug === 'tech-layoffs' || a.primary_event_type === 'tech_layoffs')
    .slice(0, 3);
  const devArticles = articles
    .filter((a) => a.category_slug === 'programming-frameworks' || a.category_slug === 'developer-tools')
    .slice(0, 3);
  const securityArticles = articles
    .filter((a) => a.category_slug === 'cybersecurity' || a.primary_event_type === 'security_vulnerability')
    .slice(0, 3);

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Front Page Newspaper Masthead */}
      <section className="text-center pt-2 pb-2 border-b-2 border-slate-300 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e293b]/60 pb-2.5">
          <span className="font-bold text-slate-700 dark:text-slate-300">VOL. IV • NO. 102</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDateFormatted}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold hidden sm:inline">GLOBAL TECHNOLOGY EDITION</span>
        </div>

        <div className="py-2">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-serif tracking-tight text-slate-900 dark:text-white">
            The DevPulse Chronicle
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 tracking-wider uppercase mt-1">
            Technology Journalism • Systems Architecture • Financial Markets Desk
          </p>
        </div>

        {/* Prominent Breaking News Ticker */}
        {breakingArticles.length > 0 && (
          <div className="pt-2">
            <BreakingNewsTicker initialStories={breakingArticles} />
          </div>
        )}
      </section>

      {/* Quick Desk Category Bar */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-mono" aria-label="Editorial Desks">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-lg border transition-all shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
              : 'border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:text-white'
          }`}
        >
          All Desks
        </button>
        {categories.slice(0, 10).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3.5 py-1.5 rounded-lg border transition-all shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                : 'border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </section>

      {/* Featured Lead Story Hero & Compact Markets Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prominent Lead Story (8 cols) */}
        {leadStory && (
          <div className="lg:col-span-8 space-y-6">
            <article className="group rounded-2xl border border-slate-200 dark:border-indigo-500/30 bg-white dark:bg-gradient-to-br dark:from-[#0c142b] dark:via-[#090e1c] dark:to-[#0c1222] shadow-xl overflow-hidden flex flex-col justify-between">
              {/* Large 16:9 Hero Photo */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <Link href={`/article/${leadStory.slug}`} className="block w-full h-full">
                  <Image
                    src={leadImageInfo.url}
                    alt={leadStory.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </Link>

                {/* Badges on Top of Lead Image */}
                <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-indigo-600 text-white shadow-md uppercase tracking-wider">
                    {leadStory.editorial_desk || 'Lead Industry Story'}
                  </span>
                  {leadStory.is_breaking && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-600 text-white shadow-md uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      Breaking
                    </span>
                  )}
                </div>

                {/* Photo Caption Overlay at Bottom */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="truncate italic drop-shadow">{leadImageInfo.caption}</span>
                  <span className="shrink-0 text-slate-400 drop-shadow ml-2">{leadImageInfo.credit}</span>
                </div>
              </div>

              {/* Lead Story Editorial Body */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{new Date(leadStory.published_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{leadStory.read_time_minutes} min read</span>
                </div>

                {/* Lead Headline */}
                <Link href={`/article/${leadStory.slug}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif leading-[1.2]">
                    {leadStory.title}
                  </h2>
                </Link>

                {/* Informative Subheadline */}
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed font-sans border-l-2 border-indigo-600 dark:border-indigo-400 pl-4 py-0.5">
                  {leadStory.subheadline || leadStory.concise_summary}
                </p>

                {/* Byline & Source Attribution */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-[#1e293b] text-xs font-mono text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500">Byline:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {leadStory.author || leadStory.editorial_desk || 'Technology Desk'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-slate-400 dark:text-slate-500">Source:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{leadStory.source_name}</span>
                  </div>

                  {/* Stock Tickers if applicable */}
                  {leadStory.stock_symbols && leadStory.stock_symbols.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {leadStory.stock_symbols.map((sym) => (
                        <Link
                          key={sym}
                          href={`/markets/${sym}`}
                          className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500 font-bold"
                        >
                          ${sym}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read CTA Button */}
                <div className="pt-2">
                  <Link
                    href={`/article/${leadStory.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <span>Read Complete Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Right Column: Technology Markets Compact Desk (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm font-serif">Tech Markets Overview</h3>
              </div>
              <Link href="/markets" className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline">
                Markets Desk →
              </Link>
            </div>

            {marketOverview ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Session Pill */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {marketOverview.session.status}
                  </span>
                  <span>15m Delayed</span>
                </div>

                {/* Major Indices */}
                <div className="space-y-2">
                  {marketOverview.indices.slice(0, 3).map((idx) => {
                    const numChangePct = Number(idx.change_percent);
                    const isPositive = numChangePct >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-[#1e293b]/60"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{idx.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{idx.symbol}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-900 dark:text-slate-100 font-bold block">
                            {Number(idx.current_value).toLocaleString()}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {numChangePct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Top Movers Highlight */}
                <div className="pt-2 border-t border-slate-200 dark:border-[#1e293b]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2">
                    Notable Tech Movers
                  </span>
                  <div className="space-y-1.5">
                    {marketOverview.gainers.slice(0, 3).map((g) => (
                      <Link
                        key={g.id}
                        href={`/markets/${g.ticker}`}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#0f172a] transition-colors"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-300">${g.ticker}</span>
                        <span className="text-slate-500 dark:text-slate-400">{g.company_name.split(' ')[0]}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          +{Number(g.change_percent).toFixed(2)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">Loading financial market data...</p>
            )}
          </div>

          {/* Daily Briefing Teaser */}
          {briefing && (
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-[#090e1a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Morning Briefing
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(briefing.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm font-serif line-clamp-2">
                {briefing.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 font-sans">
                {briefing.overview.split('\n')[0]}
              </p>
              <Link
                href="/briefing"
                className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                Read Full Briefing Edition →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Trending Technology Stories (Ranked High-Signal List) */}
      {trendingArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                Trending Across Technology Desks
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">High Reader Engagement</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingArticles.slice(0, 4).map((trend, idx) => {
              const trendImg = getArticleImage(trend);
              return (
                <Link
                  key={trend.id}
                  href={`/article/${trend.slug}`}
                  className="group p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c1222] hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                        0{idx + 1}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        {trend.editorial_desk || trend.category_name}
                      </span>
                    </div>

                    <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <Image
                        src={trendImg.url}
                        alt={trend.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-serif line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {trend.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#1e293b]/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{trend.read_time_minutes}m read</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Signal {trend.importance_score}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Secondary Headlines (3-Column Newspaper Grid) */}
      {secondaryStories.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
              Major Industry Developments
            </h2>
            <span className="text-xs font-mono text-slate-500">Cross-Desk Reporting</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondaryStories.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Section: AI & Emerging Technology */}
      {aiArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                AI & Machine Learning Desk
              </h2>
            </div>
            <Link href="/ai" className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
              View All AI Coverage →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiArticles.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Section: Technology Stock Markets */}
      {marketArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                Technology Markets & Semiconductor Equities
              </h2>
            </div>
            <Link href="/markets" className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline">
              View All Market Coverage →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketArticles.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Section: Tech Layoffs & Workforce */}
      {layoffArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                Tech Layoffs & Workforce Recalibration
              </h2>
            </div>
            <Link href="/layoffs" className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline">
              View All Workforce Reporting →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {layoffArticles.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Section: Software Architecture & Developer News */}
      {devArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                Software Engineering & Framework Architecture
              </h2>
            </div>
            <Link href="/frameworks" className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline">
              View All Architecture News →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {devArticles.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Section: Cybersecurity Operations */}
      {securityArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
                Cybersecurity Operations & Vulnerability Intelligence
              </h2>
            </div>
            <Link href="/security" className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline">
              View All Security Advisories →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {securityArticles.map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* Remaining News Stream */}
      {remainingStories.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif tracking-tight">
              Latest Continuous Ingestion Wire
            </h2>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Wire</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingStories.slice(0, 9).map((story) => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
