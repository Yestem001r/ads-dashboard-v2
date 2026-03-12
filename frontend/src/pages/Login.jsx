import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email for a confirmation link.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-strong)' }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
            <Zap size={16} className="text-white fill-current" />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--text-main)' }}>ADCORE</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="label">Ads Intelligence Platform</p>
            <h2 className="text-3xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
              All your ad data.<br />One place.
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
            Connect Google Ads and Meta Ads, track performance, and optimize campaigns from a single dashboard.
          </p>

          {/* Feature list */}
          <div className="space-y-2 pt-2">
            {['Google Ads & Meta Ads in one view', 'Real-time performance metrics', 'ROAS and CPA tracking'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 ADCORE</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
              <Zap size={16} className="text-white fill-current" />
            </div>
            <span className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--text-main)' }}>ADCORE</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isSignUp ? 'Enter your details to get started.' : 'Enter your credentials to continue.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
            )}
            {message && (
              <p className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>{message}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-main)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
