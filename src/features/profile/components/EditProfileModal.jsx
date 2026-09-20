import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const fieldCls = 'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function EditProfileModal({ user, onClose, onSave }) {
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
      newErrors.name = 'Họ và tên không được để trống';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (form.name.trim().length > 50) {
      newErrors.name = 'Họ và tên không được vượt quá 50 ký tự';
    }

    if (form.phone && form.phone.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(form.phone.trim().replace(/\s/g, ''))) {
        newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
      }
    }

    if (form.personalEmail && form.personalEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.personalEmail.trim())) {
        newErrors.personalEmail = 'Email cá nhân không hợp lệ';
      }
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
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Chỉnh sửa thông tin cá nhân</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Cập nhật thông tin liên hệ của bạn</p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-3 pt-4 px-2 mr-6 font-label-md transition-colors border-b-2 ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
          >
            Thông tin cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 pt-4 px-2 font-label-md transition-colors border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
          >
            Hồ sơ năng lực
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-container-lowest/30">
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Ảnh đại diện</label>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant/50 shadow-sm shrink-0 bg-white">
                    <img 
                      src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&background=random&color=fff&size=128`} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-1">
                    <label className="cursor-pointer text-sm font-medium text-primary bg-primary-container/50 hover:bg-primary-container px-4 py-2 rounded-full transition-colors inline-block">
                      Tải ảnh lên
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            setLoading(true);
                            const { userService } = await import('../../hr/services/userService');
                            const url = await userService.uploadAvatar(file);
                            setForm(f => ({ ...f, avatar: url }));
                          } catch (err) {
                            console.error("Upload failed", err);
                            alert("Tải ảnh thất bại: " + (err.response?.data?.error || err.message));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-secondary">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Họ và tên <span className="text-error">*</span></label>
                <input className={`${fieldCls} ${errors.name ? 'border-error focus:border-error focus:ring-error/20' : ''}`} value={form.name} onChange={set('name')} required />
                {errors.name && <span className="text-error text-xs font-medium">{errors.name}</span>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Số điện thoại</label>
                  <input className={`${fieldCls} ${errors.phone ? 'border-error focus:border-error focus:ring-error/20' : ''}`} type="tel" value={form.phone} onChange={set('phone')} />
                  {errors.phone && <span className="text-error text-xs font-medium">{errors.phone}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Email cá nhân</label>
                  <input className={`${fieldCls} ${errors.personalEmail ? 'border-error focus:border-error focus:ring-error/20' : ''}`} type="email" value={form.personalEmail} onChange={set('personalEmail')} />
                  {errors.personalEmail && <span className="text-error text-xs font-medium">{errors.personalEmail}</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Học vấn</label>
                <textarea 
                  className={fieldCls + " h-24 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.education || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), education: e.target.value } }))} 
                  placeholder="Ví dụ:&#10;- Đại học Bách Khoa (2018 - 2022) - Kỹ sư phần mềm&#10;- Chứng chỉ IELTS 7.5" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Kinh nghiệm làm việc</label>
                <textarea 
                  className={fieldCls + " h-28 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.experience || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), experience: e.target.value } }))} 
                  placeholder="Ví dụ:&#10;- Công ty XYZ (2022 - Nay) - Frontend Developer&#10;  + Phát triển UI/UX cho ứng dụng web&#10;  + Tối ưu hóa hiệu suất React" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Giải thưởng & Thành tích</label>
                <textarea 
                  className={fieldCls + " h-24 py-2.5 resize-none leading-relaxed"} 
                  value={form.profileData?.awards || ''} 
                  onChange={(e) => setForm(f => ({ ...f, profileData: { ...(f.profileData || {}), awards: e.target.value } }))} 
                  placeholder="Ví dụ:&#10;- Nhân viên xuất sắc năm 2023&#10;- Giải nhất Hackathon ABC" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end items-center gap-3 rounded-b-lg shrink-0">
          <button type="button" onClick={onClose} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer">
            Hủy bỏ
          </button>
          <button type="submit" disabled={loading} className="font-label-md text-on-primary bg-primary px-6 py-2 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
