import { useState } from 'react';
import { X, Plus, Trash2, GripVertical, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const PRESET_COLORS = [
    '#6366f1', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#ec4899', '#22c55e', '#ef4444', '#14b8a6',
];

const StageManager = ({ stages, onClose, onSaved }) => {
    const { user } = useAuth();
    const [list, setList] = useState(stages.map(s => ({ ...s })));
    const [saving, setSaving] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);

    const update = (id, key, val) =>
        setList(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s));

    const addStage = () => {
        setList(prev => [...prev, {
            id: `new_${Date.now()}`,
            name: 'Новый этап',
            color: '#3b82f6',
            position: prev.length,
            is_won: false,
            is_lost: false,
            isNew: true,
        }]);
    };

    const removeStage = (id) => {
        if (list.filter(s => !s.isDeleted).length <= 1) return;
        setList(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
    };

    // Drag-and-drop reorder
    const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        const newList = [...list];
        const [moved] = newList.splice(dragIdx, 1);
        newList.splice(idx, 0, moved);
        setList(newList);
        setDragIdx(idx);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const active = list.filter(s => !s.isDeleted);
            for (let i = 0; i < active.length; i++) {
                const s = active[i];
                if (s.isNew) {
                    await axios.post(`${API_URL}/api/crm/stages/create`, {
                        userId: user.id, name: s.name, color: s.color,
                        position: i, is_won: s.is_won, is_lost: s.is_lost,
                    });
                } else {
                    await axios.patch(`${API_URL}/api/crm/stages/${s.id}`, {
                        userId: user.id, name: s.name, color: s.color,
                        position: i, is_won: s.is_won, is_lost: s.is_lost,
                    });
                }
            }
            const deleted = list.filter(s => s.isDeleted && !s.isNew);
            for (const s of deleted) {
                await axios.delete(`${API_URL}/api/crm/stages/${s.id}`, { data: { userId: user.id } });
            }
            onSaved();
            onClose();
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const visible = list.filter(s => !s.isDeleted);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="card w-full max-w-lg p-5" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Настройка этапов воронки</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5"><X size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {visible.map((stage, idx) => (
                        <div key={stage.id}
                            draggable
                            onDragStart={e => handleDragStart(e, idx)}
                            onDragOver={e => handleDragOver(e, idx)}
                            onDragEnd={() => setDragIdx(null)}
                            className="flex items-center gap-2 p-2 rounded-md"
                            style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-strong)', cursor: 'grab' }}>

                            <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                            {/* Color picker */}
                            <div className="relative flex-shrink-0">
                                <div className="w-5 h-5 rounded-full cursor-pointer" style={{ backgroundColor: stage.color }} />
                                <input type="color" value={stage.color}
                                    onChange={e => update(stage.id, 'color', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5" />
                            </div>

                            <input
                                value={stage.name}
                                onChange={e => update(stage.id, 'name', e.target.value)}
                                className="input-field flex-1 text-xs py-1"
                                style={{ minWidth: 0 }}
                            />

                            {/* Won/Lost toggles */}
                            <button
                                type="button"
                                onClick={() => update(stage.id, 'is_won', !stage.is_won)}
                                title="Сделка закрыта (Won)"
                                className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 transition-colors"
                                style={stage.is_won
                                    ? { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }
                                    : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                                Won
                            </button>
                            <button
                                type="button"
                                onClick={() => update(stage.id, 'is_lost', !stage.is_lost)}
                                title="Отказ (Lost)"
                                className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 transition-colors"
                                style={stage.is_lost
                                    ? { backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)', color: 'var(--color-error)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)' }
                                    : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                                Lost
                            </button>

                            <button onClick={() => removeStage(stage.id)} className="flex-shrink-0"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-3 space-y-2">
                    <button onClick={addStage}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors"
                        style={{ border: '1px dashed var(--border-strong)', color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-color) 40%, transparent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
                        <Plus size={12} /> Добавить этап
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Сохранить
                        </button>
                        <button onClick={onClose} className="btn-ghost px-4">Отмена</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StageManager;
