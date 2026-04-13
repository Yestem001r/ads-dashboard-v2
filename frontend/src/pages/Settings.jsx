import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Key, Palette, Moon, Sun, Check, Loader2, DollarSign, ExternalLink, CheckCircle2, XCircle, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';

const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState(null); // 'success' | 'error' | null
  const [oauthMsg, setOauthMsg] = useState('');
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const { user } = useAuth();

  const [manualEntry, setManualEntry] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  const [settings, setSettings] = useState({
    theme: 'dark',
    accentColor: '#3b82f6',
    googleConnected: false,
    googleId: '',
    googleLoginId: '',
    metaId: '',
    metaAccessToken: '',
    leadValue: 120,
    googleBudget: '',
    metaBudget: '',
  });

  const colors = [
    { name: 'Blue',    value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Purple',  value: '#8b5cf6' },
    { name: 'Orange',  value: '#f59e0b' },
    { name: 'Rose',    value: '#f43f5e' },
  ];

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await axios.get(`${API_URL}/api/google/accounts?userId=${user.id}`);
      setGoogleAccounts(res.data.accounts || []);
      if (res.data.error && res.data.error !== 'no_accounts') {
        setAccountsError(res.data.error);
      }
    } catch {
      setGoogleAccounts([]);
      setAccountsError('request_failed');
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings/${user.id}`);
      if (res.data) {
        const db = res.data;
        const budget = JSON.parse(localStorage.getItem(`adcore_budget_${user.id}`) || '{}');
        setSettings({
          theme:          db.theme          || 'dark',
          accentColor:    db.accentColor    || '#3b82f6',
          googleConnected: !!db.googleConnected,
          googleId:       db.googleId       || '',
          googleLoginId:  db.googleLoginId  || '',
          metaId:         db.metaId         || '',
          metaAccessToken: db.metaAccessToken || '',
          leadValue:      db.leadValue      || 120,
          googleBudget:   budget.google     || '',
          metaBudget:     budget.meta       || '',
        });
        if (db.theme) applyTheme(db.theme);
        if (db.accentColor) document.documentElement.style.setProperty('--accent-color', db.accentColor);
        if (db.googleConnected) fetchAccounts();
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // Detect OAuth redirect return (?oauth=success or ?oauth=error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    if (oauth === 'success') {
      setOauthStatus('success');
      fetchSettings();
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (oauth === 'error') {
      setOauthStatus('error');
      setOauthMsg(params.get('msg') || 'OAuth failed');
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, []);

  const applyTheme = (t) => t === 'light' ? document.body.classList.add('light-theme') : document.body.classList.remove('light-theme');

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/settings/save`, { userId: user.id, settings });
      localStorage.setItem(`adcore_budget_${user.id}`, JSON.stringify({
        google: Number(settings.googleBudget || 0),
        meta:   Number(settings.metaBudget   || 0),
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(`${API_URL}/api/google/disconnect`, { userId: user.id });
      setSettings(s => ({ ...s, googleConnected: false, googleId: '', googleLoginId: '' }));
      setGoogleAccounts([]);
      setOauthStatus(null);
    } catch {
      alert('Error disconnecting Google Ads');
    }
  };

  const adAccounts  = googleAccounts.filter(a => !a.isManager);
  const mccAccounts = googleAccounts.filter(a => a.isManager);

  return (
    <div className="p-6 max-w-275 mx-auto space-y-6" style={{ color: 'var(--text-main)' }}>

      {/* Header */}
      <header className="flex justify-between items-center pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="label mt-1">Global Configuration</p>
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={14} className="animate-spin" /> : (saved ? <Check size={14} /> : <Save size={14} />)}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Appearance */}
        <div className="card p-5 h-fit space-y-5">
          <div className="flex items-center gap-2">
            <Palette size={14} style={{ color: 'var(--accent-color)' }} />
            <span className="label">Appearance</span>
          </div>

          {/* Theme toggle */}
          <div className="space-y-2">
            <p className="label">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setSettings({ ...settings, theme: 'dark' }); applyTheme('dark'); }}
                className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors duration-150"
                style={settings.theme === 'dark'
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)', color: 'var(--accent-color)', border: '1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)' }
                  : { backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
                }
              >
                <Moon size={13} /> Dark
              </button>
              <button
                onClick={() => { setSettings({ ...settings, theme: 'light' }); applyTheme('light'); }}
                className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors duration-150"
                style={settings.theme === 'light'
                  ? { backgroundColor: 'var(--accent-color)', color: '#fff', border: '1px solid var(--accent-color)' }
                  : { backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
                }
              >
                <Sun size={13} /> Light
              </button>
            </div>
          </div>

          {/* Accent color */}
          <div className="space-y-2">
            <p className="label">Accent Color</p>
            <div className="flex items-center gap-2 p-2 rounded-md" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-strong)' }}>
              {colors.map(c => (
                <button
                  key={c.value}
                  onClick={() => { setSettings({ ...settings, accentColor: c.value }); document.documentElement.style.setProperty('--accent-color', c.value); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {settings.accentColor === c.value && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Lead value */}
          <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border-strong)' }}>
            <p className="label">Lead Value (LTV) $</p>
            <input
              type="number"
              value={settings.leadValue}
              onChange={e => setSettings({ ...settings, leadValue: e.target.value })}
              className="input-field mono text-lg font-bold"
            />
          </div>

          {/* Monthly budgets */}
          <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border-strong)' }}>
            <div className="flex items-center gap-2">
              <DollarSign size={13} style={{ color: 'var(--accent-color)' }} />
              <span className="label">Monthly Budget</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="label">Google Ads $</label>
                <input
                  type="number"
                  value={settings.googleBudget}
                  onChange={e => setSettings({ ...settings, googleBudget: e.target.value })}
                  placeholder="0"
                  className="input-field mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="label">Meta Ads $</label>
                <input
                  type="number"
                  value={settings.metaBudget}
                  onChange={e => setSettings({ ...settings, metaBudget: e.target.value })}
                  placeholder="0"
                  className="input-field mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="lg:col-span-2 card p-5 space-y-6">
          <div className="flex items-center gap-2">
            <Key size={14} style={{ color: 'var(--accent-color)' }} />
            <span className="label">API Configuration</span>
          </div>

          {/* Google Ads */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Google Ads</p>
              <span className="badge badge-google">OAuth</span>
            </div>

            {!settings.googleConnected ? (
              /* Not connected */
              <div className="flex flex-col items-center gap-3 py-7 rounded-md" style={{ border: '1px dashed var(--border-strong)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No Google Ads account connected</p>
                <button
                  onClick={() => { window.location.href = `${API_URL}/oauth/google/start?userId=${user.id}`; }}
                  className="btn-primary flex items-center gap-2"
                >
                  <ExternalLink size={12} />
                  Connect Google Ads
                </button>
                {oauthStatus === 'error' && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--color-error)' }}>
                    <XCircle size={11} strokeWidth={2.5} /> {oauthMsg}
                  </span>
                )}
              </div>
            ) : (
              /* Connected */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                    {oauthStatus === 'success' ? 'Connected successfully' : 'Google Ads Connected'}
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="text-[10px] ml-auto font-semibold transition-colors duration-150"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Disconnect
                  </button>
                </div>

                {accountsError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-md text-xs"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)', color: 'var(--color-error)', border: '1px solid color-mix(in srgb, var(--color-error) 25%, transparent)' }}>
                    <AlertCircle size={12} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                    <span className="flex-1">
                      {accountsError === 'invalid_grant'
                        ? 'Token expired — disconnect and reconnect your Google account.'
                        : accountsError === 'no_token'
                        ? 'No token stored. Please reconnect.'
                        : accountsError === 'request_failed'
                        ? 'Could not reach server. Check your connection.'
                        : `Google Ads error: ${accountsError}`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <AccountPicker
                    label="Ad Account"
                    accounts={adAccounts}
                    value={settings.googleId}
                    onChange={v => {
                      const picked = googleAccounts.find(a => a.id === v);
                      setSettings(s => ({
                        ...s,
                        googleId: v,
                        // auto-fill MCC if the picked account has one
                        googleLoginId: picked?.mccId || s.googleLoginId,
                      }));
                    }}
                    loading={accountsLoading}
                    placeholder="Select account..."
                  />
                  <AccountPicker
                    label="Manager Account (MCC)"
                    accounts={mccAccounts}
                    value={settings.googleLoginId}
                    onChange={v => setSettings({ ...settings, googleLoginId: v })}
                    loading={accountsLoading}
                    placeholder="None (optional)"
                    optional
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setManualEntry(v => !v)}
                    className="text-[10px] font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {manualEntry ? 'Hide manual entry' : 'Enter ID manually instead'}
                  </button>
                  {!accountsLoading && (
                    <button
                      onClick={fetchAccounts}
                      className="flex items-center gap-1 text-[10px] font-semibold ml-auto"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <RefreshCw size={10} /> Reload accounts
                    </button>
                  )}
                </div>

                {(manualEntry || (!accountsLoading && googleAccounts.length === 0)) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Customer ID (manual)" value={settings.googleId} onChange={v => setSettings({ ...settings, googleId: v })} placeholder="123-456-7890" />
                    <Field label="Login ID / MCC (manual)" value={settings.googleLoginId} onChange={v => setSettings({ ...settings, googleLoginId: v })} placeholder="860..." />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta Ads */}
          <div className="space-y-4 pt-5" style={{ borderTop: '1px solid var(--border-strong)' }}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Meta Ads</p>
              <span className="badge badge-meta">Graph API</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad Account ID" value={settings.metaId} onChange={v => setSettings({ ...settings, metaId: v })} placeholder="act_..." />
              <Field label="Access Token" value={settings.metaAccessToken} onChange={v => setSettings({ ...settings, metaAccessToken: v })} type="password" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="label">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field"
    />
  </div>
);

const AccountPicker = ({ label, accounts, value, onChange, loading, placeholder, optional }) => (
  <div className="space-y-1.5">
    <label className="label">{label}{optional && <span className="ml-1 opacity-50">(optional)</span>}</label>
    {loading ? (
      <div className="input-field flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Loader2 size={11} className="animate-spin" /> Loading accounts...
      </div>
    ) : accounts.length > 0 ? (
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-field appearance-none pr-7 w-full"
          style={{ color: value ? 'var(--text-main)' : 'var(--text-muted)' }}
        >
          {optional && <option value="">None</option>}
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    )}
  </div>
);

export default Settings;
