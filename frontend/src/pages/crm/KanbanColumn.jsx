import { useState } from 'react';
import { Plus } from 'lucide-react';
import LeadCard from './LeadCard';

const KanbanColumn = ({ stage, leads, onLeadClick, onCreateLead, onDrop, onLeadDragStart }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const totalValue = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    const headerColor = stage.is_won
        ? 'var(--color-success)'
        : stage.is_lost
        ? 'var(--color-error)'
        : stage.color;

    return (
        <div
            className="flex flex-col flex-shrink-0"
            style={{ width: '240px' }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(stage.id); }}
        >
            {/* Column header */}
            <div className="rounded-t-md px-3 py-2 mb-2"
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: `1px solid var(--border-strong)`,
                    borderTop: `3px solid ${headerColor}`,
                }}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                        {stage.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 flex-shrink-0"
                        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                        {leads.length}
                    </span>
                </div>
                {totalValue > 0 && (
                    <div className="text-[10px] mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        ${totalValue.toLocaleString()}
                    </div>
                )}
            </div>

            {/* Cards area */}
            <div
                className="flex-1 rounded-b-md p-2 custom-scrollbar overflow-y-auto"
                style={{
                    minHeight: '120px',
                    maxHeight: 'calc(100vh - 240px)',
                    backgroundColor: isDragOver
                        ? 'color-mix(in srgb, var(--accent-color) 5%, var(--bg-surface))'
                        : 'var(--bg-surface)',
                    border: `1px solid ${isDragOver ? 'color-mix(in srgb, var(--accent-color) 50%, transparent)' : 'var(--border-strong)'}`,
                    borderTop: 'none',
                    transition: 'background-color 0.15s, border-color 0.15s',
                }}
            >
                {leads.map(lead => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => onLeadClick(lead.id)}
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', lead.id); onLeadDragStart(lead.id, stage.id); }}
                    />
                ))}

                {leads.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Нет лидов
                    </div>
                )}

                <button
                    onClick={() => onCreateLead(stage.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold mt-1 transition-colors duration-150"
                    style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-strong)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-color) 40%, transparent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                >
                    <Plus size={11} /> Добавить лид
                </button>
            </div>
        </div>
    );
};

export default KanbanColumn;
