import React from 'react';

/**
 * Thanh phân trang dùng chung.
 *
 * BE-: cửa sổ số trang LUÔN có bề rộng cố định (1 … c-1 c c+1 … n = 7 ô) để thanh phân trang
 * không bị lệch/so le khi số trang ít hay nhiều, và luôn căn giữa khối nội dung ở mọi bề rộng.
 */
const SIBLINGS = 1;
const SLOT = 'w-8 h-8';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = 'w-full py-3 flex justify-center items-center gap-1.5 flex-wrap',
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  let start = Math.max(2, currentPage - SIBLINGS);
  let end = Math.min(totalPages - 1, currentPage + SIBLINGS);

  // Dịch cửa sổ khi ở gần đầu/cuối để số ô luôn bằng nhau (không bị co lại một bên)
  if (currentPage <= SIBLINGS + 1) {
    end = Math.min(totalPages - 1, SIBLINGS * 2 + 1);
  }
  if (currentPage >= totalPages - SIBLINGS) {
    start = Math.max(2, totalPages - (SIBLINGS * 2 + 1));
  }

  pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className={className}>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${SLOT} flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer`} 
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      
      {pages.map((page, idx) => (
        page === '...' ? (
          <span key={`dots-${idx}`} className={`${SLOT} flex items-center justify-center text-on-surface-variant select-none`}>…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${SLOT} flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentPage === page 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {page}
          </button>
        )
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${SLOT} flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer`}
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}
