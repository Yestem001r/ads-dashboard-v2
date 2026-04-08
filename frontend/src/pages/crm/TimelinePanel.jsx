import { useState } from 'react';
import { UserPlus, ArrowRight, MessageSquare, Zap, Edit2, Loader2 } from 'lucide-react';
import { addNote } from '../../lib/crmApi';
import { useAuth } from '../../context/AuthContext';

const TYPE_CONFIG = {
    lead_created:   { icon: UserPlus,    color: 'var(--color-success)' },
    stage_change:   { icon: ArrowRight,  color: 'var(--accent-color)' },
    note_added:     { icon: MessageSquare, color: '#f59e0b' },
    field_updated:  { icon: Edit2,       color: 'var(--text-muted)' },
    webhook_received: { icon: Zap,       color: '#8b5cf6' },
};

const relativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} дн назад`;
    return new Date(dateStr).toLocaleDateString('ru-RU');
};

const TimelinePanel = ({ events, leadId, onNoteAdded }) => {
    const { user } = useAuth();
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAddNote = async () => {
        if (!note.trim()) return;
        setSaving(true);
        try {
            await addNote(leadId, user.id, note.trim());
            setNote('');
            onNoteAdded();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Add note */}
            <div className="space-y-2">
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Добавить заметку..."
                    rows={2}
                    className="input-field w-full resize-none text-xs"
                />
                <button
                    onClick={handleAddNote}
                    disabled={saving || !note.trim()}
                    className="btn-primary text-xs"
                >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : null}
                    Добавить заметку
                </button>
            </div>

            {/* Events list */}
            <div className="space-y-3">
                {events.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Нет событий</p>
                )}
                {events.map(event => {
                    const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.field_updated;
                    const Icon = cfg.icon;
                    return (
                        <div key={event.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                                style={{ backgroundColor: 'color-mix(in srgb, ' + cfg.color + ' 15%, transparent)', color: cfg.color }}>
                                <Icon size={11} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs" style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>
                                    {event.body}
                                </p>
                                {event.meta?.from && event.meta?.to && (
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {event.meta.from} → {event.meta.to}
                                    </p>
                                )}
                                <p className="text-[10px] mt-0.5 mono" style={{ color: 'var(--text-muted)' }}>
                                    {relativeTime(event.created_at)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelinePanel;
