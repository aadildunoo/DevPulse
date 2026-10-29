'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  FileQuestion,
  Send,
  MessageSquare,
  Rss,
} from 'lucide-react';

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState('correction');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate real submission handling
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 pb-20">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </Link>

      <div className="space-y-3 border-b border-[#1e293b] pb-6">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Editorial & Community Communication
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Contact DevPulse</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Submit editorial corrections, suggest primary technical sources, or coordinate security disclosures with our engineering team.
        </p>
      </div>

      {/* Purpose Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <FileQuestion className="w-4 h-4" />
            <span>Editorial Corrections</span>
          </div>
          <p className="text-slate-300">
            Report factual errors, updated vendor advisories, or revised version numbers for transparent correction.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Security Disclosure</span>
          </div>
          <p className="text-slate-300">
            Coordinated disclosure of platform vulnerabilities or urgent supply-chain security alerts.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0c1222] space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Rss className="w-4 h-4" />
            <span>Source Suggestion</span>
          </div>
          <p className="text-slate-300">
            Recommend official release feeds, primary core maintainer blogs, or authoritative security advisory APIs.
          </p>
        </div>
      </div>

      {/* Form or Submitted Notice */}
      {submitted ? (
        <div className="p-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Message Acknowledged</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Thank you for helping maintain high signal on DevPulse. Editorial inquiries and security notices are reviewed systematically.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setName('');
              setEmail('');
              setSubject('');
              setMessage('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-2 block mx-auto"
          >
            Submit another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[#1e293b] bg-[#0c1222] space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Inquiry Category</label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="correction">Editorial Correction / Errata Notice</option>
              <option value="security">Security Vulnerability Coordinated Disclosure</option>
              <option value="source">Suggest Primary Source or Feed</option>
              <option value="feedback">General Technical Feedback</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Name or Handle</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex (Maintainer)"
                className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.io"
                className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Subject or Article Title</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. React 19.1 Release Notes correction or Source URL recommendation"
              className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Technical Details & Evidence</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide objective references, diffs, official URLs, or details regarding your inquiry..."
              className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Transmitting Notice...' : 'Transmit Inquiry to Engineering Team'}
          </button>
        </form>
      )}
    </div>
  );
}
