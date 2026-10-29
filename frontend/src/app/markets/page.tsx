'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Building2,
  DollarSign,
  ArrowRight,
  Bookmark,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Filter,
  BarChart3,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MarketOverview, StockQuote, Article, WatchlistItem, FinancialResult } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function MarketsDashboardPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [marketArticles, setMarketArticles] = useState<Article[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'gainers' | 'losers' | 'most_active' | 'mega_caps'>('gainers');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortField, setSortField] = useState('market_cap');
  const [loading, setLoading] = useState(true);
  const [newTickerInput, setNewTickerInput] = useState('');
  const [watchlistMsg, setWatchlistMsg] = useState('');

  const loadData = async () => {
    try {
      const [overviewData, stocksData, articlesData, watchlistData] = await Promise.all([
        api.getMarketOverview().catch(() => null),
        api.getStocks({ sort: sortField, sector: sectorFilter, search: searchTerm }).catch(() => ({ count: 0, session: null, results: [] })),
        api.getArticles({ category: 'tech-markets' }).catch(() => ({ count: 0, next: null, previous: null, results: [] })),
        api.getWatchlist().catch(() => ({ items: [] })),
      ]);

      if (overviewData) setOverview(overviewData);
      setStocks(stocksData.results || []);
      setMarketArticles(articlesData.results || []);
      setWatchlist(watchlistData.items || []);
    } catch (err) {
      console.error('Failed to load markets dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sectorFilter, sortField]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    api.getStocks({ sort: sortField, sector: sectorFilter, search: searchTerm })
      .then((res) => setStocks(res.results || []))
      .catch((err) => console.error(err));
  };

  const handleAddToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerInput.trim()) return;
    try {
      const res = await api.addToWatchlist(newTickerInput.trim().toUpperCase());
      setWatchlistMsg(`Added ${newTickerInput.toUpperCase()} to watchlist.`);
      setNewTickerInput('');
      const updated = await api.getWatchlist();
      setWatchlist(updated.items || []);
      setTimeout(() => setWatchlistMsg(''), 3000);
    } catch (err: any) {
      setWatchlistMsg('Failed to add ticker (sign in required or invalid symbol).');
      setTimeout(() => setWatchlistMsg(''), 4000);
    }
  };

  const handleRemoveFromWatchlist = async (ticker: string) => {
    try {
      await api.removeFromWatchlist(ticker);
      setWatchlist(watchlist.filter((item) => item.company.ticker !== ticker));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 space-y-8 px-4">
        <div className="h-10 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 border border-[#1e293b] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentSession = overview?.session;

  return (
    <div className="space-y-10 pb-20">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>DevPulse Financial Newsroom</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-serif">
          Technology Stock Markets Desk
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive market intelligence covering public technology equities, semiconductor supply chains, hyperscaler cloud capex, quarterly earnings results, and market-moving industry developments.
        </p>

        {/* Market Session & Data Freshness Ribbon */}
        {currentSession && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[#1e293b] bg-[#0c1222] text-xs font-mono mt-4">
            <div className="flex items-center gap-2.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentSession.is_open ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-bold text-slate-200">{currentSession.status}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{currentSession.eastern_time}</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>Next: {currentSession.next_session}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                15m Delayed Quotes • Non-Brokerage
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Major Technology Indices Grid */}
      {overview && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Benchmark Technology Indices
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Official Exchange Feeds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overview.indices.map((idx) => {
              const numChange = Number(idx.change);
              const numChangePct = Number(idx.change_percent);
              const isPositive = numChange >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="p-5 rounded-xl border border-[#1e293b] bg-[#0c1222] hover:border-indigo-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">{idx.symbol}</span>
                    <span className="text-[10px] font-mono text-slate-500">{idx.exchange || 'INDEX'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block truncate">{idx.name}</span>
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">
                      {Number(idx.current_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#1e293b]/70">
                    <span className="text-slate-500">Day Change:</span>
                    <span className={`font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{numChange.toFixed(2)} ({isPositive ? '+' : ''}{numChangePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Market Movers & Active Desk Tabs */}
      {overview && (
        <section className="p-6 sm:p-7 rounded-2xl border border-[#1e293b] bg-[#090e1a] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Market Movers & Segment Leaders</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Evidence-grounded equity performances across publicly listed technology corporations
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0c1222] border border-[#1e293b] rounded-xl text-xs font-mono">
              <button
                onClick={() => setSelectedTab('gainers')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedTab === 'gainers' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setSelectedTab('losers')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedTab === 'losers' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Top Losers
              </button>
              <button
                onClick={() => setSelectedTab('most_active')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedTab === 'most_active' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Most Active
              </button>
              <button
                onClick={() => setSelectedTab('mega_caps')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedTab === 'mega_caps' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Mega-Cap Tech
              </button>
            </div>
          </div>

          {/* Movers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview[selectedTab].map((q) => {
              const numChangePct = Number(q.change_percent);
              const isPositive = numChangePct >= 0;
              return (
                <Link
                  key={q.id}
                  href={`/markets/${q.ticker}`}
                  className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] hover:border-indigo-500/50 hover:bg-[#0f172a] transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      ${q.ticker}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {isPositive ? '+' : ''}{numChangePct.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 truncate max-w-[160px]">{q.company_name}</span>
                    <span className="font-mono text-sm font-bold text-slate-200">
                      ${Number(q.current_price).toFixed(2)}
                    </span>
                  </div>

                  {q.movement_context && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-[#1e293b]/60 leading-relaxed font-sans">
                      {q.movement_context}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Technology Stocks Directory Table */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Covered Technology Equities Universe</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Filter by sector or search ticker/company name. All prices reflect 15-minute delayed session data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0c1222] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-52"
              />
            </form>

            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0c1222] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Tech Sectors</option>
              <option value="Semiconductors">Semiconductors</option>
              <option value="Cloud & Enterprise Software">Cloud & Enterprise Software</option>
              <option value="Consumer Technology">Consumer Technology</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="AI & Defense Software">AI & Defense</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0c1222] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="market_cap">Sort: Market Cap</option>
              <option value="change_percent_desc">Sort: % Gainers</option>
              <option value="change_percent_asc">Sort: % Losers</option>
              <option value="volume_desc">Sort: Volume</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Equities Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#0c1222]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080d1a] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Change</th>
                <th className="py-3 px-4 text-right">% Change</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">Market Cap</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">P/E Ratio</th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">Volume</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
              {stocks.map((stock) => {
                const numChange = Number(stock.change);
                const numChangePct = Number(stock.change_percent);
                const isPositive = numChange >= 0;
                return (
                  <tr key={stock.id} className="hover:bg-slate-850/40 hover:bg-[#0f172a] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <Link href={`/markets/${stock.ticker}`} className="hover:text-cyan-300 transition-colors">
                        ${stock.ticker}
                        <span className="block font-normal text-[11px] text-slate-400 font-sans">{stock.company_name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {stock.sector}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      ${Number(stock.current_price).toFixed(2)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{numChange.toFixed(2)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{numChangePct.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 hidden sm:table-cell">
                      {stock.market_cap_formatted || (stock.market_cap ? `$${(stock.market_cap / 1e9).toFixed(1)}B` : '—')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 hidden md:table-cell">
                      {stock.pe_ratio ? Number(stock.pe_ratio).toFixed(1) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 hidden lg:table-cell">
                      {stock.volume.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/markets/${stock.ticker}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20"
                      >
                        Detail
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Watchlist Manager */}
      <section className="p-6 sm:p-7 rounded-2xl border border-[#1e293b] bg-[#0c1222] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-bold text-white font-serif">Personal Technology Stocks Watchlist</h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Track your prioritized technology corporations and earnings announcements
            </p>
          </div>

          <form onSubmit={handleAddToWatchlist} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add ticker (e.g. NVDA)..."
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#080c16] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Watch</span>
            </button>
          </form>
        </div>

        {watchlistMsg && (
          <p className="text-xs font-mono text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/30">
            {watchlistMsg}
          </p>
        )}

        {watchlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[#1e293b] bg-[#080c16] flex items-center justify-between gap-3"
              >
                <div>
                  <Link href={`/markets/${item.company.ticker}`} className="font-mono text-sm font-bold text-white hover:text-cyan-300 transition-colors">
                    ${item.company.ticker}
                  </Link>
                  <span className="block text-[11px] text-slate-400 truncate max-w-[130px] font-sans">
                    {item.company.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.quote && (
                    <span className="text-xs font-mono font-bold text-slate-200">
                      ${Number(item.quote.current_price).toFixed(2)}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveFromWatchlist(item.company.ticker)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono italic">
            Your technology watchlist is currently empty. Add ticker symbols above or sign in to synchronize across devices.
          </p>
        )}
      </section>

      {/* Technology Markets Financial Newsfeed */}
      {marketArticles.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white font-serif">Markets & Financial Results Coverage</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Investigative reporting on semiconductor economics, cloud growth, and Big Tech earnings
              </p>
            </div>
            <Link href="/?category=tech-markets" className="text-xs font-mono text-indigo-400 hover:text-indigo-300">
              All Market Articles →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
