import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <Link to="/" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Ads Dashboard</Link>
        <Link to="/login" style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Sign In
        </Link>
      </header>

      <main style={{ maxWidth: '720px', margin: '60px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Last updated: March 17, 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: 'When you sign in with Google, we collect your name, email address, and profile picture provided by Google OAuth. We do not store your Google password.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your information is used solely to authenticate you and personalise your dashboard experience. We do not sell, trade, or share your personal information with third parties.',
          },
          {
            title: '3. Advertising Platform Data',
            body: 'If you connect advertising accounts (e.g. Google Ads, Meta Ads), we access campaign metrics on your behalf to display them in the dashboard. We do not modify your campaigns or share this data with any third party.',
          },
          {
            title: '4. Data Storage',
            body: 'Authentication data is stored securely via Supabase. We retain data only as long as your account is active. You can request deletion at any time.',
          },
          {
            title: '5. Cookies',
            body: 'We use session cookies to keep you signed in. No third-party tracking cookies are used.',
          },
          {
            title: '6. Contact',
            body: 'For any privacy-related questions, contact us at new.adrek@gmail.com.',
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{title}</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>{body}</p>
          </section>
        ))}
      </main>

      <footer style={{ textAlign: 'center', padding: '48px 24px', color: '#475569', fontSize: '14px' }}>
        <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Home</Link>
      </footer>
    </div>
  );
}
