import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';
import { RefreshCw, CheckCircle2, XCircle, Database, ShieldCheck, Clock, Settings, AlertTriangle } from 'lucide-react';

const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const Connections = () => {
  const [health, setHealth]   = useState({ google: null, meta: null, flags: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const checkConnections = async () => {
    setLoading(true);
    try {
      const dateTo = new Date().toISOString().split('T')[0];
      const response = await axios.post(`${API_URL}/api/analytics/fetch`, {
        dateFrom: '2024-01-01',
        dateTo,
        userId: user.id,
        source: 'all'
      });
      setHealth({
        google: response.data.health?.google || { status: 'error' },
        meta:   response.data.health?.meta   || { status: 'error' },
        flags:  response.data.health?.flags  || [],
      });
    } catch (error) {
      console.error("Connection check failed:", error);
      setHealth({
        google: { status: 'error', error: 'Server Unreachable' },
        meta:   { status: 'error', error: 'Server Unreachable' },
        flags:  [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkConnections(); }, []);

  const googleFlags = health.flags.filter(f => f.source === 'google');
  const metaFlags   = health.flags.filter(f => f.source === 'meta');

  return (
    <div className="p-6 max-w-300 mx-auto space-y-6" style={{ color: 'var(--text-main)' }}>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Data Sources</h1>
          <p className="label mt-1">Manage API connections and data sync status.</p>
        </div>
        <button
          onClick={checkConnections}
          disabled={loading}
          className="btn-ghost"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} style={{ color: loading ? 'var(--accent-color)' : undefined }} />
          {loading ? 'Verifying...' : 'Test Connections'}
        </button>
      </header>

      {/* Connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionCard
          title="Google Ads"
          status={health.google?.status}
          loading={loading}
          error={health.google?.error}
          lastSync={health.google?.lastSync}
          flags={googleFlags}
          onConfigure={() => navigate('/settings')}
          icon={<div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-google) 12%, transparent)', color: 'var(--color-google)', border: '1px solid color-mix(in srgb, var(--color-google) 20%, transparent)' }}>G</div>}
        />
        <ConnectionCard
          title="Meta Ads"
          status={health.meta?.status}
          loading={loading}
          error={health.meta?.error}
          lastSync={health.meta?.lastSync}
          flags={metaFlags}
          onConfigure={() => navigate('/settings')}
          icon={<div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-meta) 12%, transparent)', color: 'var(--color-meta)', border: '1px solid color-mix(in srgb, var(--color-meta) 20%, transparent)' }}>M</div>}
        />
      </div>

      {/* Data health flags */}
      {!loading && health.flags.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} style={{ color: 'var(--color-warning)' }} />
            <span className="label">Data Health Warnings</span>
            <span className="badge" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)', border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)' }}>
              {health.flags.length}
            </span>
          </div>
          <div className="space-y-2">
            {health.flags.map((flag, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-2 px-3 rounded-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
                <span className={`badge ${flag.source === 'google' ? 'badge-google' : 'badge-meta'}`}>{flag.source}</span>
                <span className="font-medium truncate flex-1" style={{ color: 'var(--text-main)' }}>{flag.name}</span>
                <span style={{ color: 'var(--color-warning)', flexShrink: 0 }}>Spend with no impressions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={13} style={{ color: 'var(--text-muted)' }} />
          <span className="label">Diagnostic Engine</span>
        </div>
        <div className="flex items-center gap-2 text-xs mono" style={{ color: 'var(--text-secondary)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }} />
          AdCore API Gateway is running on port 3000.
        </div>
      </div>
    </div>
  );
};

const ConnectionCard = ({ title, status, loading, error, lastSync, flags, icon, onConfigure }) => {
  const isHealthy = status === 'healthy';
  const isError   = status === 'error';

  return (
    <div
      className="card p-5"
      style={isError ? { borderColor: 'color-mix(in srgb, var(--color-error) 25%, transparent)' } : {}}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{title}</h3>
            <p className="label mt-0.5">API Integration</p>
          </div>
        </div>

        {loading ? (
          <div className="h-5 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
        ) : (
          <span className={`badge ${isHealthy ? 'badge-success' : 'badge-error'}`}>
            {isHealthy ? <CheckCircle2 size={10} strokeWidth={3} /> : <XCircle size={10} strokeWidth={3} />}
            {isHealthy ? 'Connected' : 'Action Required'}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck size={13} /> Sync Status
          </span>
          {loading ? (
            <div className="h-3.5 w-14 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
          ) : (
            <span className="font-semibold mono" style={{ color: isHealthy ? 'var(--color-success)' : 'var(--color-error)' }}>
              {isHealthy ? 'Operational' : 'Failed'}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Clock size={13} /> Last Sync
          </span>
          {loading ? (
            <div className="h-3.5 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
          ) : (
            <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(lastSync)}</span>
          )}
        </div>

        {!loading && flags && flags.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <AlertTriangle size={13} /> Data Warnings
            </span>
            <span className="mono font-semibold" style={{ color: 'var(--color-warning)' }}>{flags.length} flagged</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {isError && error ? (
          <span className="text-xs truncate max-w-50" style={{ color: 'var(--color-error)' }} title={error}>{error}</span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>All systems operational.</span>
        )}
        <button
          onClick={onConfigure}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
          style={{ color: 'var(--accent-color)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Settings size={12} /> Configure
        </button>
      </div>
    </div>
  );
};

export default Connections;
