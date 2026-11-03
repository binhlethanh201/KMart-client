import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranslatedText from './TranslatedText';
import { I18nProvider } from './I18nProvider';

// Seed sẵn bản dịch tự động (cache v3) để không cần gọi mạng trong test.
const seedAutoCache = (lang, entries) => {
  localStorage.setItem(`kmart.i18n.auto.${lang}.v3`, JSON.stringify(entries));
};

const renderWithI18n = (ui) => render(<I18nProvider>{ui}</I18nProvider>);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('kmart.language', 'ko');
  seedAutoCache('ko', { 'Lý do nghỉ': '휴가 사유' });
});

afterEach(() => {
  localStorage.clear();
});

describe('TranslatedText', () => {
  it('hiển thị bản dịch khi đã có trong cache', () => {
    renderWithI18n(<TranslatedText text="Lý do nghỉ" />);
    expect(screen.getByText('휴가 사유')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('không đổi chuỗi gốc: mã/ngày hiển thị nguyên văn', () => {
    renderWithI18n(<TranslatedText text="2026-11-10" />);
    expect(screen.getByText('2026-11-10')).toBeInTheDocument();
  });

  it('bật nút "Xem bản gốc" khi allowViewOriginal và bản dịch khác bản gốc', async () => {
    const user = userEvent.setup();
    renderWithI18n(<TranslatedText text="Lý do nghỉ" allowViewOriginal />);

    // Ngôn ngữ test là 'ko' nên nhãn nút lấy từ từ điển tĩnh: 'Xem bản gốc' -> '원본 보기'.
    const toggle = screen.getByRole('button', { name: '원본 보기' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('휴가 사유')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByText('Lý do nghỉ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '번역 보기' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '번역 보기' }));
    expect(screen.getByText('휴가 사유')).toBeInTheDocument();
  });

  it('không hiện nút khi bản dịch chưa về (translated === original)', () => {
    renderWithI18n(<TranslatedText text="Chưa có bản dịch" allowViewOriginal />);
    expect(screen.getByText('Chưa có bản dịch')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
