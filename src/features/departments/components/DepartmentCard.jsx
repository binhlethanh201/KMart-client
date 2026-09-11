import React from 'react';
import { Link } from 'react-router-dom';

export default function DepartmentCard({
  id,
  icon,
  status,
  name,
  code,
  leaders,
  members,
  memberCount,
  extraCount
}) {
  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/50 hover:shadow-md hover:border-outline-variant transition-all flex flex-col p-6 group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div 
          className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors cursor-help"
          title={status.toLowerCase() === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${status.toLowerCase() === 'active' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {name}
        </h3>
        <p className="text-sm text-outline font-medium">{code}</p>
      </div>
      
      <div className="space-y-2 mb-6 flex-1">
        {leaders.map((leader, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
            <span className="truncate font-medium">{leader.title}: {leader.name}</span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-outline-variant/30 pt-4 flex justify-between items-center mb-4">
        <div className="flex -space-x-2">
          {members.map((memberAvatar, idx) => (
            <img 
              key={idx}
              className="w-8 h-8 rounded-full border-2 border-white object-cover" 
              src={memberAvatar} 
              alt="Member avatar" 
            />
          ))}
          {extraCount && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-container/20 flex items-center justify-center text-xs font-semibold text-primary">
              +{extraCount}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-on-surface-variant">{memberCount} nhân sự</span>
      </div>
      
      <Link
        to={`/departments/${id}`}
        className="w-full bg-transparent border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low hover:border-primary hover:text-primary py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        Vào chi tiết phòng
      </Link>
    </div>
  );
}
