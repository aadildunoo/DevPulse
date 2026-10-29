'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Bookmark,
  Share2,
  Check,
  FileText,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StockQuote, Company, FinancialResult, Article } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function StockDetailPage() {
  const params = useParams();
  const ticker = (params?.ticker as string)?.toUpperCase();

  const [quoteData, setQuoteData] = useState<{
    quote: StockQuote;
    company: Company;
    financials: FinancialResult[];
    related_articles: Article[];
    session: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    api.getStock(ticker)
      .then((data) => {
        setQuoteData(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Check watchlist state
    api.getWatchlist()
      .then((res) => {
        const isWatching = res.items?.some((i) => i.company.ticker === ticker);
        setBookmarked(isWatching);
      })
      .catch(() => {});
  }, [ticker]);

  const toggleWatchlist = async () => {
    if (!quoteData) return;
    const nextState = !bookmarked;
    setBookmarked(nextState);
    try {
      if (nextState) {
        await api.addToWatchlist(ticker);
      } else {
        await api.removeFromWatchlist(ticker);
      }
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 space-y-6 px-4">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-16 w-full bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-slate-900 border border-[#1e293b] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-slate-200">Stock Symbol Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested ticker symbol <strong>{ticker}</strong> is not currently tracked in the technology universe.
        </p>
        <Link href="/markets" className="inline-flex items-center gap-2 text-sm text-indigo-400 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Markets Desk
        </Link>
      </div>
    );
  }

  const { quote, company, financials, related_articles, session } = quoteData;
  const numChange = Number(quote.change);
  const numChangePct = Number(quote.change_percent);
  const isPositive = numChange >= 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-b border-[#1e293b]/60 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            DevPulse
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <Link href="/markets" className="text-cyan-400 hover:underline">
            Markets Desk
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-200 font-bold">${company.ticker}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0c1222] text-xs text-slate-300 hover:text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              bookmarked
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                : 'border-[#1e293b] bg-[#0c1222] text-slate-300 hover:border-slate-700'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-cyan-400' : ''}`} />
            <span>{bookmarked ? 'Watching' : 'Add Watchlist'}</span>
          </button>
        </div>
      </nav>

      {/* Primary Stock Header & Live Metrics Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#1e293b] bg-[#090e1a] space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                ${company.ticker}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {company.exchange}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {company.sector}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-200 font-serif">
              {company.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {company.industry} • Headquartered in {company.headquarters || 'USA'}
            </p>
          </div>

          {/* Pricing Highlight Box */}
          <div className="text-right p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] shrink-0 min-w-[200px]">
            <span className="text-xs font-mono text-slate-400 block mb-0.5">Last Traded Price</span>
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white block">
              ${Number(quote.current_price).toFixed(2)}
            </span>
            <div className={`flex items-center justify-end gap-1 font-mono text-sm font-bold mt-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{numChange.toFixed(2)} ({isPositive ? '+' : ''}{numChangePct.toFixed(2)}%)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">
              {quote.market_status} • 15m Delayed
            </span>
          </div>
        </div>

        {/* Corporate Background Summary */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans border-t border-[#1e293b] pt-4">
          {company.description}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Market Cap</span>
            <span className="font-bold text-slate-200">{quote.market_cap_formatted || '—'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">P/E Ratio</span>
            <span className="font-bold text-slate-200">{quote.pe_ratio ? Number(quote.pe_ratio).toFixed(1) : 'N/A'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Trading Volume</span>
            <span className="font-bold text-slate-200">{quote.volume.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">52-Week Range</span>
            <span className="font-bold text-slate-200">${Number(quote.week_52_low || 0).toFixed(0)} - ${Number(quote.week_52_high || 0).toFixed(0)}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Previous Close</span>
            <span className="font-bold text-slate-200">${Number(quote.previous_close || 0).toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Next Earnings Date</span>
            <span className="font-bold text-indigo-300">{quote.earnings_date ? new Date(quote.earnings_date).toLocaleDateString() : 'TBA'}</span>
          </div>
        </div>

        {/* Evidence-based Context Commentary */}
        {quote.movement_context && (
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-cyan-300 font-mono">Market Movement Analysis</span>
              <p className="leading-relaxed font-sans">{quote.movement_context}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quarterly Financial Results & Earnings Disclosures */}
      {financials && financials.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">Quarterly Financial Results & CapEx</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Verified figures from official SEC Form 10-Q and 10-K filings
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Official Investor Relations</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#0c1222]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080d1a] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fiscal Period</th>
                  <th className="py-3 px-4">Report Date</th>
                  <th className="py-3 px-4 text-right">Quarterly Revenue</th>
                  <th className="py-3 px-4 text-right">YoY Growth</th>
                  <th className="py-3 px-4 text-right">Net Income</th>
                  <th className="py-3 px-4 text-right">EPS</th>
                  <th className="py-3 px-4 text-right">CapEx</th>
                  <th className="py-3 px-4">Official Filing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                {financials.map((fin) => (
                  <tr key={fin.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {fin.fiscal_period}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(fin.report_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      {fin.revenue_formatted}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                      +{Number(fin.revenue_growth_yoy || 0).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {fin.net_income_formatted || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-indigo-300">
                      ${Number(fin.eps || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {fin.capex_formatted || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {fin.source_filing_url && (
                        <a
                          href={fin.source_filing_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          SEC Filing
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Related DevPulse Newspaper Coverage */}
      {related_articles && related_articles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#1e293b]">
          <div>
            <h2 className="text-2xl font-bold text-white font-serif">
              DevPulse Coverage of {company.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Full-length newspaper reporting, technical analyses, and market developments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related_articles.map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
