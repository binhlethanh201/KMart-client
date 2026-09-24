import apiClient from '../../../services/apiClient';

const mapToFrontendModel = (d) => ({
  id: d.id,
  name: d.name,
  code: d.code,
  type: d.type || 'Phòng ban',
  status: d.isActive ? 'Active' : 'Inactive',
  leaders: d.managerName ? [{ title: 'Trưởng phòng', name: d.managerName }] : [],
  managerId: d.managerId || null,
  members: d.memberAvatars || [],
  memberNames: d.memberNames || [],
  memberCount: d.memberCount || 0,
  extraCount: d.memberCount > 5 ? d.memberCount - 5 : 0,
  icon: d.icon || 'campaign',
  iconImage: d.iconImage || null,
  createdAt: new Date(d.createdAt).toLocaleDateString('vi-VN'),
  staff: []
});

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';
const getFullAvatarUrl = (url) => {
  if (!url || url.includes('ui-avatars.com')) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

const mapMemberToFrontend = (u) => {
  const primaryPos = u.positions?.find(p => p.isPrimary) || u.positions?.[0];
  const actualAvatar = getFullAvatarUrl(u.avatarUrl);
  return {
    id: u.id,
    shortId: u.id ? u.id.substring(0, 8).toUpperCase() : '',
    name: u.fullName,
    avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`,
    role: primaryPos?.positionName || 'Nhân viên',
    email: u.email,
    personalEmail: u.personalEmail,
    status: u.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
  };
};

export const departmentService = {
  getAll: async () => {
    const response = await apiClient.get('/departments');
    return response.data.map(mapToFrontendModel);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/departments/${id}`);
    return mapToFrontendModel(response.data);
  },

  create: async (data) => {
    const payload = {
      name: data.name,
      code: data.code,
      type: data.type,
      managerId: data.head?.id || null,
      icon: data.icon || null,
      iconImage: data.iconImage || null,
      members: data.members?.map(m => ({
        userId: m.employee.id,
        isPrimary: m.assignment === 'primary'
      })) || []
    };

    // Also include head or deputy if they are not in the members list
    if (data.head && !payload.members.some(m => m.userId === data.head.id)) {
      payload.members.push({ userId: data.head.id, isPrimary: true });
    }
    if (data.deputy && !payload.members.some(m => m.userId === data.deputy.id)) {
      payload.members.push({ userId: data.deputy.id, isPrimary: false });
    }

    const response = await apiClient.post('/departments', payload);
    return mapToFrontendModel(response.data);
  },

  update: async (id, data) => {
    const payload = {
      name: data.name,
      code: data.code,
      type: data.type,
      icon: data.icon || null,
      iconImage: data.iconImage === undefined ? null : data.iconImage
    };
    // Chỉ gửi managerId khi caller có ý định set (có head hoặc managerId rõ ràng).
    // Nếu không có, backend sẽ giữ nguyên trưởng phòng hiện tại.
    if (data.head !== undefined) {
      payload.managerId = data.head ? data.head.id : null;
    } else if (data.managerId !== undefined) {
      payload.managerId = data.managerId;
    }
    const response = await apiClient.put(`/departments/${id}`, payload);
    return mapToFrontendModel(response.data);
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await apiClient.put(`/departments/${id}/toggle-status`);
    return response.data;
  },

  getMembers: async (id) => {
    const response = await apiClient.get(`/departments/${id}/members`);
    return response.data.map(mapMemberToFrontend);
  }
};
