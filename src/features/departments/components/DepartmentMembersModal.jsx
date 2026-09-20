import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { departmentService } from '../services/departmentService';

export default function DepartmentMembersModal({ departmentId, departmentName, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await departmentService.getMembers(departmentId);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [departmentId]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Nhân sự phòng ban</h2>
            <p className="text-sm text-secondary mt-1">{departmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 flex justify-center items-center">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">group_off</span>
              <p>Chưa có nhân sự nào trong phòng ban này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant/30" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{m.name}</p>
                    <p className="text-sm text-secondary truncate">{m.role}</p>
                  </div>
                  {m.status === 'active' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" title="Đang hoạt động"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0" title="Ngừng hoạt động"></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
