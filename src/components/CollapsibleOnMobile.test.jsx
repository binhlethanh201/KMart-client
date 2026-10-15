import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollapsibleOnMobile from './CollapsibleOnMobile';
import { I18nProvider } from '../i18n/I18nProvider';

// Không `import React`: test này khoá lại việc runtime JSX tự động hoạt động trong Vitest,
// vì 57/69 file .jsx của dự án dựa vào nó (không có `import React`).
const renderWithI18n = (ui) => render(<I18nProvider>{ui}</I18nProvider>);

describe('CollapsibleOnMobile', () => {
  it('mặc định đóng trên mobile nhưng vẫn render nội dung cho desktop', () => {
    renderWithI18n(
      <CollapsibleOnMobile title="Bộ lọc">
        <input aria-label="ô lọc" />
      </CollapsibleOnMobile>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('ô lọc')).toBeInTheDocument();
  });

  it('mở/đóng khi bấm và cập nhật aria-expanded', async () => {
    renderWithI18n(
      <CollapsibleOnMobile title="Bộ lọc">
        <span>nội dung lọc</span>
      </CollapsibleOnMobile>,
    );

    const toggle = screen.getByRole('button');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('chỉ hiện số điều kiện đang áp dụng khi lớn hơn 0', () => {
    const { unmount } = renderWithI18n(<CollapsibleOnMobile title="Bộ lọc" count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    unmount();

    renderWithI18n(<CollapsibleOnMobile title="Bộ lọc" count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('mở sẵn khi defaultOpen', () => {
    renderWithI18n(<CollapsibleOnMobile title="Bộ lọc" defaultOpen />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
});
