import React, { useMemo, useState } from 'react';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import EditProfileModal from './../components/EditProfileModal';
import { userService } from '../../hr/services/userService';
import apiClient from '../../../services/apiClient';
import { roleLabel } from '../../../utils/roleLabels';
import { useI18n } from '../../../i18n/I18nProvider';
import describeApiError from '../../../utils/apiError';
import { PAGE_TITLE_CLS } from '../../../components/PageHeader';

export default function UserProfile({ userId, onClose }) {
  const { t } = useI18n();
  const { currentUser, pushToast } = useApproval();
  const { getEmployee } = useHr();
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
      title: t('Nhóm (Đơn vị nghiệp vụ)'), 
      icon: 'group_off', 
      value: user?.allPositions && user.allPositions.length > 0
        ? <div className="flex flex-col gap-3 w-full max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {[...user.allPositions].sort((a, b) => b.isPrimary - a.isPrimary).map((pos, idx) => (
              <div key={idx} className={`flex items-center justify-between gap-2 p-3 rounded-lg border min-w-0 ${pos.isPrimary ? 'border-primary/20 bg-primary/5' : 'border-outline-variant/50 bg-surface-container-lowest'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pos.isPrimary ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-secondary'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {pos.isPrimary ? 'stars' : 'work'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-on-surface break-words">{t(pos.departmentName) || t('Chưa phân bổ')}</span>
                    <span className="text-secondary text-sm break-words">{t(pos.positionName) || t('Nhân viên')}</span>
                  </div>
                </div>
                {pos.isPrimary ? (
                  <span className="px-3 py-1 text-[11px] font-medium bg-primary text-white rounded-full shadow-sm flex-shrink-0">{t('Chính')}</span>
                ) : (
                  <span className="px-3 py-1 text-[11px] font-medium bg-surface-variant text-on-surface-variant rounded-full flex-shrink-0">{t('Kiêm nhiệm')}</span>
                )}
              </div>
            ))}
          </div>
        : (user?.department !== 'Chưa phân bổ' ? `${user?.department} - ${user?.position}` : null)    },
    { id: 'education', title: t('Học vấn'), icon: 'school', value: user?.profileData?.education },
    { id: 'experience', title: t('Kinh nghiệm làm việc'), icon: 'work_history', value: user?.profileData?.experience },
    { id: 'awards', title: t('Giải thưởng & Thành tích'), icon: 'emoji_events', value: user?.profileData?.awards },
  ];

  const handleConnectTelegram = async () => {
    const w = window.open('', '_blank');
    try {
      const res = await apiClient.get('/telegram/connect-link');
      if (res.data && res.data.url) {
        w.location.href = res.data.url;
        pushToast(t('Đã mở Telegram — bấm Start để hoàn tất kết nối.'), 'success');
      } else {
        w.close();
        pushToast(t('Không lấy được link kết nối'), 'error');
      }
    } catch (error) {
      w.close();
      pushToast(describeApiError(error, t, 'Lỗi kết nối Telegram'), 'error');
    }
  };

  const handleSaveProfile = async (updatedData) => {
    try {
      await userService.updateProfile(updatedData);
      pushToast(t('Cập nhật thông tin cá nhân thành công!'), 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      pushToast(describeApiError(err, t, 'Có lỗi xảy ra khi lưu'), 'error');
      throw err;
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background w-full h-full">
        <div className="text-secondary flex flex-col items-center">
          <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">person_off</span>
          <p>{t('Không tìm thấy thông tin người dùng')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background flex flex-col relative z-10 w-full h-full">
      {/* Header / Breadcrumbs — BE-97: nền ấm cho đồng tông với các trang khác */}
      <header className="min-h-[56px] bg-[#f6f6f4] border-b border-outline-variant flex items-center justify-between gap-2 px-4 sm:px-6 py-2 sticky top-0 z-20">
        <div className="flex items-center text-on-surface-variant font-body-sm flex-wrap min-w-0">
          <span className="uppercase tracking-wider font-semibold text-xs text-secondary hidden sm:inline">{t('Tài khoản')}</span>
          <span className="material-symbols-outlined text-[16px] mx-1 sm:mx-2 text-outline hidden sm:inline">chevron_right</span>
          <span className="font-medium text-on-surface break-words min-w-0" title={user.name}>{user.name}</span>
          <span className="mx-1 sm:mx-2 text-outline-variant">•</span>
          <span className="text-secondary truncate">{roleLabel(user.role)}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {(!userId || userId === currentUser.id) && (
            <button 
              onClick={() => setShowEditModal(true)}
              className="text-white px-3 sm:px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 bg-[#2563eb] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="hidden sm:inline">{t('Chỉnh sửa')}</span>
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
          <div className="flex-1 min-w-0 pt-1 sm:pt-2">
            <h1 className={`${PAGE_TITLE_CLS} mb-1 break-words`}>{user.name}</h1>
            <p className="font-body-md text-secondary mb-4 sm:mb-6">{roleLabel(user.role)}</p>
            {/* BE-137: lưới tự chia cột theo không gian thật (không cố định 1/2 cột theo breakpoint) */}
            <div className="grid gap-y-3 sm:gap-y-4 gap-x-4 text-sm grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                <span className="text-on-surface break-all">{user.personalEmail || user.email || t('Chưa cập nhật')}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-outline text-[20px] shrink-0">call</span>
                <span className="text-on-surface min-w-0 break-words">{user.phone || <span className="text-secondary italic">{t('Chưa cập nhật số điện thoại')}</span>}</span>
              </div>
              {(!userId || userId === currentUser.id) && (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-outline text-[20px] shrink-0">send</span>
                  {user.telegramChatId ? (
                    <span className="flex items-center gap-1 text-success text-sm font-medium">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      {t('Đã kết nối Telegram')}
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectTelegram}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2481cc] text-white hover:bg-[#1d6ba8] transition-colors rounded text-sm font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      {t('Kết nối Telegram')}
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 sm:col-span-2 min-w-0">
                <span className="material-symbols-outlined text-outline text-[20px] shrink-0">location_on</span>
                <span className="text-on-surface min-w-0 break-words">{user.profileData?.address || <span className="text-secondary italic">{t('Chưa cập nhật địa chỉ')}</span>}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections Grid — BE-137: auto-fit để số cột tự theo chiều rộng container */}
        <div className="grid gap-4 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]">
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
                    <p className="text-secondary font-body-sm">{t('Không có thông tin')}</p>
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
