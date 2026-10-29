'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company, StockQuote, FinancialResult, Article } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function CompanyProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [companyData, setCompanyData] = useState<{
    company: Company;
    quote: StockQuote | null;
    financials: FinancialResult[];
    related_news: Article[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getCompany(slug)
      .then((data) => setCompanyData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 space-y-6 px-4">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-16 w-full bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-slate-900 border border-[#1e293b] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-slate-200">Company Profile Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested company profile could not be located in our verified business universe.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-400 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Front Page
        </Link>
      </div>
    );
  }

  const { company, quote, financials, related_news } = companyData;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pt-2 border-b border-[#1e293b]/60 pb-3">
        <Link href="/" className="hover:text-slate-200 transition-colors">
          DevPulse
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <Link href="/markets" className="hover:text-slate-200 transition-colors">
          Markets & Companies
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-200 font-bold">{company.name}</span>
      </nav>

      {/* Primary Company Profile Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#1e293b] bg-[#090e1a] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {company.sector}
              </span>
              {company.ticker && (
                <Link
                  href={`/markets/${company.ticker}`}
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-colors"
                >
                  ${company.ticker} ({company.exchange})
                </Link>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
              {company.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {company.industry} • {company.headquarters}
            </p>
          </div>

          {quote && (
            <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] text-right font-mono min-w-[160px]">
              <span className="text-[10px] text-slate-500 block uppercase">Share Price</span>
              <span className="text-2xl font-bold text-white block">${Number(quote.current_price).toFixed(2)}</span>
              <span className={`text-xs font-semibold ${Number(quote.change) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(quote.change) >= 0 ? '+' : ''}{Number(quote.change_percent).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans border-t border-[#1e293b] pt-4">
          {company.description}
        </p>

        {/* Corporate Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Chief Executive</span>
            <span className="font-bold text-slate-200">{company.ceo || '—'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Founded Year</span>
            <span className="font-bold text-slate-200">{company.founded_year || '—'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Headcount</span>
            <span className="font-bold text-slate-200">{company.employee_count ? company.employee_count.toLocaleString() : '—'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1222] border border-[#1e293b]">
            <span className="text-slate-500 block text-[10px]">Official Website</span>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                Visit Site <ExternalLink className="w-3 h-3" />
              </a>
            ) : '—'}
          </div>
        </div>
      </div>

      {/* Financial Filings History */}
      {financials && financials.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white font-serif">Quarterly Financial Disclosures</h2>
          <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#0c1222]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080d1a] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Report Date</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">YoY Growth</th>
                  <th className="py-3 px-4 text-right">Net Income</th>
                  <th className="py-3 px-4 text-right">EPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                {financials.map((fin) => (
                  <tr key={fin.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{fin.fiscal_period}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(fin.report_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">{fin.revenue_formatted}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">+{Number(fin.revenue_growth_yoy || 0).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{fin.net_income_formatted || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-indigo-300">${Number(fin.eps || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Related News Articles */}
      {related_news && related_news.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#1e293b]">
          <h2 className="text-2xl font-bold text-white font-serif">
            DevPulse Reporting on {company.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related_news.map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
