const SOURCE_COLORS = {
    meta:   { bg: 'color-mix(in srgb, #8b5cf6 15%, transparent)', color: '#8b5cf6' },
    google: { bg: 'color-mix(in srgb, #4285f4 15%, transparent)', color: '#4285f4' },
    manual: { bg: 'color-mix(in srgb, #6b7280 15%, transparent)', color: '#9ca3af' },
};

const relativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    return `${Math.floor(h / 24)} дн назад`;
};

const LeadCard = ({ lead, onClick, onDragStart }) => {
    const src = SOURCE_COLORS[lead.source] || SOURCE_COLORS.manual;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="card p-3 cursor-grab active:cursor-grabbing select-none"
            style={{ marginBottom: '8px', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-color) 40%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = ''}
        >
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {lead.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ backgroundColor: src.bg, color: src.color }}>
                    {lead.source}
                </span>
            </div>

            {(lead.phone || lead.email) && (
                <div className="text-[11px] mono mb-1" style={{ color: 'var(--text-muted)' }}>
                    {lead.phone || lead.email}
                </div>
            )}

            {lead.campaign_name && (
                <div className="text-[10px] mb-1.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {lead.campaign_name}
                </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex gap-1 flex-wrap">
                    {(lead.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                            {tag}
                        </span>
                    ))}
                    {(lead.tags || []).length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                            +{lead.tags.length - 2}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {lead.deal_value && (
                        <span className="text-[11px] mono font-bold" style={{ color: 'var(--accent-color)' }}>
                            ${Number(lead.deal_value).toLocaleString()}
                        </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {relativeTime(lead.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LeadCard;
