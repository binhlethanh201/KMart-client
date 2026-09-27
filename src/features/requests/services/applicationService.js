import apiClient from '../../../services/apiClient';

const mapToFrontendModel = (a) => {
  return {
    id: a.id,
    title: a.title || (a.documentTypeName || 'Yêu cầu'),
    type: a.documentTypeName || 'Yêu cầu',
    creatorId: a.creatorId || a.applicantId,
    creatorName: a.creatorName || a.applicantName,
    departmentId: a.departmentId,
    createdAt: new Date(a.createdAt).toLocaleString('vi-VN'),
    _createdAt: a.createdAt,
    status: a.status.toLowerCase(), // 'draft', 'pending', 'approved', 'rejected'
    currentStep: a.currentStepOrder || 0,
    fields: {
      ...((typeof a.data === 'string') ? (() => { try { return JSON.parse(a.data); } catch { return {}; } })() : (a.data || {})),
      ...(a.startDate ? { startTime: new Date(a.startDate).toLocaleString('vi-VN') } : {}),
      ...(a.endDate ? { endTime: new Date(a.endDate).toLocaleString('vi-VN') } : {}),
      ...(a.totalDays ? { totalDays: a.totalDays } : {}),
      ...(a.reason ? { reason: a.reason } : {})
    },
    steps: (a.steps || []).map(s => ({
      approverId: s.approverId,
      status: s.status.toLowerCase(),
      actedAt: s.actedAt ? new Date(s.actedAt).toLocaleString('vi-VN') : null
    })),
    comments: (a.comments || []).map(c => ({
      userId: c.userId,
      text: c.content,
      at: new Date(c.createdAt).toLocaleString('vi-VN')
    })),
    history: (a.histories || []).map(h => ({
      at: new Date(h.createdAt).toLocaleString('vi-VN'),
      text: h.action,
      type: h.actionType?.toLowerCase() || 'info'
    }))
  };
};

export const applicationService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/applications?limit=1000');
      return response.data.items.map(mapToFrontendModel);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) return [];
      throw err;
    }
  },

  getMyRequests: async () => {
    const response = await apiClient.get('/applications/my?limit=1000');
    return response.data.items.map(mapToFrontendModel);
  },

  getPendingApprovals: async () => {
    const response = await apiClient.get('/applications/pending?limit=1000');
    return response.data.items.map(a => ({ ...mapToFrontendModel(a), _isPendingReq: true }));
  },

  getById: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return mapToFrontendModel(response.data);
  },

  create: async (data) => {
    const payload = {
      documentTypeId: data.documentTypeId,
      reason: data.reason || '',
      data: data.data || {},
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      totalDays: data.totalDays || null,
    };
    const response = await apiClient.post('/applications', payload);
    return mapToFrontendModel(response.data);
  },

  submit: async (id) => {
    const response = await apiClient.post(`/applications/${id}/submit`);
    return mapToFrontendModel(response.data);
  },

  approve: async (id, comment = '') => {
    const response = await apiClient.post(`/applications/${id}/approve`, { comment });
    return mapToFrontendModel(response.data);
  },

  reject: async (id, reason) => {
    const response = await apiClient.post(`/applications/${id}/reject`, { reason });
    return mapToFrontendModel(response.data);
  },

  supplement: async (id, reason) => {
    const response = await apiClient.post(`/applications/${id}/supplement`, { reason });
    return mapToFrontendModel(response.data);
  },

  addComment: async (id, content) => {
    const response = await apiClient.post(`/applications/${id}/comments`, { content });
    return response.data;
  }
};
