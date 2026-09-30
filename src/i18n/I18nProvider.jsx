import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './translations/en';
import { ko } from './translations/ko';

/**
 * Hệ thống đa ngôn ngữ (Việt - Anh - Hàn).
 *
 * Cách dùng:
 *   const { t } = useI18n();
 *   <span>{t('Đơn từ cá nhân')}</span>
 *
 * Cách hoạt động: khoá dịch CHÍNH LÀ chuỗi tiếng Việt gốc trong code.
 * - Ngôn ngữ 'vi'  -> trả nguyên văn (không cần bảng dịch)
 * - Ngôn ngữ 'en'/'ko' -> tra bảng; nếu chưa có bản dịch thì trả lại tiếng Việt
 *   (không bao giờ hiện khoá thô, nên thiếu dịch vẫn dùng được).
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
    out = DICTIONARIES[language]?.[key] ?? key;
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
   */
  const t = useCallback((text, params) => resolve(text, params, language), [language]);

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