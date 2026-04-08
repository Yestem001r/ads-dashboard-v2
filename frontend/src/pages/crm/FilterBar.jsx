import { Search, Plus, Settings2 } from 'lucide-react';

const SOURCES = [
    { value: 'all',    label: 'Все' },
    { value: 'meta',   label: 'Meta' },
    { value: 'google', label: 'Google' },
    { value: 'manual', label: 'Ручной' },
];

const FilterBar = ({ filters, onChange, onCreateLead, onManageStages, managers = [] }) => {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Поиск по имени, телефону, email..."
                    value={filters.search}
                    onChange={e => onChange({ ...filters, search: e.target.value })}
                    className="input-field"
                    style={{ width: '240px', paddingLeft: '28px' }}
                />
            </div>

            {/* Source filter */}
            <div className="flex items-center rounded-md overflow-hidden" style={{ border: '1px solid var(--border-strong)' }}>
                {SOURCES.map((s, i) => (
                    <button
                        key={s.value}
                        onClick={() => onChange({ ...filters, source: s.value })}
                        className="px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                        style={{
                            backgroundColor: filters.source === s.value
                                ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                                : 'var(--bg-surface)',
                            color: filters.source === s.value ? 'var(--accent-color)' : 'var(--text-muted)',
                            borderRight: i < SOURCES.length - 1 ? '1px solid var(--border-strong)' : 'none',
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Manager filter */}
            {managers.length > 0 && (
                <select
                    value={filters.manager || ''}
                    onChange={e => onChange({ ...filters, manager: e.target.value || '' })}
                    className="input-field text-xs"
                    style={{ minWidth: '140px' }}
                >
                    <option value="">Все менеджеры</option>
                    {managers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            )}

            <div className="flex items-center gap-2 ml-auto">
                {/* Manage stages */}
                <button
                    onClick={onManageStages}
                    className="btn-ghost flex items-center gap-1.5 text-xs"
                    title="Настроить этапы"
                >
                    <Settings2 size={13} />
                    Этапы
                </button>

                {/* New lead */}
                <button onClick={onCreateLead} className="btn-primary flex items-center gap-1.5">
                    <Plus size={13} />
                    Новый лид
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
