import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './translations/en';
import { ko } from './translations/ko';
import { getAutoTranslation, requestAutoTranslation, subscribeAutoTranslate, HANGUL_RE } from './autoTranslate';

/**
 * Hệ thống đa ngôn ngữ (Việt - Anh - Hàn).
 *
 * Cách dùng:
 *   const { t } = useI18n();
 *   <span>{t('Đơn từ cá nhân')}</span>
 *
 * Cách hoạt động: khoá dịch CHÍNH LÀ chuỗi tiếng Việt gốc trong code.
 * - Ngôn ngữ 'vi'  -> trả nguyên văn (không cần bảng dịch)
 * - Ngôn ngữ 'en'/'ko' -> tra bảng dịch tĩnh; nếu chưa có thì tra tiếp bản dịch TỰ ĐỘNG
 *   (nhãn do người dùng nhập ở màn Cấu hình — xem autoTranslate.js); nếu vẫn chưa có thì
 *   trả lại tiếng Việt (không bao giờ hiện khoá thô) và âm thầm yêu cầu dịch để lần sau có.
 *
 * Bảng dịch tĩnh được tự sinh bằng `npm run i18n:sync` (chạy tự động trước dev/build),
 * nên thêm chữ mới trong code không phải tự thêm bản dịch nữa.
 *
 * Ngôn ngữ đã chọn được lưu vào localStorage và áp lên thuộc tính lang của <html>.
 */

export const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ko', label: '한국어', short: 'KO', flag: '🇰🇷' },
];

const STORAGE_KEY = 'kmart.language';
const DEFAULT_LANG = 'vi';

const DICTIONARIES = { en, ko };

const I18nContext = createContext(null);

/**
 * Ngôn ngữ đang dùng, giữ ở cấp module.
 * Cho phép các helper/hằng số (không phải component) gọi translate() mà không cần hook.
 */
let activeLanguage = DEFAULT_LANG;

/** Hàm dịch lõi, dùng chung cho cả hook t() và translate(). */
function resolve(text, params, language) {
  if (text == null) return '';
  const key = String(text);
  let out = key;
  if (language !== 'vi') {
    const staticTranslation = DICTIONARIES[language]?.[key];
    if (staticTranslation) {
      out = staticTranslation;
    } else {
      // BE-59: nhãn chưa có trong bảng tĩnh (thường là nhãn người dùng tự nhập ở màn Cấu hình)
      // -> dùng bản dịch tự động nếu đã có, đồng thời yêu cầu dịch cho lần render sau.
      const auto = getAutoTranslation(language, key);
      if (auto) {
        out = auto;
      } else {
        requestAutoTranslation(language, key);
      }
    }
  }
  if (params && typeof params === 'object') {
    out = out.replace(/\{(\w+)\}/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m
    );
  }
  return out;
}

/** Dịch không cần hook — dùng trong helper/hằng số cấp module. */
export function translate(text, params) {
  return resolve(text, params, activeLanguage);
}

/**
 * Nội dung KHÔNG BAO GIỜ được gửi đi dịch tự động: ngày giờ, số điện thoại, email,
 * mã hệ thống (UUID, mã nhân viên, mã đơn trong ngoặc)... Dịch chúng vừa phí vừa dễ sai.
 */
const NO_LETTERS_RE = /^[^\p{L}]*$/u;
const ISO_DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}([T ]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{1,2}:?\d{2})?)?$/;
const DMY_DATE_RE = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0?\d{9,12}$/;
const INTL_PHONE_RE = /^\+\d{6,15}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX8_RE = /^[0-9A-F]{8}$/;
const EMPLOYEE_CODE_RE = /^[A-Z]{1,4}\d{4,10}$/;
const BRACKET_CODE_RE = /^\[[A-Z0-9_-]+\]$/;

export function isUntranslatable(text) {
  if (text == null) return true;
  const s = String(text).trim();
  if (s.length < 2) return true;
  return (
    NO_LETTERS_RE.test(s) ||
    ISO_DATE_RE.test(s) ||
    DMY_DATE_RE.test(s) ||
    TIME_RE.test(s) ||
    EMAIL_RE.test(s) ||
    PHONE_RE.test(s) ||
    INTL_PHONE_RE.test(s) ||
    UUID_RE.test(s) ||
    HEX8_RE.test(s) ||
    EMPLOYEE_CODE_RE.test(s) ||
    BRACKET_CODE_RE.test(s)
  );
}

/**
 * Dịch NỘI DUNG do người dùng nhập (lý do, bình luận, tiêu đề đơn...) — khác nhãn UI ở chỗ
 * KHÔNG tra từ điển tĩnh (từ điển chỉ chứa nhãn), ngoại lệ duy nhất: cả chuỗi trùng khớp
 * một nhãn đã biên tập sẵn thì dùng bản dịch tĩnh vì nó chuẩn hơn dịch tự động.
 */
function resolveContent(text, params, language) {
  if (text == null) return '';
  const key = String(text);
  let out = key;
  if (!isUntranslatable(key)) {
    if (language === 'vi') {
      // VI: chỉ dịch ngược về tiếng Việt khi nội dung thật sự chứa chữ Hàn.
      if (HANGUL_RE.test(key)) {
        const auto = getAutoTranslation('vi', key);
        if (auto) out = auto;
        else requestAutoTranslation('vi', key);
      }
    } else if (language === 'ko' || language === 'en') {
      const staticTranslation = DICTIONARIES[language]?.[key];
      if (staticTranslation) {
        out = staticTranslation;
      } else {
        const auto = getAutoTranslation(language, key);
        if (auto) out = auto;
        else requestAutoTranslation(language, key);
      }
    }
  }
  if (params && typeof params === 'object') {
    out = out.replace(/\{(\w+)\}/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m
    );
  }
  return out;
}

/** Dịch nội dung người dùng nhập không cần hook — dùng trong helper/hằng số cấp module. */
export function translateContent(text, params) {
  return resolveContent(text, params, activeLanguage);
}

/** Ngôn ngữ hiện tại (dùng ngoài React). */
export function getLanguage() {
  return activeLanguage;
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    } catch {
      /* chế độ riêng tư - bỏ qua */
    }
    return DEFAULT_LANG;
  });

  // BE-59: khi có bản dịch tự động mới về thì vẽ lại để các nhãn đổi ngôn ngữ ngay.
  const [autoVersion, setAutoVersion] = useState(0);
  useEffect(() => subscribeAutoTranslate(() => setAutoVersion((v) => v + 1)), []);

  // Đồng bộ localStorage + thuộc tính lang của <html>
  useEffect(() => {
    // Không gán `activeLanguage` ở đây: dòng ngay dưới đã đồng bộ nó ở mỗi lần render.
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* bỏ qua */
    }
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Giữ biến cấp module đồng bộ ngay cả trước khi effect chạy — `translate()` và `getActiveLanguage()`
   * là hàm thuần (không phải hook) nên các chỗ ngoài React như autoTranslate.js đọc được ngôn ngữ
   * hiện tại. Gán ngay trong render là chủ ý; oxlint coi việc ghi biến ngoài component là lỗi
   * `react(globals)` nhưng ở đây không có state React nào bị ảnh hưởng.
   */
  // oxlint-disable-next-line react/globals
  activeLanguage = language;

  const setLanguage = useCallback((code) => {
    if (LANGUAGES.some((l) => l.code === code)) setLanguageState(code);
  }, []);

  /**
   * Dịch một chuỗi tiếng Việt sang ngôn ngữ hiện tại.
   * Hỗ trợ nội suy tham số: t('Xin chào {name}', { name: 'An' })
   *
   * `autoVersion` nằm trong deps để `t` có danh tính MỚI khi một bản dịch tự động về, nhờ đó mọi
   * component dùng `t` được vẽ lại và đổi ngôn ngữ ngay. Nó không xuất hiện trong thân hàm nên
   * lint báo "unnecessary dependency" — đây là chủ ý, không phải thừa.
   */
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((text, params) => resolve(text, params, language), [language, autoVersion]);

  /**
   * Dịch NỘI DUNG người dùng nhập (tContent) — cùng cơ chế vẽ lại như `t`: `autoVersion` trong
   * deps để khi bản dịch tự động về, component dùng `tContent` được vẽ lại với bản dịch mới.
   */
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const tContent = useCallback((text, params) => resolveContent(text, params, language), [language, autoVersion]);

  const value = useMemo(
    () => ({ language, setLanguage, t, tContent, languages: LANGUAGES }),
    [language, setLanguage, t, tContent]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Cho phép dùng t() ngoài provider (trả về nguyên văn tiếng Việt) để tránh crash.
    return { language: DEFAULT_LANG, setLanguage: () => {}, t: (s) => s, tContent: (s) => s, languages: LANGUAGES };
  }
  return ctx;
}