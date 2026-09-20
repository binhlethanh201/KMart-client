import apiClient from '../../../services/apiClient';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

export const getFullAvatarUrl = (url) => {
  if (!url || url.includes('ui-avatars.com')) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

const mapToFrontendModel = (u) => {
  const primaryPos = u.positions?.find(p => p.isPrimary) || u.positions?.[0];
  const secondaryPos = u.positions?.filter(p => !p.isPrimary) || [];
  const rawRole = u.roles?.[0] || 'STAFF';
  const role = typeof rawRole === 'string' ? rawRole.toUpperCase() : 'STAFF';
  const actualAvatar = getFullAvatarUrl(u.avatarUrl);

  return {
    id: u.id,
    shortId: u.id ? u.id.substring(0, 8).toUpperCase() : '',
    name: u.fullName,
    avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`,
    status: u.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    department: primaryPos?.departmentName || 'Chưa phân bổ',
    departmentId: primaryPos?.departmentId,
    position: primaryPos?.positionName || 'Nhân viên',
    positionId: primaryPos?.positionId,
    allPositions: u.positions || [],
    role,
    // roleId resolved on the consumer side (where the roles list is available).
    email: u.email,
    personalEmail: u.personalEmail || '',
    phone: u.phone || '',
    profileData: u.profileData ? JSON.parse(u.profileData) : null,
    createdAt: u.createdAt,
    secondary: secondaryPos.map(p => ({
      departmentId: p.departmentId,
      department: p.departmentName,
      positionId: p.positionId,
      position: p.positionName
    }))
  };
};

export const userService = {
  getAll: async (page = 1, pageSize = 100) => {
    const response = await apiClient.get(`/users?page=${page}&pageSize=${pageSize}`);
    // Backend returns PagedResult with Items array
    return response.data.items.map(mapToFrontendModel);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return mapToFrontendModel(response.data);
  },

  create: async (data) => {
    const positions = [];
    if (data.departmentId && data.positionId) {
      positions.push({
        departmentId: data.departmentId,
        positionId: data.positionId,
        isPrimary: true
      });
    }
    if (data.secondary) {
      data.secondary.forEach(s => {
        if (s.departmentId && s.positionId) {
          positions.push({
            departmentId: s.departmentId,
            positionId: s.positionId,
            isPrimary: false
          });
        }
      });
    }

    const payload = {
      email: data.email,
      personalEmail: data.personalEmail || null,
      fullName: data.name,
      password: data.password || 'Kmart@123',
      positions,
      roleIds: data.roleIds || []
    };
    const response = await apiClient.post('/users', payload);
    return mapToFrontendModel(response.data);
  },

  update: async (id, data) => {
    const positions = [];
    if (data.departmentId && data.positionId) {
      positions.push({
        departmentId: data.departmentId,
        positionId: data.positionId,
        isPrimary: true
      });
    }
    if (data.secondary) {
      data.secondary.forEach(s => {
        if (s.departmentId && s.positionId) {
          positions.push({
            departmentId: s.departmentId,
            positionId: s.positionId,
            isPrimary: false
          });
        }
      });
    }

    const payload = {
      fullName: data.name,
      personalEmail: data.personalEmail || null,
      positions,
      roleIds: data.roleIds || []
    };
    const response = await apiClient.put(`/users/${id}`, payload);
    return mapToFrontendModel(response.data);
  },

  updateProfile: async (data) => {
    const payload = {
      fullName: data.name,
      personalEmail: data.personalEmail || null,
      phone: data.phone || null,
      avatarUrl: data.avatar || null,
      profileData: data.profileData ? JSON.stringify(data.profileData) : null
    };
    const response = await apiClient.put('/users/profile', payload);
    return mapToFrontendModel(response.data);
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.put('/users/avatar', formData, {
      headers: { 'Content-Type': undefined }
    });
    return getFullAvatarUrl(response.data.avatarUrl);
  },

  delete: async (id) => {
    await apiClient.delete(`/users/${id}`);
  },

  toggleLock: async (id, currentStatus) => {
    const endpoint = currentStatus === 'active' ? `/users/${id}/lock` : `/users/${id}/unlock`;
    const response = await apiClient.put(endpoint);
    return response.data;
  },

  resetPassword: async (id) => {
    const response = await apiClient.post(`/users/${id}/reset-password`, { sendEmail: false });
    return response.data.tempPassword;
  }
};
