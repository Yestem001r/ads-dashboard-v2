import { useState, useEffect, useMemo } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchStages, fetchLeads, createLead, moveLead } from '../lib/crmApi';
import KanbanBoard from './crm/KanbanBoard';
import FilterBar from './crm/FilterBar';
import LeadModal from './crm/LeadModal';
import LeadForm from './crm/LeadForm';
import StageManager from './crm/StageManager';

const CRM = () => {
    const { user } = useAuth();
    const [stages, setStages] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ source: 'all', search: '', manager: '' });
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showStageManager, setShowStageManager] = useState(false);
    const [createStageId, setCreateStageId] = useState(null);
    const [creating, setCreating] = useState(false);

    const loadAll = async () => {
        try {
            const [s, l] = await Promise.all([
                fetchStages(user.id),
                fetchLeads(user.id),
            ]);
            setStages(s);
            setLeads(l);
        } catch (err) {
            console.error('CRM load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    // Unique managers list for filter dropdown
    const managers = useMemo(() =>
        [...new Set(leads.map(l => l.manager).filter(Boolean))].sort()
    , [leads]);

    // Apply filters client-side
    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            if (filters.source !== 'all' && l.source !== filters.source) return false;
            if (filters.manager && l.manager !== filters.manager) return false;
            if (filters.search) {
                const q = filters.search.toLowerCase();
                return (l.name || '').toLowerCase().includes(q) ||
                    (l.phone || '').includes(q) ||
                    (l.email || '').toLowerCase().includes(q) ||
                    (l.notes || '').toLowerCase().includes(q);
            }
            return true;
        });
    }, [leads, filters]);

    // Build map stageId → leads[]
    const leadsMap = useMemo(() => {
        const map = {};
        stages.forEach(s => { map[s.id] = []; });
        filteredLeads.forEach(l => {
            if (l.stage_id && map[l.stage_id]) map[l.stage_id].push(l);
            else if (l.stage_id) map[l.stage_id] = [l];
        });
        return map;
    }, [filteredLeads, stages]);

    const handleLeadDrop = async (leadId, fromStageId, toStageId) => {
        const fromStage = stages.find(s => s.id === fromStageId);
        const toStage = stages.find(s => s.id === toStageId);
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: toStageId } : l));
        try {
            await moveLead(leadId, user.id, toStageId, fromStage?.name, toStage?.name);
        } catch {
            // Rollback
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: fromStageId } : l));
        }
    };

    const handleCreateLead = (stageId) => {
        setCreateStageId(stageId);
        setShowCreateForm(true);
    };

    const handleFormSubmit = async (fields) => {
        setCreating(true);
        try {
            const lead = await createLead(user.id, { ...fields, stage_id: createStageId || stages[0]?.id });
            setLeads(prev => [lead, ...prev]);
            setShowCreateForm(false);
        } catch (err) {
            alert('Ошибка создания лида: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const totalLeads = leads.length;
    const wonStage = stages.find(s => s.is_won);
    const wonLeads = wonStage ? leads.filter(l => l.stage_id === wonStage.id).length : 0;
    const totalValue = leads.reduce((s, l) => s + (Number(l.deal_value) || 0), 0);

    return (
        <div className="p-6 space-y-5" style={{ color: 'var(--text-main)' }}>
            {/* Header */}
            <div className="flex items-center justify-between pb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">CRM</h1>
                    <p className="label mt-1">Управление лидами</p>
                </div>
                <div className="flex items-center gap-5">
                    <Stat label="Всего лидов" value={totalLeads} />
                    <Stat label="Сделок закрыто" value={wonLeads} color="var(--color-success)" />
                    {totalValue > 0 && <Stat label="Сумма сделок" value={`$${totalValue.toLocaleString()}`} color="var(--accent-color)" />}
                </div>
            </div>

            {/* Filter bar */}
            <FilterBar
                filters={filters}
                onChange={setFilters}
                onCreateLead={() => handleCreateLead(stages[0]?.id)}
                onManageStages={() => setShowStageManager(true)}
                managers={managers}
            />

            {/* Board */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
            ) : stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Users size={32} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Воронка не настроена</p>
                </div>
            ) : (
                <KanbanBoard
                    stages={stages}
                    leadsMap={leadsMap}
                    onLeadDrop={handleLeadDrop}
                    onLeadClick={setSelectedLeadId}
                    onCreateLead={handleCreateLead}
                />
            )}

            {/* Lead detail modal */}
            {selectedLeadId && (
                <LeadModal
                    leadId={selectedLeadId}
                    stages={stages}
                    onClose={() => setSelectedLeadId(null)}
                    onLeadUpdated={loadAll}
                    onLeadDeleted={(id) => { setLeads(prev => prev.filter(l => l.id !== id)); }}
                />
            )}

            {/* Stage manager modal */}
            {showStageManager && (
                <StageManager
                    stages={stages}
                    onClose={() => setShowStageManager(false)}
                    onSaved={loadAll}
                />
            )}

            {/* Create lead modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowCreateForm(false); }}>
                    <div className="card w-full max-w-xl p-5 overflow-y-auto custom-scrollbar" style={{ maxHeight: '90vh' }}>
                        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-main)' }}>Новый лид</h2>
                        <LeadForm
                            initialStageId={createStageId}
                            stages={stages}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setShowCreateForm(false)}
                            loading={creating}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const Stat = ({ label, value, color }) => (
    <div className="text-right">
        <div className="text-lg font-bold mono" style={{ color: color || 'var(--text-main)' }}>{value}</div>
        <div className="label">{label}</div>
    </div>
);

export default CRM;
