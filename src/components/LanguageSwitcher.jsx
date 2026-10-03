import { useI18n } from '../i18n/I18nProvider';

/**
 * Nút chuyển ngôn ngữ VI | EN | KO (chỉ chữ, không dùng cờ cho gọn).
 * props.isCollapsed: sidebar thu gọn -> xếp dọc.
 * props.variant: 'dark' (sidebar nền tối) hoặc 'light' (header nền sáng).
 */
export default function LanguageSwitcher({ isCollapsed = false, variant = 'dark' }) {
  const { language, setLanguage, languages } = useI18n();

  // Nền sáng: dải chữ gọn VI | EN | KO
  if (variant === 'light') {
    return (
      <div className="flex items-center rounded-full border border-outline-variant bg-surface-container-lowest px-1 py-0.5">
        {languages.map((l, i) => {
          const active = language === l.code;
          return (
            <span key={l.code} className="flex items-center">
              {i > 0 && <span className="w-px h-3.5 bg-outline-variant" />}
              <button
                type="button"
                onClick={() => setLanguage(l.code)}
                title={l.label}
                className={`px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  active ? 'text-primary' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {l.short}
              </button>
            </span>
          );
        })}
      </div>
    );
  }

  // BE-77c: nền TỐI (gradient thương hiệu) -> viên thuỷ tinh trắng mờ, chữ sáng.
  // Khác hẳn variant 'light' (nền sáng) và variant 'dark' (dành riêng cho sidebar).
  if (variant === 'onDark') {
    return (
      <div className="flex items-center rounded-full border border-white/20 bg-white/10 px-1 py-0.5 backdrop-blur-sm">
        {languages.map((l, i) => {
          const active = language === l.code;
          return (
            <span key={l.code} className="flex items-center">
              {i > 0 && <span className="w-px h-3.5 bg-white/25" />}
              <button
                type="button"
                onClick={() => setLanguage(l.code)}
                title={l.label}
                className={`px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  active ? 'bg-white text-primary' : 'text-white/75 hover:text-white'
                }`}
              >
                {l.short}
              </button>
            </span>
          );
        })}
      </div>
    );
  }

  // Sidebar thu gọn: xếp dọc, chỉ chữ
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 py-2">
        {languages.map((l) => {
          const active = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              title={l.label}
              className={`w-9 h-6 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                active
                  ? 'text-primary bg-white/10'
                  : 'text-slate-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              {l.short}
            </button>
          );
        })}
      </div>
    );
  }

  // Sidebar mở rộng: dải chữ gọn, không tiêu đề
  return (
    <div className="px-3 py-2.5 border-t border-white/10">
      <div className="flex items-center rounded-md bg-white/5 px-1 py-0.5">
        {languages.map((l, i) => {
          const active = language === l.code;
          return (
            <span key={l.code} className="flex flex-1 items-center">
              {i > 0 && <span className="w-px h-3.5 bg-white/15" />}
              <button
                type="button"
                onClick={() => setLanguage(l.code)}
                title={l.label}
                className={`flex-1 py-1.5 text-[12px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  active ? 'text-primary' : 'text-slate-500 hover:text-white'
                }`}
              >
                {l.short}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}