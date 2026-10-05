import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { userService, getFullAvatarUrl } from '../../hr/services/userService';

const fieldCls = 'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

/**
 * BE-97: kiểm tra ảnh đại diện NGAY TRÊN FORM trước khi gửi lên máy chủ.
 * Trước đây chọn tệp nào cũng gửi (chỉ chặn ở máy chủ) nên người dùng chỉ nhận một `alert`
 * khó hiểu; tệp > 5MB còn bị máy chủ trả 413 và không rõ lý do.
 */
const AVATAR_EXT = ['.jpg', '.jpeg', '.png'];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
function validateAvatarFile(file, t) {
  const name = String(file?.name || '');
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  if (!AVATAR_EXT.includes(ext)) {
    return t('Chỉ nhận ảnh {v0}.', { v0: AVATAR_EXT.join(', ') });
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return t('Ảnh vượt quá {v0}MB.', { v0: AVATAR_MAX_BYTES / (1024 * 1024) });
  }
  return null;
}

export default function EditProfileModal({ user, onClose, onSave }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    personalEmail: '',
    avatar: '',
    profileData: {}
  });
  const [activeTab, setActiveTab] = useState('basic'); // basic | profile
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        personalEmail: user.personalEmail || '',
        avatar: user.avatar || '',
        profileData: user.profileData || {}
      });
      setErrors({});
    }
  }, [user]);

  // Handle escape key
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || !form.name.trim()) {
      newErrors.name = t('Họ và tên không được để trống');
    } else if (form.name.trim().length < 2) {
      newErrors.name = t('Họ và tên phải có ít nhất 2 ký tự');
    } else if (form.name.trim().length > 50) {
      newErrors.name = t('Họ và tên không được vượt quá 50 ký tự');
    }

    if (form.phone && form.phone.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(form.phone.trim().replace(/\s/g, ''))) {
        newErrors.phone = t('Số điện thoại không hợp lệ (VD: 0912345678)');
      }
    }

    if (form.personalEmail && form.personalEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.personalEmail.trim())) {
        newErrors.personalEmail = t('Email cá nhân không hợp lệ');
      }
    }

    // BE-137: chặn địa chỉ quá dài làm vỡ bố cục trang cá nhân / báo cáo.
    const address = String(form.profileData?.address || '').trim();
    if (address.length > 200) {
      newErrors.address = t('Địa chỉ không được vượt quá 200 ký tự');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('basic'); // switch back to basic tab to show errors
      return;
    }
    
    setLoading(true);
    try {
      await onSave({ ...user, ...form });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('Chỉnh sửa thông tin cá nhân')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{t('Cập nhật thông tin liên hệ của bạn')}</p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs — BE-137: cuộn ngang trên màn hẹp để không mất tab */}
        <div className="flex overflow-x-auto border-b border-outline-variant/30 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-3 pt-4 px-2 mr-6 font-label-md transition-colors border-b-2 whitespace-nowrap ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
          >
            {t('Thông tin cơ bản')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 pt-4 px-2 font-label-md transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
          >
            {t('Hồ sơ năng lực')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-container-lowest/30">
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Ảnh đại diện')}</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant/50 shadow-sm shrink-0 bg-white">
                    <img 
                      src={getFullAvatarUrl(form.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&background=random&color=fff&size=128`} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&background=random&color=fff&size=128`; }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-1">
                    <label className={`cursor-pointer text-sm font-medium text-primary bg-primary-container/50 hover:bg-primary-container px-4 py-2 rounded-full transition-colors inline-block ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                      {loading ? t('Đang tải ảnh...') : t('Tải ảnh lên')}
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';   // chọn lại CÙNG một tệp vẫn phải kích hoạt onChange
                          if (!file) return;

                          const invalid = validateAvatarFile(file, t);
                          if (invalid) {
                            setErrors((prev) => ({ ...prev, avatar: invalid }));
                            return;
                          }

                          try {
                            setErrors((prev) => ({ ...prev, avatar: null }));
                            setLoading(true);
                            // BE-119: nén ảnh ngay trên trình duyệt rồi lưu data URL vào hồ sơ —
                            // giống hệt cách ảnh phòng ban đang làm. Trước đây tải tệp lên ổ đĩa máy
                            // chủ nên chỉ máy chủ đó thấy ảnh, mở ở nơi khác là hỏng.
                            const dataUrl = await userService.uploadAvatar(file);
                            setForm(f => ({ ...f, avatar: dataUrl }));
                          } catch (err) {
                            console.error('Đọc ảnh đại diện thất bại', err);
                            setErrors((prev) => ({
                              ...prev,
                              avatar: t(err.response?.data?.error || err.message || 'Tải ảnh thất bại'),
                            }));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-secondary">{t('Hỗ trợ JPG, PNG (Tối đa 5MB)')}</p>
                    {errors.avatar && (
                      <p className="text-xs text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.avatar}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Họ và tên')} <span className="text-error">*</span></label>
                <input className={`${fieldCls} ${errors.name ? 'border-error focus:border-error focus:ring-error/20' : ''}`} value={form.name} onChange={set('name')} required />
                {errors.name && <span className="text-error text-xs font-medium">{errors.name}</span>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>{t('Số điện thoại')}</label>
                  <input className={`${fieldCls} ${errors.phone ? 'border-error focus:border-error focus:ring-error/20' : ''}`} type="tel" value={form.phone} onChange={set('phone')} />
                  {errors.phone && <span className="text-error text-xs font-medium">{errors.phone}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>{t('Email cá nhân')}</label>
                  <input className={`${fieldCls} ${errors.personalEmail ? 'border-error focus:border-error focus:ring-error/20' : ''}`} type="email" value={form.personalEmail} onChange={set('personalEmail')} />
                  {errors.personalEmail && <span className="text-error text-xs font-medium">{errors.personalEmail}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Địa chỉ')}</label>
                <input 
                  className={`${fieldCls} min-w-0 ${errors.address ? 'border-error focus:border-error focus:ring-error/20' : ''}`} 
                  maxLength={200}
                  value={form.profileData?.address || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), address: e.target.value } }))} 
                  placeholder={t('Nhập địa chỉ hiện tại...')} 
                />
                {errors.address && <span className="text-error text-xs font-medium">{errors.address}</span>}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Học vấn')}</label>
                <textarea 
                  className={fieldCls + " h-24 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.education || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), education: e.target.value } }))} 
                  placeholder={t('Ví dụ:\n- Đại học Bách Khoa (2018 - 2022) - Kỹ sư phần mềm\n- Chứng chỉ IELTS 7.5')} 
                  maxLength={1000}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Kinh nghiệm làm việc')}</label>
                <textarea 
                  className={fieldCls + " h-28 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.experience || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), experience: e.target.value } }))} 
                  placeholder={t('Ví dụ:\n- Công ty XYZ (2022 - Nay) - Frontend Developer\n  + Phát triển UI/UX cho ứng dụng web\n  + Tối ưu hóa hiệu suất React')} 
                  maxLength={1000}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t('Giải thưởng & Thành tích')}</label>
                <textarea 
                  className={fieldCls + " h-24 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.awards || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), awards: e.target.value } }))} 
                  placeholder={t('Ví dụ:\n- Nhân viên xuất sắc năm 2023\n- Giải nhất Hackathon ABC')} 
                  maxLength={1000}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-outline-variant/30 bg-surface flex flex-wrap justify-end items-center gap-2 sm:gap-3 rounded-b-lg shrink-0">
          <button type="button" onClick={onClose} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer">
            {t('Hủy bỏ')}
          </button>
          <button type="submit" disabled={loading} className="font-label-md text-on-primary bg-primary px-6 py-2 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer disabled:opacity-50">
            {loading ? t('Đang lưu...') : t('Lưu thay đổi')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
