import apiClient, { API_URL } from '../../../services/apiClient';

const mapToFrontendModel = (d) => ({
  id: d.id,
  name: d.name,
  code: d.code,
  type: d.type || 'Phòng ban',
  status: d.isActive ? 'Active' : 'Inactive',
  leaders: [
    ...(d.managerName ? [{ title: d.type === 'Siêu thị / Chi nhánh' ? 'Cửa hàng trưởng' : 'Trưởng phòng', name: d.managerName }] : []),
    ...(d.deputyManagerName ? [{ title: 'Phó phòng', name: d.deputyManagerName }] : []),
  ],
  managerId: d.managerId || null,
  managerName: d.managerName || null,
  deputyManagerId: d.deputyManagerId || null,
  deputyManagerName: d.deputyManagerName || null,
  members: d.memberAvatars || [],
  memberNames: d.memberNames || [],
  memberCount: d.memberCount || 0,
  extraCount: d.memberCount > 5 ? d.memberCount - 5 : 0,
  icon: d.icon || 'campaign',
  iconImage: d.iconImage || null,
  createdAt: new Date(d.createdAt).toLocaleDateString('vi-VN'),
  staff: []
});

const getFullAvatarUrl = (url) => {
  if (!url || url.includes('ui-avatars.com')) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

const mapMemberToFrontend = (u, targetDeptId = null) => {
  let targetPos = null;
  if (targetDeptId) {
    targetPos = u.positions?.find(p => p.departmentId === targetDeptId);
  }
  const primaryPos = targetPos || u.positions?.find(p => p.isPrimary) || u.positions?.[0];
  const actualAvatar = getFullAvatarUrl(u.avatarUrl);
  return {
    id: u.id,
    shortId: u.id ? u.id.substring(0, 8).toUpperCase() : '',
    name: u.fullName,
    avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`,
    role: primaryPos?.positionName || 'Nhân viên',
    departmentName: primaryPos?.departmentName || '',
    email: u.email,
    personalEmail: u.personalEmail,
    phone: u.phone || '',
    status: u.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    positions: u.positions || [],
    systemRoles: u.roles || []
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
      deputyManagerId: data.deputy?.id || null,
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
    // Phó phòng: gửi null để xoá khi caller chủ động bỏ chọn
    if (data.deputy !== undefined) {
      payload.deputyManagerId = data.deputy ? data.deputy.id : null;
    } else if (data.deputyManagerId !== undefined) {
      payload.deputyManagerId = data.deputyManagerId;
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

  // BE-03: lấy quản lý của NHIỀU phòng ban trong 1 lần gọi.
  // GET /api/departments/managers?departmentIds=id1,id2
  // Trả về [{ departmentId, departmentName, managerId, managerName, managerEmail }]
  // (phòng ban chưa có quản lý vẫn có trong kết quả với managerId = null).
  getManagers: async (departmentIds) => {
    const ids = (departmentIds || []).filter(Boolean);
    if (ids.length === 0) return [];
    const response = await apiClient.get('/departments/managers', {
      params: { departmentIds: ids.join(',') },
    });
    return response.data || [];
  },

  getMembers: async (id) => {
    const response = await apiClient.get(`/departments/${id}/members`);
    return response.data.map(u => mapMemberToFrontend(u, id));
  }
};
