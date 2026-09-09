import React from 'react';

export default function UserProfile() {
  const sections = [
    { title: 'Nhóm (Đơn vị nghiệp vụ) (0)', icon: 'group_off' },
    { title: 'Học vấn', icon: 'school' },
    { title: 'Kinh nghiệm làm việc', icon: 'work_history' },
    { title: 'Giải thưởng & Thành tích', icon: 'emoji_events' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface flex flex-col relative z-10 w-full h-full">
      {/* Header / Breadcrumbs */}
      <header className="h-[56px] bg-white border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
        <div className="flex items-center text-on-surface-variant font-body-sm flex-wrap">
          <span className="uppercase tracking-wider font-semibold text-xs text-secondary hidden sm:inline">Tài khoản</span>
          <span className="material-symbols-outlined text-[16px] mx-1 sm:mx-2 text-outline hidden sm:inline">chevron_right</span>
          <span className="font-medium text-on-surface">Hoàng Lâm Anh</span>
          <span className="mx-1 sm:mx-2 text-outline-variant">•</span>
          <span className="text-secondary">HR manager</span>
        </div>
        <button className="text-white px-3 sm:px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 bg-[#2563eb]">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Chỉnh sửa tài khoản</span>
        </button>
      </header>

      {/* Content Canvas */}
      <div className="w-full flex flex-col gap-6 p-4 sm:p-6 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded border border-outline-variant flex flex-col sm:flex-row items-start relative p-4 gap-4 sm:gap-6 shadow-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-surface-variant">
            <img 
              alt="Avatar" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTcCiwP0FhPFC-9pGWSl-lBQXRBXFylzIaQdsviJ8dnbZ6Ls5fuW6IfRaowoxmBUvT_IEzIAv_kgBJjSuxLwctHKqxz0q21HB3q4yL4w0sCFFhyH3wEXRWBVY4gt8dC-iOZCdBq-RY1WwoLTMyjr0loktKL4k9Sz-aHJlOZdd7-HewCbJhUKRWjV6W00qQVym4BrNx6DSVINyOLmWu_XLwA-b2qRnlAU68SZjch0uycsCAjNKRjZ2rBQ" 
            />
          </div>
          <div className="flex-1 pt-1 sm:pt-2">
            <h1 className="font-display-sm text-on-surface mb-1">Hoàng Lâm Anh</h1>
            <p className="font-body-md text-secondary mb-4 sm:mb-6">HR manager</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                <span className="text-on-surface break-all">baserequest.demo@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">call</span>
                <span className="text-secondary italic">No phone number</span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <span className="material-symbols-outlined text-outline text-[20px]">location_on</span>
                <span className="text-secondary italic">No address</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded border border-outline-variant flex flex-col shadow-sm">
              <div className="px-4 sm:px-5 border-b border-slate-100 flex justify-between items-center bg-surface-bright rounded-t py-2.5">
                <h2 className="font-label-md text-secondary uppercase">{section.title}</h2>
                <button className="text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center text-center h-28 sm:h-32 p-4 sm:p-6 bg-white rounded-b">
                <span className="material-symbols-outlined text-outline-variant text-3xl sm:text-4xl mb-2">
                  {section.icon}
                </span>
                <p className="text-secondary font-body-sm">Không có thông tin</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
