import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, TrendingUp, Users, MousePointerClick, Eye, Percent, Target, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatNumber   = (val) => new Intl.NumberFormat('en-US').format(val || 0);
const formatPct      = (val) => `${(val || 0).toFixed(2)}%`;

const CampaignDetail = () => {
  const { name } = useParams();
  const campaignName = decodeURIComponent(name);
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [adGroups, setAdGroups]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [leadValue, setLeadValue] = useState(120);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate]     = useState(new Date());

  const fmt = (d) => d.toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, settingsRes] = await Promise.all([
        axios.post(`${API_URL}/api/analytics/fetch`, {
          dateFrom: fmt(startDate), dateTo: fmt(endDate), userId: user.id, level: 'adgroup'
        }),
        axios.get(`${API_URL}/api/settings/${user.id}`)
      ]);
      const all = analyticsRes.data.data || [];
      setAdGroups(all.filter(r => r.parentName === campaignName));
      if (settingsRes.data?.leadValue) setLeadValue(Number(settingsRes.data.leadValue));
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const aggregated = useMemo(() => {
    const groups = adGroups.reduce((acc, row) => {
      if (!acc[row.name]) acc[row.name] = { ...row, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      acc[row.name].spend       += parseFloat(row.spend || 0);
      acc[row.name].impressions += parseInt(row.impressions || 0);
      acc[row.name].clicks      += parseInt(row.clicks || 0);
      acc[row.name].conversions += parseInt(row.conversions || 0);
      return acc;
    }, {});
    return Object.values(groups).map(r => ({
      ...r,
      ctr:  r.impressions > 0 ? r.clicks / r.impressions * 100 : 0,
      cpc:  r.clicks > 0 ? r.spend / r.clicks : 0,
      roas: r.spend > 0 ? (r.conversions * leadValue) / r.spend : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [adGroups, leadValue]);

  const totals = useMemo(() => {
    const t = aggregated.reduce((acc, r) => ({
      spend:       acc.spend       + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks:      acc.clicks      + r.clicks,
      conversions: acc.conversions + r.conversions,
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
    return {
      ...t,
      ctr:  t.impressions > 0 ? (t.clicks / t.impressions * 100).toFixed(2) : '0.00',
      cpc:  t.clicks > 0 ? t.spend / t.clicks : 0,
      roas: t.spend > 0 ? ((t.conversions * leadValue) / t.spend).toFixed(2) : '0.00',
    };
  }, [aggregated, leadValue]);

  const chartData = useMemo(() => {
    const dailyMap = adGroups.reduce((acc, r) => {
      const d = r.date ? r.date.split('T')[0] : 'N/A';
      if (!acc[d]) acc[d] = { date: d, Spend: 0, Leads: 0, Clicks: 0 };
      acc[d].Spend  += parseFloat(r.spend || 0);
      acc[d].Leads  += parseInt(r.conversions || 0);
      acc[d].Clicks += parseInt(r.clicks || 0);
      return acc;
    }, {});
    return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [adGroups]);

  return (
    <div className="p-6 max-w-360 mx-auto space-y-5" style={{ color: 'var(--text-main)' }}>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-150"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-active)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
          >
            <ArrowLeft size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight truncate max-w-lg">{campaignName}</h1>
            <p className="label mt-1">Ad Group Breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 h-8 rounded-md" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
          <div className="flex items-center mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            <DatePicker selected={startDate} onChange={d => setStartDate(d)} selectsStart startDate={startDate} endDate={endDate} dateFormat="MMM d" className="bg-transparent w-10.5 outline-none" />
            <span className="mx-1 opacity-30">–</span>
            <DatePicker selected={endDate} onChange={d => setEndDate(d)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="MMM d" className="bg-transparent w-10.5 outline-none" />
          </div>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard title="Ad Spend"    value={formatCurrency(totals.spend)}       icon={<TrendingUp size={13} />} loading={loading} />
        <StatCard title="Impressions" value={formatNumber(totals.impressions)}    icon={<Eye size={13} />}        loading={loading} />
        <StatCard title="Clicks"      value={formatNumber(totals.clicks)}         icon={<MousePointerClick size={13} />} loading={loading} />
        <StatCard title="Leads"       value={formatNumber(totals.conversions)}    icon={<Users size={13} />}      loading={loading} />
        <StatCard title="CTR"         value={`${totals.ctr}%`}                   icon={<Percent size={13} />}    loading={loading} accent />
        <StatCard title="ROAS"        value={`${totals.roas}x`}                  icon={<Target size={13} />}     loading={loading} />
      </div>

      {/* Chart */}
      <div className="card flex flex-col" style={{ minHeight: '260px' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="label">Spend · Leads · Clicks over time</span>
        </div>
        <div className="p-5 flex-1">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="detailSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-color)" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} dy={8} />
              <YAxis yAxisId="left"  stroke="var(--text-muted)"    fontSize={10} fontWeight={600} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-success)" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }} />
              <Area yAxisId="left"  type="monotone" dataKey="Spend"  stroke="var(--accent-color)"  strokeWidth={1.5} fill="url(#detailSpend)" activeDot={{ r: 3 }} />
              <Area yAxisId="right" type="monotone" dataKey="Leads"  stroke="var(--color-success)" strokeWidth={1.5} fill="transparent" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="Clicks" stroke="var(--color-warning)"  strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ad groups table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 50%, transparent)', borderBottom: '1px solid var(--border-strong)' }}>
            <tr>
              {['Ad Group', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'ROAS'].map(h => (
                <th key={h} className={`px-4 py-3 ${h !== 'Ad Group' ? 'text-right' : ''}`}>
                  <span className="label">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded" style={{ backgroundColor: 'var(--bg-surface-active)', width: j === 0 ? '70%' : '55%', marginLeft: j > 0 ? 'auto' : undefined }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : aggregated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <AlertCircle size={24} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold">No ad groups found for this campaign</p>
                  </div>
                </td>
              </tr>
            ) : (
              aggregated.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-main)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{formatCurrency(row.spend)}</td>
                  <td className="px-4 py-3 text-right mono text-sm" style={{ color: 'var(--text-secondary)' }}>{formatNumber(row.impressions)}</td>
                  <td className="px-4 py-3 text-right mono text-sm" style={{ color: 'var(--text-secondary)' }}>{formatNumber(row.clicks)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>{formatPct(row.ctr)}</td>
                  <td className="px-4 py-3 text-right mono text-sm" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.cpc)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-bold" style={{ color: 'var(--color-success)' }}>{formatNumber(row.conversions)}</td>
                  <td className="px-4 py-3 text-right mono text-sm font-bold" style={{ color: row.roas >= 1 ? 'var(--color-success)' : 'var(--color-error)' }}>{row.roas.toFixed(2)}x</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, accent, loading }) => (
  <div className="card p-4 space-y-3" style={accent ? { borderColor: 'color-mix(in srgb, var(--accent-color) 35%, transparent)' } : {}}>
    <div className="flex items-center gap-2">
      <span style={{ color: accent ? 'var(--accent-color)' : 'var(--text-muted)' }}>{icon}</span>
      <span className="label">{title}</span>
    </div>
    {loading ? (
      <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
    ) : (
      <p className="mono text-2xl font-bold tracking-tight" style={{ color: accent ? 'var(--accent-color)' : 'var(--text-main)' }}>{value}</p>
    )}
  </div>
);

export default CampaignDetail;
