import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * BE-118: ô chọn CÓ Ô TÌM KIẾM.
 *
 * Vì sao cần: ở phần "Tổ chức & Phân quyền", danh sách phòng ban đã dài (20+ đơn vị) nên chọn
 * bằng `<select>` thường rất khó tìm. Component này giữ nguyên giao diện của form (cùng class
 * `fieldCls`) nhưng bấm vào sẽ mở danh sách kèm ô gõ tìm.
 *
 * `renderLabel` cho phép hiển thị nhãn đã dịch (tên phòng ban / vai trò) mà không bị gửi đi dịch
 * hai lần; tìm kiếm vẫn so khớp trên cả nhãn hiển thị và giá trị gốc.
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = '-- Chọn --',
  disabled = false,
  className = '',
  renderLabel = (item) => item.label,
  testId,
  ariaLabel,
  id,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  /*
   * UX-01: nút mở danh sách lấy tên truy cập từ chính chữ bên trong nó, nên không cần aria-label
   * cho trường hợp thường. Chỉ cần thêm trạng thái mở/đóng (`aria-haspopup`/`aria-expanded`) và
   * tên riêng cho Ô TÌM KIẾM bên trong (nó chỉ có placeholder, mà placeholder không phải nhãn).
   */
  const searchId = useId();

  const selected = options.find((o) => o.value === value) || null;

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Mở ra là focus vào ô tìm kiếm; gõ để lọc
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      String(renderLabel(o) ?? '').toLowerCase().includes(q)
      || String(o.label ?? '').toLowerCase().includes(q)
    );
  }, [options, query, renderLabel]);

  const pick = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        id={id || undefined}
        data-testid={testId}
        disabled={disabled}
        /* UX-01: <button> lấy tên truy cập từ chính chữ bên trong, nên không cần aria-label
           cho trường hợp thường; chỉ bổ sung trạng thái mở/đóng cho trình đọc màn hình. */
        aria-label={ariaLabel || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${className} flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${selected ? '' : 'text-secondary'}`}>
          {selected ? renderLabel(selected) : t(placeholder)}
        </span>
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">expand_more</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-md shadow-xl flex flex-col overflow-hidden">
          <div className="p-2 border-b border-outline-variant/50">
            <div className="relative">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-secondary">search</span>
              <input
                ref={inputRef}
                id={searchId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false);
                  if (e.key === 'Enter' && visible.length === 1) pick(visible[0].value);
                }}
                placeholder={t('Tìm kiếm...')}
                aria-label={t('Tìm kiếm trong danh sách')}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-outline-variant rounded-md outline-none focus:border-primary bg-surface"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 240 }}>
            {visible.length === 0 ? (
              <div className="px-3 py-3 text-sm text-secondary text-center">{t('Không tìm thấy kết quả.')}</div>
            ) : (
              visible.map((o) => (
                <button
                  key={o.value || '__empty__'}
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    o.value === value ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="truncate">{renderLabel(o)}</span>
                  {o.value === value && (
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">check</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
