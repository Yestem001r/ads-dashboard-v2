import axios from 'axios';
import { API_URL } from './api';

export const fetchStages = (userId) =>
    axios.get(`${API_URL}/api/crm/stages?userId=${userId}`).then(r => r.data.stages);

export const reorderStages = (userId, stageIds) =>
    axios.post(`${API_URL}/api/crm/stages/reorder`, { userId, stageIds }).then(r => r.data);

export const fetchLeads = (userId, filters = {}) => {
    const params = new URLSearchParams({ userId });
    if (filters.stageId) params.set('stageId', filters.stageId);
    if (filters.source && filters.source !== 'all') params.set('source', filters.source);
    if (filters.search) params.set('search', filters.search);
    return axios.get(`${API_URL}/api/crm/leads?${params}`).then(r => r.data.leads);
};

export const fetchLead = (leadId, userId) =>
    axios.get(`${API_URL}/api/crm/leads/${leadId}?userId=${userId}`).then(r => r.data.lead);

export const createLead = (userId, fields) =>
    axios.post(`${API_URL}/api/crm/leads/create`, { userId, ...fields }).then(r => r.data.lead);

export const updateLead = (leadId, userId, fields) =>
    axios.patch(`${API_URL}/api/crm/leads/${leadId}/update`, { userId, ...fields }).then(r => r.data.lead);

export const moveLead = (leadId, userId, stageId, fromStageName, toStageName) =>
    axios.patch(`${API_URL}/api/crm/leads/${leadId}/stage`, { userId, stageId, fromStageName, toStageName }).then(r => r.data);

export const deleteLead = (leadId, userId) =>
    axios.delete(`${API_URL}/api/crm/leads/${leadId}`, { data: { userId } }).then(r => r.data);

export const addNote = (leadId, userId, note) =>
    axios.post(`${API_URL}/api/crm/leads/${leadId}/notes`, { userId, note }).then(r => r.data);

export const fetchTimeline = (leadId, userId) =>
    axios.get(`${API_URL}/api/crm/timeline/${leadId}?userId=${userId}`).then(r => r.data.events);
