import { Sparkles, AlertCircle, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const PRIORITY_COLOR = {
  high:   'var(--color-error)',
  medium: 'var(--color-warning)',
  low:    'var(--text-muted)',
};

const AIInsightsPanel = ({ insights, loading, error }) => {
  const [expanded, setExpanded] = useState(true);

  if (!loading && !insights && !error) return null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between cursor-pointer"
        style={{ borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: 'var(--accent-color)' }} />
          <span className="label">AI Insights</span>
          {loading && (
            <span className="text-[10px] font-semibold animate-pulse" style={{ color: 'var(--text-muted)' }}>
              Analyzing...
            </span>
          )}
          {insights?.generatedAt && !loading && (
            <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {new Date(insights.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />}
      </div>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 rounded w-3/4" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
              <div className="h-3 rounded w-full" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
              <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--bg-surface-active)' }} />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}

          {insights && !loading && (
            <>
              {/* Summary */}
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {insights.summary}
              </p>

              {/* Anomalies */}
              {insights.anomalies?.length > 0 && (
                <div className="space-y-2">
                  <p className="label">Anomalies Detected</p>
                  {insights.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-md"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
                      <AlertCircle size={11} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        {a.change && (
                          <span className="mono text-[10px] font-bold mr-1.5" style={{ color: 'var(--color-warning)' }}>{a.change}</span>
                        )}
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{a.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <p className="label">Recommendations</p>
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Lightbulb size={11} style={{ color: PRIORITY_COLOR[r.priority] || 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold" style={{ color: 'var(--text-main)' }}>{r.action}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
