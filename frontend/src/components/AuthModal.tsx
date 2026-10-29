'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserProfile, Category, Technology } from '@/lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
}

export function AuthModal({ isOpen, onClose, currentUser, onUserChange }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'register' | 'preferences'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [digestFreq, setDigestFreq] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  useEffect(() => {
    if (currentUser) {
      setTab('preferences');
      setRoleTitle(currentUser.role_title || '');
    } else {
      setTab('signin');
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      // Fetch categories & technologies for preferences
      Promise.all([api.getCategories(), api.getTechnologies()])
        .then(([cats, techs]) => {
          setCategories(cats || []);
          setTechnologies(techs || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await api.login(username, password);
      onUserChange(user);
      setSuccess('Successfully authenticated.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await api.register({
        username,
        email,
        password,
        role_title: roleTitle || 'Software Engineer',
      });
      onUserChange(user);
      setSuccess('Account created! Welcome to DevPulse.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. The username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateProfile({
        role_title: roleTitle,
        email_digest_frequency: digestFreq,
      });
      onUserChange(updated);
      setSuccess('Preferences saved.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
      onUserChange(null);
      onClose();
    } catch (err) {
      console.warn(err);
      onUserChange(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0c1222] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#090d18]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {currentUser ? 'Developer Profile & Settings' : 'Developer Authentication'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">DevPulse Command Center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        {!currentUser ? (
          <div className="flex border-b border-[#1e293b] bg-[#080c16]">
            <button
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                tab === 'signin'
                  ? 'border-b-2 border-indigo-500 text-indigo-300 bg-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                tab === 'register'
                  ? 'border-b-2 border-indigo-500 text-indigo-300 bg-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="flex border-b border-[#1e293b] bg-[#080c16] px-5 py-2.5 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">Signed in as:</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{currentUser.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Sign In Form */}
          {!currentUser && tab === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_chen"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to DevPulse'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {!currentUser && tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sara_dev"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Email (optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@company.io"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Role Title</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Architect"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* Preferences Form (Authenticated User) */}
          {currentUser && (
            <form onSubmit={handleUpdatePreferences} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Professional Engineering Role</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Principal Engineer / Security Analyst"
                  className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Intelligence Digest Frequency</label>
                <select
                  value={digestFreq}
                  onChange={(e) => setDigestFreq(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080c16] border border-[#1e293b] rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="daily">Daily High-Signal Digest</option>
                  <option value="weekly">Weekly Comprehensive Review</option>
                  <option value="never">No Email Notifications</option>
                </select>
              </div>

              {/* Followed Technologies Badges */}
              <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Your Followed Technologies</span>
                  <span className="text-[11px] font-mono text-indigo-400">
                    {currentUser.followed_technologies?.length || 0} active
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#080c16] rounded-lg border border-[#1e293b]">
                  {currentUser.followed_technologies && currentUser.followed_technologies.length > 0 ? (
                    currentUser.followed_technologies.map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      >
                        {t.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 p-2">
                      No technologies followed yet. Follow technologies like React, Next.js, or Rust from their technology hubs!
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
