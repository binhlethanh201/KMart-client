import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './translations/en';
import { ko } from './translations/ko';
import { getAutoTranslation, requestAutoTranslation, subscribeAutoTranslate } from './autoTranslate';

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
    activeLanguage = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* bỏ qua */
    }
    document.documentElement.lang = language;
  }, [language]);

  // Giữ biến cấp module đồng bộ ngay cả trước khi effect chạy
  activeLanguage = language;

  const setLanguage = useCallback((code) => {
    if (LANGUAGES.some((l) => l.code === code)) setLanguageState(code);
  }, []);

  /**
   * Dịch một chuỗi tiếng Việt sang ngôn ngữ hiện tại.
   * Hỗ trợ nội suy tham số: t('Xin chào {name}', { name: 'An' })
   * `autoVersion` nằm trong deps để t() mới khi có bản dịch tự động về.
   */
  const t = useCallback((text, params) => resolve(text, params, language), [language, autoVersion]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Cho phép dùng t() ngoài provider (trả về nguyên văn tiếng Việt) để tránh crash.
    return { language: DEFAULT_LANG, setLanguage: () => {}, t: (s) => s, languages: LANGUAGES };
  }
  return ctx;
}