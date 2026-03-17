import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Calendar, RefreshCw, AlertCircle, Download, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatNumber   = (val) => new Intl.NumberFormat('en-US').format(val || 0);
const formatPct      = (val) => `${(val || 0).toFixed(2)}%`;

const LEVELS = [
  { key: 'campaign', label: 'Campaign' },
  { key: 'adgroup',  label: 'Ad Group' },
  { key: 'ad',       label: 'Ad' },
];

const COLUMNS = [
  { key: 'source',      label: 'Source',      align: 'left',  fmt: null },
  { key: 'name',        label: 'Name',        align: 'left',  fmt: null },
  { key: 'spend',       label: 'Spend',       align: 'right', fmt: formatCurrency },
  { key: 'impressions', label: 'Impressions', align: 'right', fmt: formatNumber },
  { key: 'clicks',      label: 'Clicks',      align: 'right', fmt: formatNumber },
  { key: 'ctr',         label: 'CTR',         align: 'right', fmt: formatPct },
  { key: 'cpc',         label: 'CPC',         align: 'right', fmt: formatCurrency },
  { key: 'conversions', label: 'Conversions', align: 'right', fmt: formatNumber },
  { key: 'roas',        label: 'ROAS',        align: 'right', fmt: v => `${(v || 0).toFixed(2)}x` },
];

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel]           = useState('campaign');
  const [leadValue, setLeadValue]   = useState(120);
  const [sortKey, setSortKey]       = useState('spend');
  const [sortDir, setSortDir]       = useState('desc');
  const [startDate, setStartDate]   = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate]       = useState(new Date());

  const fmt = (d) => d.toISOString().split('T')[0];

  const fetchData = async (lvl = level, from = startDate, to = endDate) => {
    setLoading(true);
    try {
      const [analyticsRes, settingsRes] = await Promise.all([
        axios.post(`${API_URL}/api/analytics/fetch`, {
          dateFrom: fmt(from), dateTo: fmt(to), userId: user.id, level: lvl
        }),
        axios.get(`${API_URL}/api/settings/${user.id}`)
      ]);
      setData(analyticsRes.data.data || []);
      if (settingsRes.data?.leadValue) setLeadValue(Number(settingsRes.data.leadValue));
    } catch (e) {
      console.error("API Error:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(level, startDate, endDate); }, [level, startDate, endDate]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const aggregatedData = useMemo(() => {
    const groups = data.reduce((acc, row) => {
      const key = `${row.source}::${row.name}`;
      if (!acc[key]) acc[key] = { ...row, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      acc[key].spend       += parseFloat(row.spend || 0);
      acc[key].impressions += parseInt(row.impressions || 0);
      acc[key].clicks      += parseInt(row.clicks || 0);
      acc[key].conversions += parseInt(row.conversions || 0);
      return acc;
    }, {});

    return Object.values(groups)
      .map(row => ({
        ...row,
        ctr:  row.impressions > 0 ? row.clicks / row.impressions * 100 : 0,
        cpc:  row.clicks > 0 ? row.spend / row.clicks : 0,
        roas: row.spend > 0 ? (row.conversions * leadValue) / row.spend : 0,
      }))
      .filter(row => row.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [data, searchQuery, sortKey, sortDir, leadValue]);

  const exportCSV = () => {
    const headers = COLUMNS.map(c => c.label);
    const rows = aggregatedData.map(row =>
      COLUMNS.map(c => {
        const val = row[c.key];
        if (c.fmt) return c.fmt(val).replace(/,/g, '');
        return val ?? '';
      })
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analytics-${level}-${fmt(startDate)}-${fmt(endDate)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronDown size={10} style={{ opacity: 0.25 }} />;
    return sortDir === 'desc' ? <ChevronDown size={10} style={{ color: 'var(--accent-color)' }} /> : <ChevronUp size={10} style={{ color: 'var(--accent-color)' }} />;
  };

  return (
    <div className="p-6 space-y-5 max-w-400 mx-auto" style={{ color: 'var(--text-main)' }}>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Performance Table</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'animate-pulse' : ''}`} style={{ backgroundColor: loading ? 'var(--color-warning)' : 'var(--color-success)' }} />
            <span className="label">{loading ? 'Syncing data...' : `${fmt(startDate)} – ${fmt(endDate)}`}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-md" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', minWidth: '180px' }}>
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Filter ${LEVELS.find(l => l.key === level)?.label.toLowerCase()}s...`}
              className="bg-transparent text-xs outline-none flex-1"
              style={{ color: 'var(--text-main)' }}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Level switcher */}
          <div className="flex p-0.5 rounded" style={{ backgroundColor: 'var(--toggle-wrapper-bg)', border: '1px solid var(--border-strong)' }}>
            {LEVELS.map(l => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors duration-150"
                style={level === l.key
                  ? { backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-main)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-md" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            <div className="flex items-center mono text-xs" style={{ color: 'var(--text-secondary)' }}>
              <DatePicker
                selected={startDate}
                onChange={d => setStartDate(d)}
                selectsStart startDate={startDate} endDate={endDate}
                dateFormat="MMM d" className="bg-transparent w-10.5 outline-none"
              />
              <span className="mx-1 opacity-30">–</span>
              <DatePicker
                selected={endDate}
                onChange={d => setEndDate(d)}
                selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                dateFormat="MMM d" className="bg-transparent w-10.5 outline-none"
              />
            </div>
            <button
              onClick={() => fetchData(level, startDate, endDate)}
              disabled={loading}
              className="p-1 rounded transition-colors duration-150 disabled:opacity-40"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-active)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} style={{ color: loading ? 'var(--accent-color)' : 'var(--text-muted)' }} />
            </button>
          </div>

          {/* CSV export */}
          <button
            onClick={exportCSV}
            disabled={loading || aggregatedData.length === 0}
            className="btn-ghost"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 50%, transparent)', borderBottom: '1px solid var(--border-strong)' }}>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 cursor-pointer select-none ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="label inline-flex items-center gap-1">
                    {col.label} <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {COLUMNS.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 rounded" style={{ backgroundColor: 'var(--bg-surface-active)', width: col.key === 'name' ? '75%' : '60%', marginLeft: col.align === 'right' ? 'auto' : undefined }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : aggregatedData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <AlertCircle size={24} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold">No data found</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Adjust the date range or clear the search filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              aggregatedData.map((row, i) => {
                const clickable = level === 'campaign';
                return (
                <tr
                  key={i}
                  className="transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: clickable ? 'pointer' : 'default' }}
                  onClick={() => clickable && navigate(`/dashboard/campaign/${encodeURIComponent(row.name)}`)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <td className="px-4 py-3">
                    <span className={`badge ${row.source === 'google' ? 'badge-google' : 'badge-meta'}`}>{row.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{row.name}</p>
                        {row.parentName && (
                          <p className="text-xs mt-0.5 truncate max-w-64" style={{ color: 'var(--text-muted)' }}>{row.parentName}</p>
                        )}
                      </div>
                      {clickable && <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right mono text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{formatCurrency(row.spend)}</td>
                  <td className="px-4 py-3 text-right mono text-sm"                style={{ color: 'var(--text-secondary)' }}>{formatNumber(row.impressions)}</td>
                  <td className="px-4 py-3 text-right mono text-sm"                style={{ color: 'var(--text-secondary)' }}>{formatNumber(row.clicks)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>{formatPct(row.ctr)}</td>
                  <td className="px-4 py-3 text-right mono text-sm"                style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.cpc)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-bold"     style={{ color: 'var(--color-success)' }}>{formatNumber(row.conversions)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-bold"     style={{ color: row.roas >= 1 ? 'var(--color-success)' : 'var(--color-error)' }}>{(row.roas || 0).toFixed(2)}x</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
