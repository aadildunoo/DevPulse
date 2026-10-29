'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Zap, ChevronLeft, ChevronRight, Pause, Play, ArrowRight, Clock } from 'lucide-react';
import { Article } from '@/lib/types';

interface BreakingNewsTickerProps {
  initialStories?: Article[];
}

export function BreakingNewsTicker({ initialStories = [] }: BreakingNewsTickerProps) {
  const [stories, setStories] = useState<Article[]>(initialStories);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialStories.length > 0) {
      setStories(initialStories);
    }
  }, [initialStories]);

  // Auto-rotation every 7 seconds when not paused or hovered
  useEffect(() => {
    if (stories.length <= 1 || isPaused || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stories.length, isPaused, isHovered]);

  if (stories.length === 0) {
    return null;
  }

  const current = stories[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside
      aria-label="Breaking Technology News Ticker"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-950/60 dark:from-rose-950/30 dark:via-slate-950/90 dark:to-slate-950 light:border-rose-300 light:bg-rose-50/80 backdrop-blur-md px-3 sm:px-4 py-2.5 shadow-lg shadow-rose-950/10 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Left Badge: Pulsing Indicator & Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2.5 w-2.5 relative items-center justify-center" aria-hidden="true">
            <span className="motion-reduce:animate-none animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 shadow-sm shadow-rose-500" />
          </span>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono font-extrabold uppercase tracking-widest text-[10px] shadow-sm shadow-rose-600/30">
            <Zap className="w-3 h-3 fill-white" />
            <span>BREAKING</span>
          </div>

          <span className="hidden md:inline text-rose-300 dark:text-rose-400 font-mono text-[11px] font-semibold">
            WIRE
          </span>
        </div>

        {/* Center: Headline & Subheadline link */}
        <div className="flex-1 min-w-0" aria-live="polite">
          <div className="flex items-center gap-2 truncate">
            <Link
              href={`/article/${current.slug}`}
              className="font-semibold text-slate-100 dark:text-slate-100 hover:text-rose-300 dark:hover:text-rose-300 light:text-slate-900 light:hover:text-rose-700 text-xs sm:text-sm truncate transition-colors font-serif"
            >
              {current.title}
            </Link>

            {current.published_at && (
              <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-slate-400 light:text-slate-500 shrink-0">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(current.published_at)}
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Story Counter */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
          <span className="text-slate-400 light:text-slate-600 text-[10px] px-1.5 hidden sm:inline">
            {currentIndex + 1}/{stories.length}
          </span>

          {/* Pause / Play Accessible Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title={isPaused ? 'Resume live ticker rotation' : 'Pause live ticker rotation'}
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Prev / Next controls */}
          <button
            onClick={handlePrev}
            className="p-1 rounded text-slate-400 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Previous breaking news story"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleNext}
            className="p-1 rounded text-slate-400 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Next breaking news story"
            aria-label="Next story"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <Link
            href={`/article/${current.slug}`}
            className="hidden sm:flex items-center gap-1 ml-1 px-2.5 py-1 rounded bg-rose-600/20 text-rose-300 light:bg-rose-100 light:text-rose-800 hover:bg-rose-600/30 font-semibold text-[10px] transition-colors"
          >
            <span>Read</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
