'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Cpu,
  TrendingUp,
  Code2,
  Users,
  Building2,
  Rocket,
  ShieldAlert,
  Search,
  Bookmark,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Radio,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MarketOverview, UserProfile } from '@/lib/types';
import { AuthModal } from './AuthModal';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);

  useEffect(() => {
    // Check user session
    api.getCurrentUser()
      .then((res) => {
        if (res.authenticated && res.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => {});

    // Fetch market ticker overview
    api.getMarketOverview()
      .then((data) => setMarketOverview(data))
      .catch(() => {});
  }, []);

  const editorialDesks = [
    { label: 'Front Page', href: '/', icon: Activity },
    { label: 'AI & ML', href: '/ai', icon: Cpu },
    { label: 'Tech Markets', href: '/markets', icon: TrendingUp, highlight: true },
    { label: 'Developer News', href: '/frameworks', icon: Code2 },
    { label: 'Tech Layoffs', href: '/layoffs', icon: Users },
    { label: 'Big Tech', href: '/business', icon: Building2 },
    { label: 'Startups & VC', href: '/startups', icon: Rocket },
    { label: 'Security', href: '/security', icon: ShieldAlert },
    { label: 'Open Source', href: '/open-source', icon: Code2 },
  ];

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-[#1e293b] bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md transition-colors duration-150">
      {/* Top Newspaper Masthead & Market Ticker Bar */}
      <div className="border-b border-slate-200 dark:border-[#172033] bg-slate-100 dark:bg-[#060a12] py-1 px-4 text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-slate-200">DEVPULSE</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="hidden sm:inline">{currentDateFormatted}</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">•</span>
            <span className="hidden md:inline text-indigo-600 dark:text-indigo-400 font-semibold">Global Technology & Financial Daily</span>
          </div>

          {/* Real-time / 15m Delayed Market Strip */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
            {marketOverview ? (
              <div className="flex items-center gap-4 text-[10px] shrink-0">
                <span className="text-slate-500 font-medium hidden sm:inline">
                  [{marketOverview.session.status}]
                </span>
                {marketOverview.indices.map((idx) => {
                  const numChange = Number(idx.change_percent);
                  const isPositive = numChange >= 0;
                  return (
                    <Link
                      key={idx.symbol}
                      href="/markets"
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">{idx.name.split(' ')[0]}:</span>
                      <span>{Number(idx.current_value).toLocaleString()}</span>
                      <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isPositive ? '+' : ''}{Number(idx.change_percent).toFixed(2)}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Link href="/markets" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium text-[10px]">
                <TrendingUp className="w-3 h-3" />
                <span>Tech Markets Desk Live</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary Brand & Desk Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-white dark:bg-[#090d16] rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white font-serif">
                  DevPulse
                </span>
                <span className="text-[9px] tracking-widest uppercase font-mono text-indigo-600 dark:text-indigo-400 -mt-1 font-bold">
                  Technology Newspaper
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1" aria-label="Desks">
              {editorialDesks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold'
                        : item.highlight
                        ? 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0f1629] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              title="Search articles, stocks, CVEs, or technologies (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Daily Briefing Edition Link */}
            <Link
              href="/briefing"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                pathname === '/briefing'
                  ? 'border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-600/10'
                  : 'border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
              title="Daily Technology Newspaper Morning Briefing"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Daily Edition</span>
            </Link>

            {/* Reading Vault / Watchlist */}
            <Link
              href="/saved"
              className={`p-2 rounded-lg border transition-colors ${
                pathname === '/saved'
                  ? 'border-indigo-400 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
              title="Saved Articles & Watchlist"
              aria-label="Saved Articles"
            >
              <Bookmark className="w-4 h-4" />
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              aria-label="Toggle mobile navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#090d16] px-4 pt-2 pb-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {editorialDesks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1e293b] flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-300"
            >
              <User className="w-4 h-4" />
              {currentUser ? `Profile (${currentUser.username})` : 'Sign In / Register'}
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Developer Auth & Preferences Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </header>
  );
}
