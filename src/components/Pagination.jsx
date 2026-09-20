import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Basic logic: show first, last, current, and +-1 from current
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  // Remove duplicate '...'
  const uniquePages = pages.filter((p, index) => {
    return p !== '...' || pages[index - 1] !== '...';
  });

  return (
    <div className="py-4 flex justify-center items-center gap-2">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer" 
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      
      {uniquePages.map((page, idx) => (
        page === '...' ? (
          <span key={`dots-${idx}`} className="text-on-surface-variant px-1">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer ${
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
        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}
