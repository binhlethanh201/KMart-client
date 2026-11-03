import { forwardRef } from 'react';

/**
 * Nút hành động DÙNG CHUNG cho mọi trang (thanh tiêu đề, toolbar, chân modal).
 *
 * Vì sao cần: trước đây mỗi nơi tự viết className riêng nên cùng một hành động "Lưu" mà chỗ
 * cao chỗ thấp, chỗ bo chỗ không, chữ chỗ 13px chỗ 12px — nhìn lệch và xấu. Nay mọi nút hành
 * động lấy cùng một bộ: chiều cao, bo góc, cỡ chữ, khoảng cách icon theo variant + size dưới đây.
 *
 * variant: primary (nền xanh) / secondary (nền trắng viền) / danger (nền đỏ) / ghost (trong suốt).
 * size:    md (mặc định, cao 36px) / sm (cao 32px, cho toolbar và nút trong bảng).
 * icon:    tên material-symbols-outlined, tự thêm aria-hidden vì luôn đi kèm chữ.
 */
const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-sm',
  secondary: 'bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-low shadow-sm',
  danger: 'bg-error text-on-error hover:bg-error/90 shadow-sm',
  ghost: 'bg-transparent text-secondary hover:bg-surface-container-high hover:text-on-surface',
};

const SIZES = {
  md: 'h-9 px-4 gap-2 font-label-md text-label-md',
  sm: 'h-8 px-3 gap-1.5 text-xs font-medium',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon = null, fullWidth = false, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-md transition-colors whitespace-nowrap flex-shrink-0',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .join(' ')
        .trim()}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className={`material-symbols-outlined ${size === 'sm' ? 'text-[16px]' : 'text-[18px]'}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});

export default Button;
