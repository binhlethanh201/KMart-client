import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useI18n, translate } from '../i18n/I18nProvider';

// BE-22: chuông thông báo. Backend đã ghi thông báo (ApplicationService/NotificationService)
// nhưng FE chưa hiển thị. Component này lấy danh sách + số chưa đọc, cho phép đọc và điều hướng.
const TYPE_META = {
  ApplicationSubmitted: { icon: 'upload_file', color: 'text-primary', bg: 'bg-primary/10' },
  ApplicationApproved: { icon: 'task_alt', color: 'text-success', bg: 'bg-success/10' },
  ApplicationRejected: { icon: 'block', color: 'text-error', bg: 'bg-error/10' },
  ApprovalPending: { icon: 'pending_actions', color: 'text-warning', bg: 'bg-warning/10' },
  Reminder: { icon: 'alarm', color: 'text-warning', bg: 'bg-warning/10' },
  SystemAnnouncement: { icon: 'campaign', color: 'text-secondary', bg: 'bg-surface-container' },
  ReturnTimeout: { icon: 'history_toggle_off', color: 'text-error', bg: 'bg-error/10' },
  ApplicationStepAdvanced: { icon: 'moving', color: 'text-primary', bg: 'bg-primary/10' },
  TimeoutAlert: { icon: 'schedule', color: 'text-error', bg: 'bg-error/10' },
  CommentAdded: { icon: 'forum', color: 'text-secondary', bg: 'bg-surface-container' },
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return translate('Vừa xong');
  if (diff < 3600) return translate('{v0} phút trước', { v0: Math.floor(diff / 60) });
  if (diff < 86400) return translate('{v0} giờ trước', { v0: Math.floor(diff / 3600) });
  if (diff < 604800) return translate('{v0} ngày trước', { v0: Math.floor(diff / 86400) });
  return d.toLocaleDateString('vi-VN');
};

export default function NotificationBell({ variant = 'sidebar' }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationService.getAll(1, 20),
        notificationService.getUnreadCount(),
      ]);
      setItems(list || []);
      setUnread(count || 0);
    } catch {
      /* im lặng - không chặn UI */
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải ban đầu + tự cập nhật mỗi 60s
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleOpenItem = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n.id);
        setItems((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    setOpen(false);
    // BE-22: điều hướng tới đúng đơn. Backend có thể lưu referenceType='Application'
    // hoặc link dạng "/applications/{id}" (route FE là "/requests/{id}").
    if (n.referenceId && (n.referenceType === 'Application' || (n.link || '').includes('/applications/'))) {
      navigate(`/requests/${n.referenceId}`);
    } else if (n.link) {
      navigate(n.link.startsWith('/applications/') ? n.link.replace('/applications/', '/requests/') : n.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((l) => l.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-colors cursor-pointer ${
          variant === 'header'
            ? 'text-on-surface-variant hover:bg-surface-container-high'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
        aria-label={t('Thông báo')}
      >
        <span className="material-symbols-outlined text-[16px]">notifications</span>
        {unread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[13px] h-[13px] px-0.5 rounded-full bg-error text-white text-[8px] font-bold flex items-center justify-center leading-none ring-2 ${variant === 'header' ? 'ring-surface' : 'ring-[#0F172A]'}`}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-[360px] bg-surface border border-outline-variant/70 rounded-2xl shadow-2xl overflow-hidden z-[130] flex flex-col ${
            variant === 'header' ? 'right-0' : 'left-0'
          }`}
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/50 bg-surface-container-lowest/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
              <span className="text-sm font-bold text-on-surface">{t('Thông báo')}</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">{unread} {t('mới')}</span>
              )}
            </div>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAll} className="text-xs text-primary hover:underline cursor-pointer font-medium">
                {t('Đọc tất cả')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="text-sm text-secondary text-center py-6">{t('Đang tải...')}</p>
            )}
            {!loading && items.length === 0 && (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-[32px] text-outline block mb-1">notifications_off</span>
                <p className="text-sm text-secondary">{t('Không có thông báo nào')}</p>
              </div>
            )}
            {items.map((n) => {
              const meta = TYPE_META[n.type] || { icon: 'info', color: 'text-secondary', bg: 'bg-surface-container' };
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpenItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors flex gap-3 cursor-pointer group ${n.isRead ? '' : 'bg-primary/[0.035]'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <span className={`material-symbols-outlined text-[18px] ${meta.color}`}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[13px] leading-snug line-clamp-1 ${n.isRead ? 'font-medium text-on-surface-variant' : 'font-semibold text-on-surface'}`}>{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-secondary mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="material-symbols-outlined text-[12px] text-outline">schedule</span>
                      <span className="text-[10px] text-outline font-medium">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  {(n.referenceType === 'Application' && n.referenceId) && (
                    <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0">chevron_right</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}