import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>Ads Dashboard</h1>
        <Link to="/login" style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Sign In
        </Link>
      </header>

      <main style={{ maxWidth: '720px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
          All your ad campaigns<br />in one place
        </h2>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '40px' }}>
          Ads Dashboard connects your Google Ads, Meta Ads, and other advertising platforms
          into a single analytics dashboard. Track performance, compare campaigns, and get
          AI-powered insights — without switching between tools.
        </p>
        <Link to="/login" style={{ background: '#3b82f6', color: '#fff', padding: '14px 36px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px' }}>
          Get Started
        </Link>

        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'left' }}>
          {[
            { title: 'Unified Analytics', desc: 'See all your campaigns from different platforms in one dashboard.' },
            { title: 'AI Insights', desc: 'Get automated recommendations to improve your ad performance.' },
            { title: 'Real-time Data', desc: 'Stay up to date with live metrics and campaign status.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '48px 24px', color: '#475569', fontSize: '14px' }}>
        <Link to="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</Link>
        <span style={{ margin: '0 12px' }}>·</span>
        <a href="mailto:new.adrek@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>Contact</a>
      </footer>
    </div>
  );
}
