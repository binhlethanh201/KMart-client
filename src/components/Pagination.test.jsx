import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

/** Số trang đang hiện, theo thứ tự. */
const numericPages = () =>
  screen
    .getAllByRole('button')
    .filter((b) => /^\d+$/.test(b.textContent))
    .map((b) => Number(b.textContent));

/** Số dấu "…" (mỗi dấu là một ô trong cửa sổ). */
const dotCount = () => screen.queryAllByText('…').length;

describe('Pagination', () => {
  it('không render gì khi chỉ có một trang', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ở giữa dải trang thì cửa sổ rộng 7 ô: 1 … c-1 c c+1 … n', () => {
    render(<Pagination currentPage={25} totalPages={50} onPageChange={vi.fn()} />);
    expect(numericPages()).toEqual([1, 24, 25, 26, 50]);
    expect(dotCount()).toBe(2);
  });

  it('gần đầu dải trang vẫn luôn có trang 1 và trang cuối', () => {
    render(<Pagination currentPage={2} totalPages={50} onPageChange={vi.fn()} />);
    expect(numericPages()).toEqual([1, 2, 3, 50]);
    expect(dotCount()).toBe(1);
  });

  it('gần cuối dải trang vẫn luôn có trang 1 và trang cuối', () => {
    render(<Pagination currentPage={49} totalPages={50} onPageChange={vi.fn()} />);
    expect(numericPages()).toEqual([1, 47, 48, 49, 50]);
    expect(dotCount()).toBe(1);
  });

  it('gọi onPageChange với số trang khi bấm', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={25} totalPages={50} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: '26' }));
    expect(onPageChange).toHaveBeenCalledWith(26);
  });

  it('khoá nút lùi ở trang đầu', () => {
    render(<Pagination currentPage={1} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getAllByRole('button')[0]).toBeDisabled();
  });

  it('khoá nút tiến ở trang cuối', () => {
    render(<Pagination currentPage={10} totalPages={10} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });
});
