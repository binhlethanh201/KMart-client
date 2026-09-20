import React, { useMemo, useState } from 'react';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import EditProfileModal from './../components/EditProfileModal';
import { userService } from '../../hr/services/userService';

export default function UserProfile({ userId, onClose }) {
  const { currentUser, pushToast } = useApproval();
  const { employees, getEmployee } = useHr();
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Decide which user to display
  const user = useMemo(() => {
    if (userId) {
      return getEmployee(userId);
    }
    return currentUser;
  }, [userId, getEmployee, currentUser]);

  const sections = [
    { 
      id: 'group', 
      title: 'Nhóm (Đơn vị nghiệp vụ)', 
      icon: 'group_off', 
      value: user?.allPositions && user.allPositions.length > 0
        ? <div className="flex flex-col gap-3 w-full max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {[...user.allPositions].sort((a, b) => b.isPrimary - a.isPrimary).map((pos, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${pos.isPrimary ? 'border-primary/20 bg-primary/5' : 'border-outline-variant/50 bg-surface-container-lowest'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pos.isPrimary ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-secondary'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {pos.isPrimary ? 'stars' : 'work'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-on-surface truncate">{pos.departmentName || 'Chưa phân bổ'}</span>
                    <span className="text-secondary text-sm truncate">{pos.positionName || 'Nhân viên'}</span>
                  </div>
                </div>
                {pos.isPrimary ? (
                  <span className="px-3 py-1 text-[11px] font-medium bg-primary text-white rounded-full shadow-sm flex-shrink-0">Chính</span>
                ) : (
                  <span className="px-3 py-1 text-[11px] font-medium bg-surface-variant text-on-surface-variant rounded-full flex-shrink-0">Kiêm nhiệm</span>
                )}
              </div>
            ))}
          </div>
        : (user?.department !== 'Chưa phân bổ' ? `${user?.department} - ${user?.position}` : null)
    },
    { id: 'education', title: 'Học vấn', icon: 'school', value: user?.profileData?.education },
    { id: 'experience', title: 'Kinh nghiệm làm việc', icon: 'work_history', value: user?.profileData?.experience },
    { id: 'awards', title: 'Giải thưởng & Thành tích', icon: 'emoji_events', value: user?.profileData?.awards },
  ];

  const handleSaveProfile = async (updatedData) => {
    try {
      await userService.updateProfile(updatedData);
      pushToast('Cập nhật thông tin cá nhân thành công!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      pushToast(err.response?.data?.error || 'Có lỗi xảy ra khi lưu', 'error');
      throw err;
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface w-full h-full">
        <div className="text-secondary flex flex-col items-center">
          <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">person_off</span>
          <p>Không tìm thấy thông tin người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface flex flex-col relative z-10 w-full h-full">
      {/* Header / Breadcrumbs */}
      <header className="h-[56px] bg-white border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
        <div className="flex items-center text-on-surface-variant font-body-sm flex-wrap">
          <span className="uppercase tracking-wider font-semibold text-xs text-secondary hidden sm:inline">Tài khoản</span>
          <span className="material-symbols-outlined text-[16px] mx-1 sm:mx-2 text-outline hidden sm:inline">chevron_right</span>
          <span className="font-medium text-on-surface">{user.name}</span>
          <span className="mx-1 sm:mx-2 text-outline-variant">•</span>
          <span className="text-secondary">{user.role || user.position || 'Nhân viên'}</span>
        </div>
        <div className="flex items-center gap-3">
          {(!userId || userId === currentUser.id) && (
            <button 
              onClick={() => setShowEditModal(true)}
              className="text-white px-3 sm:px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 bg-[#2563eb] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-full p-1 flex items-center justify-center transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </header>

      {/* Content Canvas */}
      <div className="w-full flex flex-col gap-6 p-4 sm:p-6 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded border border-outline-variant flex flex-col sm:flex-row items-start relative p-4 gap-4 sm:gap-6 shadow-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-surface-variant">
            <img 
              alt="Avatar" 
              className="w-full h-full object-cover" 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=128`} 
            />
          </div>
          <div className="flex-1 pt-1 sm:pt-2">
            <h1 className="font-display-sm text-on-surface mb-1">{user.name}</h1>
            <p className="font-body-md text-secondary mb-4 sm:mb-6">{user.role || user.position || 'Nhân viên'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                <span className="text-on-surface break-all">{user.personalEmail || user.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">call</span>
                <span className="text-on-surface">{user.phone || <span className="text-secondary italic">Chưa cập nhật số điện thoại</span>}</span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <span className="material-symbols-outlined text-outline text-[20px]">location_on</span>
                <span className="text-secondary italic">Chưa cập nhật địa chỉ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded border border-outline-variant flex flex-col shadow-sm">
              <div className="px-4 sm:px-5 border-b border-slate-100 flex justify-between items-center bg-surface-bright rounded-t py-2.5">
                <h2 className="font-label-md text-secondary uppercase">{section.title}</h2>
                {(!userId || userId === currentUser.id) && section.id !== 'group' && (
                  <button onClick={() => setShowEditModal(true)} className="text-outline hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                )}
              </div>
              <div className={`flex flex-col p-4 sm:p-6 bg-white rounded-b min-h-[7rem] ${section.value ? 'justify-start items-start' : 'items-center justify-center text-center'}`}>
                {section.value ? (
                  <div className="text-on-surface font-body-sm whitespace-pre-wrap w-full">{section.value}</div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-outline-variant text-3xl sm:text-4xl mb-2">
                      {section.icon}
                    </span>
                    <p className="text-secondary font-body-sm">Không có thông tin</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
