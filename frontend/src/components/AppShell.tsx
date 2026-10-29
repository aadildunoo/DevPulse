'use client';

import React, { useState, Suspense } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SearchModal } from './SearchModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      <Suspense fallback={<div className="h-16 border-b border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#090d16]" />}>
        <Navbar onOpenSearch={() => setSearchOpen(true)} />
      </Suspense>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading intelligence...</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
