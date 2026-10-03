import React from 'react';

/**
 * BE-78: logo dùng CHUNG cho mọi bề mặt (trang đăng nhập, header + footer landing).
 *
 * Trước đây mỗi nơi tự dựng một kiểu: header landing là ô xanh đặc trên nền trắng, footer cũng vậy,
 * còn trang đăng nhập là ô trắng mờ trên nền navy — nhìn như ba thương hiệu khác nhau.
 *
 * Thiết kế thống nhất: một ô vuông bo góc với DẢI CHUYỂN SẮC XANH (sáng → đậm) và chữ K trắng.
 * Chọn dải xanh vì nó đọc được trên CẢ HAI nền:
 *   * trên nền sáng (header/footer landing) — khối xanh nổi rõ trên trắng;
 *   * trên nền navy (trang đăng nhập) — dải xanh sáng hơn nền, thêm viền trắng mờ và quầng sáng.
 * Nhờ vậy chỉ cần đổi `tone` để hợp nền, không phải thiết kế lại logo.
 */

const SIZES = {
  sm: { mark: 'h-9 w-9 rounded-[10px]', letter: 'text-[17px]', word: 'text-[18px]' },
  md: { mark: 'h-11 w-11 rounded-[12px]', letter: 'text-[22px]', word: 'text-[21px]' },
  lg: { mark: 'h-16 w-16 rounded-[16px]', letter: 'text-[32px]', word: 'text-[30px]' },
  xl: { mark: 'h-[72px] w-[72px] rounded-[18px]', letter: 'text-[36px]', word: 'text-[34px]' },
};

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {'onDark'|'onLight'} [props.tone='onLight'] Nền phía sau logo, quyết định màu chữ thương hiệu.
 * @param {boolean} [props.glow=false] Thêm quầng sáng sau ô logo (dùng trên nền tối để logo "nổi lên").
 * @param {boolean} [props.showWordmark=true]
 * @param {boolean} [props.stacked=false] Xếp dọc (ô logo trên, chữ dưới) — dùng cho trang đăng nhập.
 * @param {React.ReactNode} [props.tagline] Dòng mô tả nhỏ dưới tên thương hiệu.
 * @param {string} [props.className]
 */
export default function BrandLogo({
  size = 'md',
  tone = 'onLight',
  glow = false,
  showWordmark = true,
  stacked = false,
  tagline = null,
  className = '',
}) {
  const s = SIZES[size] || SIZES.md;
  const isDark = tone === 'onDark';

  const mark = (
    <span className="relative inline-flex shrink-0">
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-[26px] bg-[#3b82f6]/45 blur-xl"
        />
      )}
      <span
        className={`relative inline-flex items-center justify-center bg-[linear-gradient(140deg,#60a5fa_0%,#2563eb_48%,#1d4ed8_100%)] ring-1 ring-white/30 shadow-[0_6px_18px_-6px_rgba(29,78,216,0.75)] ${s.mark}`}
      >
        {/* Vệt sáng mảnh ở cạnh trên giúp khối có chiều khối thay vì phẳng lì */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-0.5 h-1/3 rounded-full bg-white/25 blur-[3px]"
        />
        <span className={`relative font-extrabold leading-none tracking-tight text-white ${s.letter}`}>
          K
        </span>
      </span>
    </span>
  );

  if (!showWordmark) {
    return <span className={className}>{mark}</span>;
  }

  const wordmark = (
    <span className="flex min-w-0 flex-col leading-none">
      <span
        className={`font-extrabold tracking-tight ${s.word} ${isDark ? 'text-white drop-shadow-sm' : 'text-primary'}`}
      >
        Kmart
      </span>
      {tagline ? (
        <span
          className={`mt-1.5 text-[11px] font-semibold uppercase tracking-[2.2px] ${
            isDark ? 'text-white/75' : 'text-secondary'
          }`}
        >
          {tagline}
        </span>
      ) : null}
    </span>
  );

  return (
    <span
      className={`inline-flex ${stacked ? 'flex-col items-center gap-4 text-center' : 'flex-row items-center gap-2.5'} ${className}`}
    >
      {mark}
      {wordmark}
    </span>
  );
}
