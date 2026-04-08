import { useRef } from 'react';
import KanbanColumn from './KanbanColumn';

const KanbanBoard = ({ stages, leadsMap, onLeadDrop, onLeadClick, onCreateLead }) => {
    const dragState = useRef({ leadId: null, fromStageId: null });

    const handleLeadDragStart = (leadId, fromStageId) => {
        dragState.current = { leadId, fromStageId };
    };

    const handleDrop = (toStageId) => {
        const { leadId, fromStageId } = dragState.current;
        if (leadId && fromStageId !== toStageId) {
            onLeadDrop(leadId, fromStageId, toStageId);
        }
        dragState.current = { leadId: null, fromStageId: null };
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar" style={{ minHeight: '400px' }}>
            {stages.map(stage => (
                <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    leads={leadsMap[stage.id] || []}
                    onLeadClick={onLeadClick}
                    onCreateLead={onCreateLead}
                    onDrop={handleDrop}
                    onLeadDragStart={handleLeadDragStart}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
