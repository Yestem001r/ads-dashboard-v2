import { useState, useEffect } from 'react';
import { X, Trash2, Loader2, Save, Check } from 'lucide-react';
import { fetchLead, fetchTimeline, updateLead, moveLead, deleteLead } from '../../lib/crmApi';
import { useAuth } from '../../context/AuthContext';
import TimelinePanel from './TimelinePanel';

const SOURCE_LABELS = { meta: 'Meta', google: 'Google', manual: 'Ручной' };

const LeadModal = ({ leadId, stages, onClose, onLeadUpdated, onLeadDeleted }) => {
    const { user } = useAuth();
    const [lead, setLead] = useState(null);
    const [events, setEvents] = useState([]);
    const [tab, setTab] = useState('details');
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadLead = async () => {
        const l = await fetchLead(leadId, user.id);
        setLead(l);
        setForm({
            name: l.name || '', phone: l.phone || '', email: l.email || '',
            messenger: l.messenger || '', campaign_name: l.campaign_name || '',
            manager: l.manager || '', deal_value: l.deal_value || '',
            tags: l.tags || [], notes: l.notes || '',
            utm_source: l.utm_source || '', utm_medium: l.utm_medium || '',
            utm_campaign: l.utm_campaign || '', utm_content: l.utm_content || '',
            utm_term: l.utm_term || '',
        });
    };

    const loadTimeline = async () => {
        const evts = await fetchTimeline(leadId, user.id);
        setEvents(evts);
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([loadLead(), loadTimeline()]).finally(() => setLoading(false));
    }, [leadId]);

    const handleStageChange = async (e) => {
        const newStageId = e.target.value;
        const fromStage = stages.find(s => s.id === lead.stage_id);
        const toStage = stages.find(s => s.id === newStageId);
        setLead(l => ({ ...l, stage_id: newStageId }));
        await moveLead(leadId, user.id, newStageId, fromStage?.name, toStage?.name);
        await loadTimeline();
        onLeadUpdated();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateLead(leadId, user.id, {
                ...form,
                deal_value: form.deal_value ? Number(form.deal_value) : null,
            });
            setLead(l => ({ ...l, ...updated }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onLeadUpdated();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Удалить лид "${lead.name}"?`)) return;
        await deleteLead(leadId, user.id);
        onLeadDeleted(leadId);
        onClose();
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return (
        <Overlay onClose={onClose}>
            <div className="flex items-center justify-center h-40">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
        </Overlay>
    );

    return (
        <Overlay onClose={onClose}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-strong)' }}>
                <div className="flex-1 min-w-0">
                    <input
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="text-base font-bold w-full bg-transparent outline-none"
                        style={{ color: 'var(--text-main)' }}
                    />
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)', color: 'var(--accent-color)' }}>
                            {SOURCE_LABELS[lead.source] || lead.source}
                        </span>
                        <select
                            value={lead.stage_id || ''}
                            onChange={handleStageChange}
                            className="text-[11px] font-semibold bg-transparent border-none outline-none cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5">
                        {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <Check size={11} /> : <Save size={11} />}
                        {saved ? 'Сохранено' : 'Сохранить'}
                    </button>
                    <button onClick={onClose} className="btn-ghost p-1.5"><X size={14} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid var(--border-strong)' }}>
                {['details', 'timeline'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="px-3 pb-2 text-xs font-semibold transition-colors duration-150"
                        style={tab === t
                            ? { color: 'var(--accent-color)', borderBottom: '2px solid var(--accent-color)' }
                            : { color: 'var(--text-muted)', borderBottom: '2px solid transparent' }
                        }>
                        {t === 'details' ? 'Детали' : `История (${events.length})`}
                    </button>
                ))}
            </div>

            {tab === 'details' && (
                <div className="space-y-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Телефон" value={form.phone} onChange={v => set('phone', v)} placeholder="+7..." />
                        <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="email@..." />
                        <Field label="Мессенджер" value={form.messenger} onChange={v => set('messenger', v)} placeholder="telegram: @..." />
                        <Field label="Менеджер" value={form.manager} onChange={v => set('manager', v)} />
                        <Field label="Кампания" value={form.campaign_name} onChange={v => set('campaign_name', v)} />
                        <Field label="Сумма сделки $" value={form.deal_value} onChange={v => set('deal_value', v)} type="number" />
                    </div>

                    {/* UTM */}
                    {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                        <div className="rounded-md p-3 space-y-2" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-strong)' }}>
                            <p className="label">UTM параметры</p>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                {['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k => lead[k] ? (
                                    <div key={k}>
                                        <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                                        <span className="mono" style={{ color: 'var(--text-main)' }}>{lead[k]}</span>
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="label">Заметки</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                            rows={4} className="input-field w-full resize-none text-xs" />
                    </div>

                    {/* Delete */}
                    <div className="pt-2" style={{ borderTop: '1px solid var(--border-strong)' }}>
                        <button onClick={handleDelete}
                            className="text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            <Trash2 size={12} /> Удалить лид
                        </button>
                    </div>
                </div>
            )}

            {tab === 'timeline' && (
                <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                    <TimelinePanel events={events} leadId={leadId} onNoteAdded={loadTimeline} />
                </div>
            )}
        </Overlay>
    );
};

const Overlay = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="card w-full max-w-2xl p-5 relative" style={{ maxHeight: '90vh', overflow: 'hidden' }}>
            {children}
        </div>
    </div>
);

const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div className="space-y-1.5">
        <label className="label">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} className="input-field w-full" />
    </div>
);

export default LeadModal;
