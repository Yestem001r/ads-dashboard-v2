import { useState } from 'react';
import { X, Plus } from 'lucide-react';

const SOURCES = ['manual', 'meta', 'google'];

const LeadForm = ({ initialStageId, stages, onSubmit, onCancel, loading }) => {
    const [form, setForm] = useState({
        name: '', phone: '', email: '', messenger: '',
        source: 'manual', campaign_name: '',
        utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '',
        manager: '', deal_value: '', tags: [], notes: '',
        stage_id: initialStageId || stages?.[0]?.id || '',
    });
    const [tagInput, setTagInput] = useState('');
    const [showUtm, setShowUtm] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); setTagInput(''); }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSubmit({ ...form, deal_value: form.deal_value ? Number(form.deal_value) : null });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source toggle */}
            <div className="space-y-1.5">
                <label className="label">Источник</label>
                <div className="flex gap-2">
                    {SOURCES.map(s => (
                        <button key={s} type="button"
                            onClick={() => set('source', s)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150"
                            style={form.source === s
                                ? { backgroundColor: 'color-mix(in srgb, var(--accent-color) 15%, transparent)', color: 'var(--accent-color)', border: '1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)' }
                                : { backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }
                            }>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Имя *" value={form.name} onChange={v => set('name', v)} placeholder="Иван Иванов" required />
                <Field label="Телефон" value={form.phone} onChange={v => set('phone', v)} placeholder="+7..." />
                <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="email@..." type="email" />
                <Field label="Мессенджер" value={form.messenger} onChange={v => set('messenger', v)} placeholder="telegram:@user / wa:+7..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="label">Этап</label>
                    <select value={form.stage_id} onChange={e => set('stage_id', e.target.value)} className="input-field w-full">
                        {(stages || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <Field label="Кампания" value={form.campaign_name} onChange={v => set('campaign_name', v)} placeholder="Название кампании" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Менеджер" value={form.manager} onChange={v => set('manager', v)} placeholder="Имя менеджера" />
                <Field label="Сумма сделки $" value={form.deal_value} onChange={v => set('deal_value', v)} placeholder="0" type="number" />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
                <label className="label">Теги</label>
                <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Добавить тег + Enter" className="input-field flex-1" />
                    <button type="button" onClick={addTag} className="btn-ghost px-3"><Plus size={13} /></button>
                </div>
                {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {form.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                                {tag}
                                <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* UTM toggle */}
            <button type="button" onClick={() => setShowUtm(v => !v)}
                className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                {showUtm ? '▲ Скрыть UTM' : '▼ UTM параметры'}
            </button>

            {showUtm && (
                <div className="grid grid-cols-2 gap-3">
                    <Field label="utm_source" value={form.utm_source} onChange={v => set('utm_source', v)} />
                    <Field label="utm_medium" value={form.utm_medium} onChange={v => set('utm_medium', v)} />
                    <Field label="utm_campaign" value={form.utm_campaign} onChange={v => set('utm_campaign', v)} />
                    <Field label="utm_content" value={form.utm_content} onChange={v => set('utm_content', v)} />
                    <Field label="utm_term" value={form.utm_term} onChange={v => set('utm_term', v)} />
                </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
                <label className="label">Заметки</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Комментарии о лиде..."
                    rows={3} className="input-field w-full resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading || !form.name.trim()} className="btn-primary flex-1">
                    {loading ? 'Создание...' : 'Создать лид'}
                </button>
                <button type="button" onClick={onCancel} className="btn-ghost px-4">Отмена</button>
            </div>
        </form>
    );
};

const Field = ({ label, value, onChange, placeholder, type = 'text', required }) => (
    <div className="space-y-1.5">
        <label className="label">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} required={required} className="input-field w-full" />
    </div>
);

export default LeadForm;
