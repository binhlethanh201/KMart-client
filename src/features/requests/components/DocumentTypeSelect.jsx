import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-96: chọn "loại đề xuất" ở màn Tạo đề xuất.
 *
 * Trước đây là ô tìm kiếm RỜI + `<select>` gốc của trình duyệt: thanh tìm kiếm nằm ngoài dropdown
 * nên nhìn như hai trường riêng, còn dropdown gốc không hiển thị được nhóm/danh mục cho gọn.
 * Nay: một dropdown tự dựng giống màn "Cấu hình luồng duyệt" (gom theo danh mục, thu gọn được)
 * nhưng KHÔNG hiển thị chú thích "đã cấu hình ở khối nào", và có ô tìm kiếm NGAY TRONG dropdown.
 *
 * Panel được render qua portal + `position: fixed` để không bị khung cuộn của form cắt mất.
 */
const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

export default function DocumentTypeSelect({ documentTypes = [], value, onChange, disabled = false, loading = false }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const groups = useMemo(() => {
    // Tìm theo TỪNG TỪ (không cần đúng thứ tự, không cần đủ từ): "don nghi" khớp "Đơn xin nghỉ phép".
    const tokens = normalize(search).split(/\s+/).filter(Boolean);
    const matched = tokens.length === 0
      ? documentTypes
      : documentTypes.filter((dt) => {
          const haystack = `${normalize(dt.name)} ${normalize(dt.code)}`;
          return tokens.every((tk) => haystack.includes(tk));
        });

    const byCategory = new Map();
    matched.forEach((dt) => {
      const category = (dt.category && String(dt.category).trim()) || t('Khác');
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(dt);
    });
    return [...byCategory.entries()];
  }, [documentTypes, search, t]);

  const matchCount = groups.reduce((n, [, items]) => n + items.length, 0);
  const selected = documentTypes.find((d) => d.id === value) || null;

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(r.width, 420);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 260 && r.top > spaceBelow;
    setRect({
      left: Math.min(r.left, window.innerWidth - width - 8),
      width,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.min(320, (openUp ? r.top : spaceBelow) - 20),
    });
  };

  useEffect(() => {
    if (!open) return;
    place();
    inputRef.current?.focus();

    const onDocDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // Đóng dropdown trước, không để phím Esc đóng luôn cả form tạo đề xuất.
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    // Đổi mẫu đơn/đóng form thì reset từ khoá để lần sau mở lại thấy đủ danh sách.
    if (!open) setSearch('');
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-md px-3 py-2.5 flex items-center justify-between gap-2 text-left transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-outline-variant"
      >
        <span className={`text-sm truncate ${selected ? 'text-on-surface font-semibold' : 'text-secondary'}`}>
          {loading
            ? t('Đang tải danh sách...')
            : (selected ? t(selected.name) : t('-- Chọn loại đề xuất --'))}
        </span>
        <span
          className={`material-symbols-outlined text-secondary text-[20px] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: rect.top,
            bottom: rect.bottom,
          }}
          className="z-[120] bg-surface rounded-lg border border-outline-variant shadow-xl overflow-hidden flex flex-col"
        >
          {/* Ô tìm kiếm NẰM TRONG dropdown để gõ tới đâu lọc tới đó */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant/50 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">search</span>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm loại đề xuất...')}
              className="flex-1 bg-transparent text-sm text-on-surface outline-none py-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                className="text-secondary hover:text-on-surface rounded-full p-0.5 cursor-pointer"
                aria-label={t('Xoá từ khoá')}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="overflow-y-auto custom-scrollbar pb-1" style={{ maxHeight: rect.maxHeight }}>
            {groups.map(([category, items]) => {
              const isCollapsed = collapsed[category] === true;
              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [category]: !c[category] }))}
                    className="w-full sticky top-0 z-10 px-3 py-2 bg-surface-container-low/95 backdrop-blur text-[11px] font-bold text-primary uppercase tracking-wider flex items-center justify-between border-b border-outline-variant/30 cursor-pointer"
                  >
                    <span>{category}</span>
                    <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                      expand_more
                    </span>
                  </button>
                  {!isCollapsed && items.map((dt) => {
                  // BE-115: mẫu đơn chưa có luồng duyệt cho khối này vẫn hiện nhưng LÀM MỜ và
                  // không chọn được, kèm lý do cụ thể.
                  // BE-125: mẫu đơn chỉ THIẾU người duyệt ở một bước thì VẪN chọn được (bước đó bị
                  // bỏ qua khi gửi) — chỉ hiện nhắc nhở để quản trị viên bổ sung nhân sự.
                  const blocked = dt.canCreate === false;
                  const warnMissingApprover = !blocked && dt.unavailableCode === 'MISSING_APPROVER';
                  return (
                  <button
                    key={dt.id}
                    type="button"
                    role="option"
                    aria-selected={value === dt.id}
                    aria-disabled={blocked || undefined}
                    disabled={blocked}
                    title={blocked ? dt.unavailableReason || t('Thiếu người phê duyệt') : undefined}
                    onClick={() => { if (!blocked) pick(dt.id); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex flex-col gap-0.5 transition-colors ${
                      blocked
                        ? 'opacity-50 cursor-not-allowed'
                        : value === dt.id
                          ? 'bg-primary/10 text-primary font-semibold cursor-pointer'
                          : 'text-on-surface hover:bg-surface-container hover:text-primary cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="break-words whitespace-normal leading-tight">{t(dt.name)}</span>
                      {value === dt.id && !blocked && (
                        <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">check</span>
                        )}
                      {blocked && (
                        <span className="material-symbols-outlined text-[16px] text-warning flex-shrink-0" title={t('Thiếu người phê duyệt')}>block</span>
                      )}
                      {warnMissingApprover && (
                        <span className="material-symbols-outlined text-[16px] text-warning flex-shrink-0" title={t('Thiếu người phê duyệt')}>info</span>
                      )}
                    </span>
                    {blocked && (
                      <span className="text-[11px] text-warning leading-snug">
                        {/* BE-118: dùng MÃ lý do để hiện nhãn ngắn gọn, cố định — không phải câu động
                            nên dịch sẵn được ở cả 3 ngôn ngữ, không phụ thuộc bộ dịch tự động. */}
                        {dt.unavailableCode === 'NO_WORKFLOW'
                          ? t('Chưa có luồng duyệt')
                          : t('Thiếu người phê duyệt')}
                      </span>
                    )}
                    {warnMissingApprover && (
                      <span className="text-[11px] text-warning leading-snug">
                        {t('Thiếu người phê duyệt')}
                      </span>
                    )}
                  </button>
                  );
                  })}
                </div>
              );
            })}

            {!loading && matchCount === 0 && (
              <div className="px-4 py-6 text-center text-sm text-secondary">
                {t('Không có loại đề xuất nào khớp từ khóa.')}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
