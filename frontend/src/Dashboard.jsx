import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AIInsightsPanel from './components/AIInsightsPanel';
import { API_URL } from './lib/api';
import {
  TrendingUp, Users, Calendar, RefreshCw, BarChart3,
  Target, Percent, Flame, AlertCircle, ChevronRight, X,
  MousePointerClick, Eye, DollarSign, ChevronLeft, ChevronDown
} from 'lucide-react';

// ── Date Range Picker ────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today',      days: 0 },
  { label: 'Last 7d',   days: 7 },
  { label: 'Last 14d',  days: 14 },
  { label: 'Last 30d',  days: 30 },
  { label: 'Last 90d',  days: 90 },
];

const fmtDisplay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function MiniCalendar({ selected, onChange, minDate, maxDate }) {
  const today = new Date();
  const init  = selected || today;
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });

  const first   = new Date(view.y, view.m, 1);
  const lastDay = new Date(view.y, view.m + 1, 0).getDate();
  const pad     = first.getDay();
  const cells   = Array(pad).fill(null).concat(Array.from({ length: lastDay }, (_, i) => i + 1));

  const isSelected = (d) => selected && d === selected.getDate() && view.m === selected.getMonth() && view.y === selected.getFullYear();
  const isToday    = (d) => d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isDisabled = (d) => {
    const dt = new Date(view.y, view.m, d);
    if (minDate && dt < minDate) return true;
    if (maxDate && dt > maxDate) return true;
    return false;
  };

  return (
    <div style={{ width: 224 }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setView(v => ({ ...v, m: v.m === 0 ? 11 : v.m - 1, y: v.m === 0 ? v.y - 1 : v.y }))}
          className="w-6 h-6 flex items-center justify-center rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={12} />
        </button>
        <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{MONTH_NAMES[view.m]} {view.y}</span>
        <button onClick={() => setView(v => ({ ...v, m: v.m === 11 ? 0 : v.m + 1, y: v.m === 11 ? v.y + 1 : v.y }))}
          className="w-6 h-6 flex items-center justify-center rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={12} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map(n => <div key={n} className="text-center" style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>{n}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => !d ? <div key={i} /> : (
          <button key={i} disabled={isDisabled(d)}
            onClick={() => onChange(new Date(view.y, view.m, d))}
            className="rounded text-xs font-semibold transition-colors"
            style={{
              padding: '4px 0',
              backgroundColor: isSelected(d) ? 'var(--accent-color)' : 'transparent',
              color: isSelected(d) ? '#fff' : isDisabled(d) ? 'var(--text-muted)' : isToday(d) ? 'var(--accent-color)' : 'var(--text-main)',
              opacity: isDisabled(d) ? 0.35 : 1,
              cursor: isDisabled(d) ? 'not-allowed' : 'pointer',
            }}
          >{d}</button>
        ))}
      </div>
    </div>
  );
}

function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState('preset'); // 'preset' | 'custom'
  const ref               = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const applyPreset = (days) => {
    const end   = new Date(); end.setHours(0,0,0,0);
    const start = days === 0 ? new Date(end) : new Date(end.getTime() - days * 86400000);
    onChange(start, end);
    setOpen(false);
  };

  const label = `${fmtDisplay(startDate)} – ${fmtDisplay(endDate)}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-main)', whiteSpace: 'nowrap' }}
      >
        <Calendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span className="mono">{label}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 10, padding: 14, minWidth: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-3 p-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-strong)' }}>
            {['preset','custom'].map(t => (
              <button key={t} onClick={() => setMode(t)}
                className="flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                style={mode === t ? { backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-main)' } : { color: 'var(--text-muted)' }}
              >{t === 'preset' ? 'Quick' : 'Custom'}</button>
            ))}
          </div>

          {mode === 'preset' ? (
            <div className="space-y-1">
              {PRESETS.map(p => (
                <button key={p.days} onClick={() => applyPreset(p.days)}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors"
                  style={{ color: 'var(--text-main)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-active)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >{p.label}</button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="label mb-1.5">From</p>
                <MiniCalendar selected={startDate} onChange={d => onChange(d, endDate)} maxDate={endDate} />
              </div>
              <div style={{ borderTop: '1px solid var(--border-strong)', paddingTop: 12 }}>
                <p className="label mb-1.5">To</p>
                <MiniCalendar selected={endDate} onChange={d => { onChange(startDate, d); setOpen(false); }} minDate={startDate} maxDate={new Date()} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber   = (val) => new Intl.NumberFormat('en-US').format(val || 0);

const calcDelta = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData]             = useState([]);
  const [prevData, setPrevData]     = useState([]);
  const [health, setHealth]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [source, setSource]         = useState('all');
  const [startDate, setStartDate]   = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate]       = useState(new Date());
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [campaignFilter, setCampaignFilter] = useState('');
  const [settings] = useState({ leadValue: 120 });
  const [budget, setBudget] = useState({ google: 0, meta: 0 });
  const [history, setHistory]             = useState([]);
  const [insights, setInsights]           = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`adcore_budget_${user.id}`);
    if (saved) setBudget(JSON.parse(saved));
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fmt = (d) => d.toISOString().split('T')[0];
      const rangeMs   = endDate - startDate;
      const prevEnd   = new Date(startDate.getTime() - 86400000);
      const prevStart = new Date(startDate.getTime() - rangeMs - 86400000);

      const [curr, prev] = await Promise.all([
        axios.post(`${API_URL}/api/analytics/fetch`, {
          source, dateFrom: fmt(startDate), dateTo: fmt(endDate), userId: user.id, level: 'campaign',
          saveSnapshot: true
        }),
        axios.post(`${API_URL}/api/analytics/fetch`, {
          source, dateFrom: fmt(prevStart), dateTo: fmt(prevEnd), userId: user.id, level: 'campaign'
        }),
      ]);
      setData(curr.data.data || []);
      setHealth(curr.data.health);
      setPrevData(prev.data.data || []);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/analytics/history`, {
        params: { userId: user.id, source, level: 'campaign', days: 30 }
      });
      setHistory(res.data.data || []);
    } catch (e) {
      setHistory([]);
    }
  };

  useEffect(() => { fetchData(); fetchHistory(); }, [source, startDate, endDate]);

  const filteredData = useMemo(() => {
    if (!campaignFilter) return data;
    return data.filter(d => d.name.toLowerCase().includes(campaignFilter.toLowerCase()));
  }, [data, campaignFilter]);

  const tableRows = useMemo(() => {
    const groups = filteredData.reduce((acc, item) => {
      if (!acc[item.name]) acc[item.name] = { ...item, spend: 0, conversions: 0, impressions: 0, clicks: 0 };
      acc[item.name].spend       += parseFloat(item.spend || 0);
      acc[item.name].conversions += parseInt(item.conversions || 0);
      acc[item.name].impressions += parseInt(item.impressions || 0);
      acc[item.name].clicks      += parseInt(item.clicks || 0);
      return acc;
    }, {});
    return Object.values(groups)
      .map(row => ({ ...row, roas: row.spend > 0 ? (row.conversions * settings.leadValue) / row.spend : 0 }))
      .sort((a, b) => b.roas - a.roas);
  }, [filteredData, settings]);

  const aggregateTotals = (rows) => rows.reduce((acc, cur) => ({
    spend:       acc.spend       + parseFloat(cur.spend || 0),
    conv:        acc.conv        + parseInt(cur.conversions || 0),
    impressions: acc.impressions + parseInt(cur.impressions || 0),
    clicks:      acc.clicks      + parseInt(cur.clicks || 0),
  }), { spend: 0, conv: 0, impressions: 0, clicks: 0 });

  const metrics = useMemo(() => {
    const base   = selectedEntity ? filteredData.filter(d => d.name === selectedEntity) : filteredData;
    const totals = aggregateTotals(base);
    return {
      ...totals,
      roas: totals.spend > 0 ? ((totals.conv * settings.leadValue) / totals.spend).toFixed(2) : '0.00',
      cpl:  totals.conv > 0 ? totals.spend / totals.conv : 0,
      ctr:  totals.impressions > 0 ? (totals.clicks / totals.impressions * 100).toFixed(2) : '0.00',
      cpc:  totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    };
  }, [filteredData, selectedEntity, settings]);

  // Fetch AI insights after metrics are computed (gated on having real spend data)
  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const fmt = (d) => d.toISOString().split('T')[0];
    setInsightsLoading(true);
    setInsightsError(null);
    axios.post(`${API_URL}/api/insights/generate`, {
      userId: user.id,
      source,
      currentMetrics: { ...metrics, dateFrom: fmt(startDate), dateTo: fmt(endDate) }
    }, { signal: controller.signal })
      .then(res => setInsights(res.data.insights))
      .catch(e => { if (!axios.isCancel(e)) setInsightsError('Failed to generate insights'); })
      .finally(() => setInsightsLoading(false));
    return () => controller.abort();
  }, [metrics.spend, metrics.conv, source]);

  const prevMetrics = useMemo(() => {
    const totals = aggregateTotals(prevData);
    return {
      ...totals,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    };
  }, [prevData]);

  const spendBySource = useMemo(() => data.reduce((acc, cur) => {
    acc[cur.source] = (acc[cur.source] || 0) + parseFloat(cur.spend || 0);
    return acc;
  }, {}), [data]);

  const chartData = useMemo(() => {
    const base = selectedEntity ? filteredData.filter(d => d.name === selectedEntity) : filteredData;
    const dailyMap = base.reduce((acc, curr) => {
      const d = curr.date ? curr.date.split('T')[0] : 'N/A';
      if (!acc[d]) acc[d] = { date: d, Spend: 0, Leads: 0, Clicks: 0 };
      acc[d].Spend  += parseFloat(curr.spend || 0);
      acc[d].Leads  += parseInt(curr.conversions || 0);
      acc[d].Clicks += parseInt(curr.clicks || 0);
      return acc;
    }, {});
    return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData, selectedEntity]);

  const showBudget = budget.google > 0 || budget.meta > 0;
  const notConnected = !loading && health?.google?.status === 'error' && health?.meta?.status === 'error';

  return (
    <div className="max-w-360 mx-auto p-6 space-y-5" style={{ color: 'var(--text-main)' }}>

      {/* Connection error alert — only show if one source is broken, not both */}
      {!notConnected && (health?.google?.status === 'error' || health?.meta?.status === 'error') && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)' }}>
          <AlertCircle size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>
            One or more ad sources have connection issues. Check <a href="/dashboard/connections" className="underline">Connections</a>.
          </span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Performance Matrix</h1>
          <p className="label mt-1">Global Analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          />
          <button
            onClick={fetchData}
            className="h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-150"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-active)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} style={{ color: loading ? 'var(--accent-color)' : 'var(--text-muted)' }} />
          </button>
        </div>
      </header>

      {/* Onboarding state */}
      {notConnected && (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <BarChart3 size={36} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm font-semibold">No data sources connected</p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Connect Google Ads or Meta Ads to start seeing your campaign performance.
            </p>
          </div>
          <a href="/dashboard/settings" className="btn-primary">Go to Settings →</a>
        </div>
      )}

      {/* Metric cards — 6 metrics with period comparison */}
      {!notConnected && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <MetricCard title="Ad Spend"    value={formatCurrency(metrics.spend)}    icon={<TrendingUp size={13} />}        delta={calcDelta(metrics.spend, prevMetrics.spend)}       invertDelta />
          <MetricCard title="Impressions" value={formatNumber(metrics.impressions)} icon={<Eye size={13} />}               delta={calcDelta(metrics.impressions, prevMetrics.impressions)} />
          <MetricCard title="Clicks"      value={formatNumber(metrics.clicks)}      icon={<MousePointerClick size={13} />} delta={calcDelta(metrics.clicks, prevMetrics.clicks)} />
          <MetricCard title="Leads"       value={formatNumber(metrics.conv)}        icon={<Users size={13} />}             delta={calcDelta(metrics.conv, prevMetrics.conv)} />
          <MetricCard title="CTR"         value={`${metrics.ctr}%`}               icon={<Percent size={13} />}           delta={calcDelta(parseFloat(metrics.ctr), prevMetrics.ctr)} accent />
          <MetricCard title="CPC"         value={formatCurrency(metrics.cpc)}      icon={<Target size={13} />}            delta={calcDelta(metrics.cpc, prevMetrics.cpc)} invertDelta />
        </div>
      )}

      {/* Budget progress bars */}
      {showBudget && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="label">Monthly Budget</span>
          </div>
          <div className="space-y-3">
            {budget.google > 0 && (
              <BudgetBar label="Google Ads" spent={spendBySource.google || 0} budget={budget.google} color="var(--color-google)" />
            )}
            {budget.meta > 0 && (
              <BudgetBar label="Meta Ads" spent={spendBySource.meta || 0} budget={budget.meta} color="var(--color-meta)" />
            )}
          </div>
        </div>
      )}

      {/* 30-Day Trend sparklines */}
      {history.length >= 2 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} style={{ color: 'var(--accent-color)' }} />
            <span className="label">30-Day Trend</span>
            <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{history.length} days of data</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="label mb-1">Spend</p>
              <HistorySparkline data={history} dataKey="spend" color="var(--accent-color)" />
            </div>
            <div>
              <p className="label mb-1">Leads</p>
              <HistorySparkline data={history} dataKey="conversions" color="var(--color-success)" />
            </div>
            <div>
              <p className="label mb-1">ROAS</p>
              <HistorySparkline data={history} dataKey="roas" color="var(--color-warning)" />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <AIInsightsPanel insights={insights} loading={insightsLoading} error={insightsError} />

      {/* Campaign filter */}
      <div className="flex items-center gap-2 px-3 h-8 rounded-md w-full max-w-72" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
        <Target size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Filter campaigns..."
          value={campaignFilter}
          onChange={e => { setCampaignFilter(e.target.value); setSelectedEntity(null); }}
          className="bg-transparent text-xs outline-none flex-1"
          style={{ color: 'var(--text-main)' }}
        />
        {campaignFilter && (
          <button onClick={() => setCampaignFilter('')}>
            <X size={11} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart */}
        <div className="lg:col-span-8 card flex flex-col min-h-100">
          <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <BarChart3 size={13} style={{ color: 'var(--accent-color)' }} />
              <span className="label">Spend · Leads · Clicks</span>
              {selectedEntity && (
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-surface-active)', color: 'var(--accent-color)', border: '1px solid var(--border-strong)' }}
                >
                  <X size={10} /> {selectedEntity}
                </button>
              )}
            </div>
            <div className="flex p-0.5 rounded" style={{ backgroundColor: 'var(--toggle-wrapper-bg)', border: '1px solid var(--border-strong)' }}>
              {['all', 'google', 'meta'].map(s => (
                <button key={s} onClick={() => setSource(s)}
                  className="px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors duration-150"
                  style={source === s ? { backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-main)' } : { color: 'var(--text-muted)' }}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="p-5 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-color)" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis yAxisId="left"  stroke="var(--text-muted)" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-success)" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }} />
                <Area yAxisId="left"  type="monotone" dataKey="Spend"  stroke="var(--accent-color)"  strokeWidth={1.5} fill="url(#colorSpend)" activeDot={{ r: 3 }} />
                <Area yAxisId="right" type="monotone" dataKey="Leads"  stroke="var(--color-success)" strokeWidth={1.5} fill="transparent" dot={false} />
                <Area yAxisId="right" type="monotone" dataKey="Clicks" stroke="var(--color-warning)"  strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {tableRows[0] && (
            <div className="card p-4 space-y-2">
              <p className="label">Top Performer</p>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>{tableRows[0].name}</p>
              <div className="flex items-center gap-3">
                <span className="mono text-xs font-bold" style={{ color: 'var(--color-success)' }}>{tableRows[0].roas.toFixed(1)}x ROAS</span>
                <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(tableRows[0].spend)}</span>
              </div>
            </div>
          )}

          <div className="card flex flex-col overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <Flame size={12} style={{ color: 'var(--color-warning)' }} />
              <span className="label">High Performers</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar">
              {tableRows.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedEntity(item.name)}
                  className="px-4 py-3 cursor-pointer transition-colors duration-100 flex justify-between items-center"
                  style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: selectedEntity === item.name ? 'var(--bg-surface-active)' : undefined }}
                  onMouseEnter={e => { if (selectedEntity !== item.name) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                  onMouseLeave={e => { if (selectedEntity !== item.name) e.currentTarget.style.backgroundColor = ''; }}
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${item.source === 'google' ? 'badge-google' : 'badge-meta'}`}>{item.source}</span>
                      <span className="mono text-[10px] font-bold" style={{ color: 'var(--color-success)' }}>{item.roas.toFixed(1)}x</span>
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, accent, delta, invertDelta }) => {
  const num = delta !== null ? parseFloat(delta) : null;
  const isGood = num !== null && (invertDelta ? num < 0 : num > 0);
  const isBad  = num !== null && (invertDelta ? num > 0 : num < 0);

  return (
    <div className="card p-4 space-y-3" style={accent ? { borderColor: 'color-mix(in srgb, var(--accent-color) 35%, transparent)' } : {}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: accent ? 'var(--accent-color)' : 'var(--text-muted)' }}>{icon}</span>
          <span className="label">{title}</span>
        </div>
        {num !== null && (
          <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
            backgroundColor: isGood ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : isBad ? 'color-mix(in srgb, var(--color-error) 12%, transparent)' : 'var(--bg-surface-active)',
            color: isGood ? 'var(--color-success)' : isBad ? 'var(--color-error)' : 'var(--text-muted)',
          }}>
            {num > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <p className="mono text-2xl font-bold tracking-tight" style={{ color: accent ? 'var(--accent-color)' : 'var(--text-main)' }}>
        {value}
      </p>
    </div>
  );
};

const BudgetBar = ({ label, spent, budget, color }) => {
  const pct  = Math.min((spent / budget) * 100, 100);
  const over = spent > budget;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="label">{label}</span>
        <span className="mono text-xs font-semibold" style={{ color: over ? 'var(--color-error)' : 'var(--text-secondary)' }}>
          {formatCurrency(spent)} / {formatCurrency(budget)}
          {over && <span className="ml-1.5" style={{ color: 'var(--color-error)' }}>OVER</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-active)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? 'var(--color-error)' : color }}
        />
      </div>
    </div>
  );
};

const HistorySparkline = ({ data, dataKey, color }) => {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default Dashboard;
