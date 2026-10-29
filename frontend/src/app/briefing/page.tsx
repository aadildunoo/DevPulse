'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, Calendar, ArrowRight, ExternalLink, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { DailyBriefing } from '@/lib/types';
import { ArticleCard } from '@/components/ArticleCard';

export default function DailyBriefingPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDailyBriefing()
      .then((data) => setBriefing(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="h-48 rounded-2xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-[#1e293b] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-slate-300">No briefing compiled for today yet.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#0c1328] via-[#090d1a] to-[#0d162e] p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            DevPulse Intelligence Edition
          </span>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(briefing.date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {briefing.reading_time_minutes} min read
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          {briefing.title}
        </h1>

        <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed pt-2 border-t border-[#1e293b]">
          {briefing.overview.split('\n\n').map((para, i) => (
            <p key={i} className="mb-3">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Grouped Top Stories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Featured In Today&apos;s Briefing ({briefing.top_stories.length})
          </h2>
          <span className="text-xs text-indigo-400 font-mono">Ranked by Ecosystem Reach</span>
        </div>

        <div className="space-y-4">
          {briefing.top_stories.map((story) => (
            <ArticleCard key={story.id} article={story} />
          ))}
        </div>
      </div>
    </div>
  );
}
