import React from 'react';

export default function Pagination() {
  return (
    <div className="py-8 flex justify-center items-center gap-2">
      <button 
        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50" 
        disabled
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-medium shadow-sm">
        1
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-medium">
        2
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-medium">
        3
      </button>
      <span className="text-on-surface-variant px-1">...</span>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-medium">
        10
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}
