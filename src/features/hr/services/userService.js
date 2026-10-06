import apiClient, { API_URL } from '../../../services/apiClient';
import { readImageDownscaled } from '../../../utils/readImageDownscaled';

/** BE-119: ảnh đại diện nén về tối đa 256px trước khi lưu vào hồ sơ (đủ nét cho avatar, dữ liệu nhỏ). */
const AVATAR_MAX_SIZE = 256;

/**
 * BE-119: ảnh đại diện nay lưu ngay trong hồ sơ dưới dạng **data URL** (giống ảnh phòng ban) nên
 * mở ở máy/địa chỉ nào cũng thấy. Hàm này chỉ còn ghép host cho các ảnh CŨ đang lưu dạng đường dẫn.
 */
export const getFullAvatarUrl = (url) => {
  if (!url || url.includes('ui-avatars.com')) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/')) return API_URL ? `${API_URL}${url}` : url;
  return url;
};

/**
 * BE-97: đổi URL ảnh đại diện về dạng ĐƯỜNG DẪN tương đối trước khi lưu vào hồ sơ.
 * Giá trị hiển thị trong app là URL đầy đủ (có host) nên nếu lưu nguyên vào DB thì ảnh sẽ hỏng
 * khi API đổi địa chỉ (đổi cổng/máy chủ/tên miền).
 *
 * BE-119: data URL (ảnh đã nén, lưu thẳng trong hồ sơ) được giữ nguyên, không cắt host.
 */
export const toApiPath = (url) => {
  if (!url) return url;
  if (url.startsWith('data:')) return url;
  if (API_URL && url.startsWith(API_URL)) return url.slice(API_URL.length);
  return url;
};

const mapToFrontendModel = (u) => {
  const primaryPos = u.positions?.find(p => p.isPrimary) || u.positions?.[0];
  // BE-114: không có chức vụ nào là CHÍNH nghĩa là tài khoản chưa xác định được phòng ban công tác.
  // Nhân sự thường bị chặn đăng nhập; tài khoản ADMIN được miễn trừ nên cần cảnh báo rõ trên UI
  // thay vì im lặng lấy đại chức vụ kiêm nhiệm đầu tiên (gây hiểu nhầm là phòng chính).
  const primaryPosition = u.positions?.find(p => p.isPrimary);
  const hasPrimaryPosition = Boolean(primaryPosition);
  const departmentLabel = primaryPosition?.departmentName
    || (u.positions?.length ? 'Chưa có phòng ban chính' : 'Chưa phân bổ');
  /**
   * BE-119: nhân sự KHÔNG có phòng ban công tác chính thì bị coi là "đang tắt": tài khoản không
   * đăng nhập được (xem AuthService) nên giao diện phải hiển thị đúng như vậy, thay vì vẫn ghi
   * "Đang hoạt động" như trước đây khiến người quản lý tưởng tài khoản còn dùng được.
   *
   * KHÔNG đổi trạng thái trong CSDL (giữ đúng như đã thống nhất: tránh lẫn với người thật sự đã
   * nghỉ việc). Trạng thái thật vẫn được giữ ở `dbStatus` để nút Khoá/Mở khoá hoạt động chính xác.
   */
  const dbStatus = u.status?.toLowerCase() === 'active' ? 'active' : 'inactive';
  const blockedByNoPrimary = !hasPrimaryPosition;
  const secondaryPos = u.positions?.filter(p => !p.isPrimary) || [];
  const rawRole = u.roles?.[0] || 'STAFF';
  const role = typeof rawRole === 'string' ? rawRole.toUpperCase() : 'STAFF';
  const actualAvatar = getFullAvatarUrl(u.avatarUrl);

  return {
    id: u.id,
    shortId: u.id ? u.id.substring(0, 8).toUpperCase() : '',
    name: u.fullName,
    avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`,
    status: blockedByNoPrimary ? 'inactive' : dbStatus,
    // Trạng thái THẬT trong CSDL (khác `status` khi tài khoản bị tắt do thiếu phòng ban chính).
    dbStatus,
    // Tài khoản đang bị coi là tắt vì chưa có phòng ban công tác chính -> giao diện nói rõ lý do.
    blockedByNoPrimary,
    department: departmentLabel,
    departmentId: primaryPos?.departmentId,
    position: primaryPos?.positionName || 'Nhân viên',
    positionId: primaryPos?.positionId,
    allPositions: u.positions || [],
    // BE-114: cờ để giao diện nhắc "Chưa có phòng ban công tác chính".
    hasPrimaryPosition,
    role,
    // roleId resolved on the consumer side (where the roles list is available).
    email: u.email,
    personalEmail: u.personalEmail || '',
    phone: u.phone || '',
    // BE-74: ngày sinh (YYYY-MM-DD) — phân biệt nhân sự trùng họ tên.
    dateOfBirth: u.dateOfBirth || '',
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
      // BE-68: gửi kèm số điện thoại — trước đây bị bỏ quên nên nhập xong là mất.
      phone: data.phone || null,
      // BE-74: ngày sinh để phân biệt nhân sự trùng họ tên.
      dateOfBirth: data.dateOfBirth || null,
      password: data.password || 'Kmart@123',
      // BE-87: gửi kèm trạng thái — trước đây bỏ quên nên chọn "Ngừng hoạt động" vẫn tạo ra tài khoản
      // đang hoạt động.
      status: data.status === 'inactive' ? 'INACTIVE' : 'ACTIVE',
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
      // BE-68: cập nhật được số điện thoại
      phone: data.phone || null,
      // BE-74: ngày sinh — gửi null để xoá được khi người dùng bỏ trống.
      dateOfBirth: data.dateOfBirth || null,
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
      // BE-97: lưu ĐƯỜNG DẪN tương đối trong hồ sơ, không lưu URL đầy đủ kèm host
      // (trước đây lưu "http://localhost:5151/api/..." nên khi đổi máy chủ là ảnh hỏng).
      avatarUrl: toApiPath(data.avatar) || null,
      profileData: data.profileData ? JSON.stringify(data.profileData) : null
    };
    const response = await apiClient.put('/users/profile', payload);
    return mapToFrontendModel(response.data);
  },

  uploadAvatar: async (file) => {
    // BE-119: KHÔNG tải tệp lên ổ đĩa máy chủ nữa (làm ảnh chỉ thấy trên đúng máy chủ đó).
    // Nén ảnh ngay trên trình duyệt rồi trả về data URL để lưu vào hồ sơ — giống hệt cách ảnh
    // phòng ban đang làm, nhờ vậy máy nào mở vào cũng thấy ảnh.
    return new Promise((resolve, reject) => {
      readImageDownscaled(
        file,
        AVATAR_MAX_SIZE,
        (dataUrl) => {
          if (dataUrl) resolve(dataUrl);
          else reject(new Error('Không đọc được file ảnh.'));
        },
        () => reject(new Error('Không đọc được file ảnh.'))
      );
    });
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
  },

  /**
   * AUTH-11/AUTH-10: đổi mật khẩu của CHÍNH mình.
   * Dùng cho màn "đổi mật khẩu bắt buộc" khi tài khoản còn mật khẩu tạm do HR cấp.
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/users/change-password', { currentPassword, newPassword });
    return response.data;
  },

  getActivityLog: async (userId, page = 1, pageSize = 50) => {
    const response = await apiClient.get(`/admin/audit-logs?userId=${userId}&page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  /**
   * BE-114: lịch sử chức vụ / phòng ban công tác.
   *
   * Trả về cả khi phòng ban đã bị xoá — tên phòng ban được lưu snapshot tại thời điểm thay đổi.
   */
  getPositionHistory: async (userId, page = 1, pageSize = 50) => {
    const response = await apiClient.get(`/users/${userId}/position-history?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }
};
