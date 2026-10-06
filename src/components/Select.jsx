import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';

/**
 * BE-149: ô chọn DÙNG CHUNG cho toàn app.
 *
 * Vì sao: mọi trang đang dùng `<select>` gốc của trình duyệt nên khi bấm mở ra, danh sách lựa chọn
 * do HỆ ĐIỀU HÀNH vẽ (nền xanh mặc định, chữ và cỡ chữ khác, bo góc khác) — mỗi trình duyệt một
 * kiểu và lệch hẳn so với phần còn lại của ứng dụng. Component này thay danh sách đó bằng hộp của
 * chính ứng dụng: cùng bo góc/đổ bóng/tông màu, cùng kiểu chữ, ô đang chọn có dấu ✓.
 *
 * Tương thích với `.filter-control` của thanh lọc nên chỉ cần truyền `className` như cũ.
 *
 * Lựa chọn có thể kèm `group` (hiện tiêu đề nhóm) và `disabled` (không chọn được) để thay được cả
 * các ô dùng `<optgroup>` trước đây.
 *
 * @param {{value:any,label:any,group?:string,disabled?:boolean}[]} options
 * @param {string} placeholder  khoá dịch cho trạng thái chưa chọn
 * @param {'left'|'right'} align  mép neo của hộp danh sách (dùng 'right' cho ô sát mép phải)
 * @param {boolean} [searchable]  mặc định: tự bật khi có trên 8 lựa chọn
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = '-- Chọn --',
  disabled = false,
  className = '',
  align = 'left',
  searchable,
  maxHeight = 280,
  dropdownClassName = '',
  testId,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const boxRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;
  const withSearch = searchable ?? options.length > 8;

  const close = () => {
    setOpen(false);
    setQuery('');
    setDropdownPosition(null);
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = boxRef.current?.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      if (!trigger || !dropdown) return;

      const below = window.innerHeight - trigger.bottom - 8;
      const above = trigger.top - 8;
      const estimatedHeight = Math.min(maxHeight, options.length * 40 + 8) + (withSearch ? 56 : 0);
      const openAbove = below < estimatedHeight && above > below;
      const availableHeight = Math.max(0, openAbove ? above : below);
      const height = Math.min(dropdown.scrollHeight, availableHeight);
      const top = openAbove ? trigger.top - height - 4 : trigger.bottom + 4;
      const width = trigger.width;
      const left = align === 'right' ? trigger.right - width : trigger.left;

      setDropdownPosition({ top, left, width, maxHeight: height });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, maxHeight, open, options.length, withSearch]);

  // Đóng khi bấm ra ngoài / nhấn Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (boxRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label ?? '').toLowerCase().includes(q));
  }, [options, query]);

  const pick = (val) => {
    close();
    if (val !== value) onChange(val);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          const rect = boxRef.current.getBoundingClientRect();
          setDropdownPosition({ top: -10000, left: 0, width: rect.width, maxHeight });
          setOpen(true);
        }}
        className={`${className} bg-none pr-3 flex items-center justify-between gap-2 text-left ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={`truncate ${selected ? '' : 'text-secondary'}`}>
          {selected ? selected.label : t(placeholder)}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-secondary flex-shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className={`fixed z-[100] bg-surface border border-outline-variant rounded-lg shadow-xl overflow-hidden flex flex-col ${dropdownClassName}`}
          style={{
            top: dropdownPosition?.top ?? -10000,
            left: dropdownPosition?.left ?? 0,
            width: dropdownPosition?.width ?? 0,
            maxHeight: dropdownPosition?.maxHeight ?? maxHeight,
            visibility: dropdownPosition ? 'visible' : 'hidden',
          }}
        >
          {withSearch && (
            <div className="p-2 border-b border-outline-variant/50">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-secondary">
                  search
                </span>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && visible.length === 1) pick(visible[0].value);
                  }}
                  placeholder={t('Tìm kiếm...')}
                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-outline-variant rounded-md outline-none focus:border-primary bg-surface text-on-surface"
                />
              </div>
            </div>
          )}

          <div
            className="overflow-y-auto custom-scrollbar py-1"
            style={{ maxHeight: Math.max(0, (dropdownPosition?.maxHeight ?? maxHeight) - (withSearch ? 56 : 0)) }}
          >
            {visible.length === 0 ? (
              <div className="px-3 py-3 text-sm text-secondary text-center">{t('Không tìm thấy kết quả.')}</div>
            ) : (
              visible.map((o, idx) => {
                const prevGroup = idx > 0 ? visible[idx - 1].group : undefined;
                const showGroup = o.group && o.group !== prevGroup;
                return (
                  <div key={o.value ?? `g-${idx}`}>
                    {showGroup && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {o.group}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={o.disabled}
                      onClick={() => !o.disabled && pick(o.value)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                        o.disabled
                          ? 'text-secondary/50 cursor-not-allowed'
                          : o.value === value
                            ? 'bg-primary/10 text-primary font-medium cursor-pointer'
                            : 'text-on-surface hover:bg-surface-container cursor-pointer'
                      }`}
                    >
                      <span className="truncate">{o.label}</span>
                      {o.value === value && !o.disabled && (
                        <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">check</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
