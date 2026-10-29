'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Cpu, ExternalLink, Globe, BookOpen, Bell, Check, ArrowLeft, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Technology, Article, SecurityAdvisory } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function TechnologyHubPage() {
  return (
    <React.Suspense fallback={<div className="max-w-5xl mx-auto py-12 text-center text-xs text-slate-500">Loading technology ecosystem hub...</div>}>
      <TechHubContent />
    </React.Suspense>
  );
}

function TechHubContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [tech, setTech] = useState<Technology | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [advisories, setAdvisories] = useState<SecurityAdvisory[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      api.getTechnology(slug),
      api.getArticles({ technology: slug }),
      api.getSecurityAdvisories({ search: slug }),
    ])
      .then(([techData, articlesData, advData]) => {
        setTech(techData);
        setArticles(articlesData.results || []);
        setAdvisories(advData.results || []);

        try {
          const followed: string[] = JSON.parse(localStorage.getItem('devpulse_followed_techs') || '[]');
          if (followed.includes(slug)) {
            setIsFollowing(true);
          }
        } catch {
          // ignore
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);

    try {
      const followed: string[] = JSON.parse(localStorage.getItem('devpulse_followed_techs') || '[]');
      let updated: string[];
      if (next) {
        updated = Array.from(new Set([...followed, slug]));
        api.toggleFollowTechnology(slug).catch(() => {});
      } else {
        updated = followed.filter((s) => s !== slug);
        api.toggleFollowTechnology(slug).catch(() => {});
      }
      localStorage.setItem('devpulse_followed_techs', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="h-44 rounded-2xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-slate-200">Technology not found</h2>
        <Link href="/" className="text-xs text-indigo-400 mt-2 inline-block">
          Return to Intelligence Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      {/* Hub Hero Banner */}
      <div className="rounded-2xl border border-[#1e293b] bg-gradient-to-br from-[#0c142b] to-[#090d18] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Technology Intelligence Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {tech.name}
            </h1>
          </div>

          <button
            onClick={toggleFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
              isFollowing
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isFollowing ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {isFollowing ? 'Following Ecosystem' : 'Follow Technology'}
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {tech.description}
        </p>

        {/* Links */}
        <div className="flex items-center gap-4 pt-3 border-t border-[#1e293b] text-xs font-mono">
          {tech.website && (
            <a
              href={tech.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Official Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {tech.doc_url && (
            <a
              href={tech.doc_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Security Advisories for this Tech */}
      {advisories.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Security Advisories ({advisories.length})
            </h3>
          </div>
          <div className="space-y-2">
            {advisories.slice(0, 3).map((adv) => (
              <div
                key={adv.id}
                className="p-3.5 rounded-xl border border-rose-950/40 bg-rose-950/15 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono text-rose-300 font-semibold mr-2">
                    {adv.cve_id || adv.advisory_id}
                  </span>
                  <span className="text-slate-200">{adv.title}</span>
                </div>
                <a
                  href={adv.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 hover:text-rose-300 shrink-0 font-mono text-[11px]"
                >
                  View Advisory &rarr;
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Articles Stream */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Releases & Intelligence Reports ({articles.length})
        </h3>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-[#1e293b] rounded-xl bg-[#0c1222] text-xs text-slate-400">
            No specific articles tagged with this technology yet.
          </div>
        )}
      </section>
    </div>
  );
}
