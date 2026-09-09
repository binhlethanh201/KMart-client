import React from 'react';
import { Link } from 'react-router-dom';

export default function RequestsSidebar() {
  return (
    <aside className="w-[260px] bg-[#0F172A] text-slate-300 flex-shrink-0 flex flex-col border-r border-slate-800/50 h-full shadow-sm z-40 hidden md:flex">
      {/* User Profile Stack */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img 
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-600" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpd-a7S68cC6pmJdeau9eKmaKEjspeDNfx0D1d7B908ssyvKGCK3MS3nsjdwZST1C20qiZb0jeJfAU2ZKMtIL29DECuc-yAOdReutZ8H2P3kUUuA0g6ZT3wafKdSa9jGsPlfHqFUmyciDPEPTXx57vD1qXcL9rNijsxfSMYFaoA8XUyeBfY6wrI-qzVadb2xtRnYMe3_zNRRQM2WyUZttfpyEUKifR6Qs6Ou4Ke53cIwnYQfrSyEpV3A" 
              alt="Avatar" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0B132B] rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-body-md font-bold text-white truncate">Nguyễn Văn A</p>
            <p className="font-label-md text-label-md text-slate-400 truncate">Admin • Online</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
        </div>
      </div>
      
      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        <div className="font-label-md text-label-md text-slate-500 uppercase tracking-widest text-[11px] px-3 mb-3 mt-2">Quản lý Đơn từ</div>
        <Link to="/my-requests" className="flex items-center justify-between px-3 py-2.5 rounded-lg border-l-4 border-primary bg-primary/10 text-white font-bold transition-all">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary fill">folder_shared</span>
            <span className="font-body-md text-body-md">Đơn từ cá nhân</span>
          </div>
        </Link>
        <Link to="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            <span className="font-body-md text-body-md font-medium">Đơn chờ duyệt</span>
          </div>
          <span className="bg-primary text-white font-label-md text-label-md px-2 py-0.5 rounded-full">3</span>
        </Link>
        
        <div className="w-full h-px bg-white/10 my-4"></div>
        
        <div className="font-label-md text-label-md text-slate-500 uppercase tracking-wider px-3 mb-2">Bộ lọc Trạng thái</div>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input defaultChecked className="form-radio text-primary bg-slate-800 border-slate-600 focus:ring-primary focus:ring-offset-0" name="status" type="radio" value="all" />
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Tất cả</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-primary bg-slate-800 border-slate-600 focus:ring-primary focus:ring-offset-0" name="status" type="radio" value="received" />
          <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">inbox</span>
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Gửi đến tôi</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-primary bg-slate-800 border-slate-600 focus:ring-primary focus:ring-offset-0" name="status" type="radio" value="sent" />
          <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">send</span>
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Tôi gửi đi</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-primary bg-slate-800 border-slate-600 focus:ring-primary focus:ring-offset-0" name="status" type="radio" value="following" />
          <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white">visibility</span>
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Đang theo dõi</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-amber-500 bg-slate-800 border-slate-600 focus:ring-amber-500 focus:ring-offset-0" name="status" type="radio" value="pending" />
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Chờ duyệt</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0" name="status" type="radio" value="approved" />
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Đã phê duyệt</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <input className="form-radio text-rose-500 bg-slate-800 border-slate-600 focus:ring-rose-500 focus:ring-offset-0" name="status" type="radio" value="rejected" />
          <span className="font-body-md text-body-md text-slate-300 group-hover:text-white">Từ chối</span>
        </label>
        
        <div className="w-full h-px bg-white/10 my-4"></div>
        
        <div className="font-label-md text-label-md text-slate-500 uppercase tracking-wider px-3 mb-2">Phòng ban</div>
        <div className="flex flex-wrap gap-2 px-3">
          <span className="px-2 py-1 rounded bg-white/10 text-slate-300 font-label-md text-label-md hover:bg-white/20 cursor-pointer">
            Kế toán
          </span>
        </div>
      </div>
    </aside>
  );
}
