import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';

// BE-154: chiều cao tối thiểu của khung danh sách khi phải kẹp vì thiếu chỗ —
// đủ cho ô tìm kiếm + vài lựa chọn, không bao giờ sụp còn mỗi ô tìm kiếm.
const MIN_DROPDOWN_HEIGHT = 160;

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
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;
  const withSearch = searchable ?? options.length > 8;

  const close = () => {
    setOpen(false);
    setQuery('');
    setDropdownPosition(null);
  };

  // BE-155/157/158: MỘT listener wheel duy nhất ở cấp tài liệu khi dropdown mở, xử lý
  // tường minh mọi vị trí con trỏ (trong danh sách / trong hộp / ngoài hộp):
  //   - trong danh sách: cuộn danh sách;
  //   - chạm biên trên/dưới của danh sách: cuộn TRANG tiếp;
  //   - ngoài hộp: cuộn TRANG.
  // Vì sao phải tự xử lý: dropdown được portal ra <body> nên chuỗi cuộn tự nhiên của
  // trình duyệt không nối được vào vùng cuộn của trang (app cuộn bằng container bên
  // trong, không phải window); có trang còn không cuộn danh sách dù wheel tới đúng
  // phần tử. Hậu quả cũ: "cuộn hết danh sách rồi cuộn tiếp" thì hộp sụp / đứng im.
  useEffect(() => {
    if (!open) return undefined;
    const onWheel = (e) => {
      if (!e.deltaY) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const node = listRef.current;
      const outer = dropdownRef.current;
      const inList = node && node.contains(e.target);
      const inBox = outer && outer.contains(e.target);
      // Vùng cuộn thật của trang: tổ tiên gần nhất của Ô CHỌN có overflow cuộn được.
      let scroller = null;
      let el = boxRef.current;
      while (el) {
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) { scroller = el; break; }
        el = el.parentElement;
      }
      const scrollPage = (d) => {
        if (scroller) scroller.scrollTo({ top: scroller.scrollTop + d, behavior: 'instant' });
        else window.scrollBy({ top: d, behavior: 'instant' });
      };
      e.preventDefault();
      if (inList || inBox) {
        const atTop = node.scrollTop <= 0 && delta < 0;
        const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1 && delta > 0;
        if (atTop || atBottom) scrollPage(delta);
        else node.scrollTop += delta;
        return;
      }
      scrollPage(delta);
    };
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = boxRef.current?.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      if (!trigger || !dropdown) return;

      // BE-156: chiều cao NỘI DUNG THẬT phải đo bằng scrollHeight của vùng danh sách
      // (không bị ảnh hưởng bởi maxHeight đang kẹp), cộng chiều cao ô tìm kiếm.
      // Trước đây đo dropdown.scrollHeight — giá trị này BỊ KẸP theo maxHeight cũ nên một
      // lần kẹp nhỏ (ô chọn sát đáy màn hình) là hộp tự khoá ở chiều cao cụt mãi mãi:
      // cuộn hết danh sách rồi cuộn tiếp thì hộp ngày càng sụp ("vẫn bị khi cuộn hết mà cuộn tiếp").
      const inner = listRef.current;
      const searchH = withSearch && inner ? Math.max(0, dropdown.scrollHeight - inner.offsetHeight) : 0;
      const contentHeight = (inner ? inner.scrollHeight : dropdown.scrollHeight) + searchH;
      const below = window.innerHeight - trigger.bottom - 8;
      const above = trigger.top - 8;
      let height = Math.min(contentHeight, maxHeight);
      let openAbove = height > below && above > below;
      const available = Math.max(0, openAbove ? above : below);
      if (height > available) {
        height = Math.max(Math.min(contentHeight, available), Math.min(contentHeight, MIN_DROPDOWN_HEIGHT));
      }
      const preferredTop = openAbove ? trigger.top - height - 4 : trigger.bottom + 4;
      const top = Math.max(8, Math.min(preferredTop, window.innerHeight - height - 8));
      const width = trigger.width;
      const left = align === 'right' ? trigger.right - width : trigger.left;

      setDropdownPosition({ top, left, width, maxHeight: height, searchH });
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
        // BE-153: dấu phiên bản component trên DOM — giúp xác nhận tab trình duyệt đã nạp
        // bundle MỚI (chứa bản sửa dropdown) hay vẫn giữ bundle cũ.
        data-select-ver="153"
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
        // BE-150: danh sách lựa chọn được portal ra <body> nên phải nằm TRÊN mọi lớp modal
        // (modal dùng z-[100]..z-[120], toast/chuông dùng z-[130]). Trước đây để z-[100] nên
        // khi mở ô chọn bên trong modal Thêm/Sửa phòng ban (z-[110]) thì danh sách bị modal đè
        // khuất — người dùng chỉ thấy ô đang mở mà không thấy lựa chọn nào.
        <div
          ref={dropdownRef}
          className={`fixed z-[140] bg-surface border border-outline-variant rounded-lg shadow-xl overflow-hidden flex flex-col ${dropdownClassName}`}
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
            ref={listRef}
            className="overflow-y-auto custom-scrollbar py-1"
            // BE-156: trừ đúng chiều cao ô tìm kiếm ĐO THẬT (searchH) thay vì hằng số 56,
            // giữ vùng cuộn khớp tuyệt đối với khung hộp đã tính ở updatePosition.
            style={{ maxHeight: Math.max(0, (dropdownPosition?.maxHeight ?? maxHeight) - (dropdownPosition?.searchH ?? (withSearch ? 56 : 0))) }}
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
