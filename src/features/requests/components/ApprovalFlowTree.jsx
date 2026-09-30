import { useMemo } from 'react';
import { ROLE_LABELS } from '../../../utils/roleLabels';

// BE-20: biểu đồ cây luồng phê duyệt dự kiến, tách riêng để tái sử dụng
// cho cả bản thu gọn (inline trong modal) và bản đầy đủ (popup toàn màn hình).
//
// variant: 'inline' (chip nhỏ) | 'full' (chip lớn hơn cho popup)
export default function ApprovalFlowTree({
  steps = [],
  departments = [],
  employees = [],
  currentUser,
  selectedApproverId,
  departmentsSelected = [],
  variant = 'inline',
}) {
  const isFull = variant === 'full';

  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.stepOrder - b.stepOrder),
    [steps]
  );

  const senderInitials = (() => {
    const name = currentUser?.name || 'Tôi';
    const parts = name.trim().split(' ');
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  })();

  const ownDeptId = currentUser?.departmentId;
  const empById = (id) => employees?.find((e) => e.id === id);
  const roleLabel = (emp, fallback) => {
    if (!emp) return fallback || 'Người duyệt';
    const r = emp.role || (emp.roles && emp.roles[0]) || '';
    const code = String(typeof r === 'string' ? r : (r?.roleName || '')).toUpperCase();
    if (ROLE_LABELS[code]) return ROLE_LABELS[code];
    return emp.position || code || 'Nhân viên';
  };

  // Dựng các tầng duyệt theo từng loại luồng
  const stages = sortedSteps.flatMap((step, idx) => {
    const appType = (step.approvalType || '').toLowerCase();

    // Quản lý trực tiếp: 1 node = quản lý của phòng ban mà người tạo thuộc
    if (appType === 'hierarchy') {
      const dept = departments.find((d) => d.id === ownDeptId);
      const emp = dept?.managerId ? empById(dept.managerId) : null;
      return [{
        key: step.id || idx,
        parallel: false,
        branches: [{
          key: `hier-${step.id || idx}`,
          badge: dept?.code || 'Phòng ban',
          badgeTitle: dept?.name || 'Phòng ban của người tạo',
          name: emp ? emp.name : 'Chưa có quản lý',
          hasManager: Boolean(emp),
          avatar: emp?.avatar,
          role: emp ? roleLabel(emp, 'Quản lý trực tiếp') : 'Chưa có quản lý',
          isStep: true,
        }],
      }];
    }

    // Chuỗi quản lý liên tiếp: đi từ phòng ban người tạo lên các cấp cha (tăng dần)
    if (appType === 'chain') {
      const chainDepts = [];
      const seen = new Set();
      let cur = departments.find((d) => d.id === ownDeptId);
      while (cur && !seen.has(cur.id)) {
        seen.add(cur.id);
        chainDepts.push(cur);
        cur = cur.parentDepartmentId ? departments.find((d) => d.id === cur.parentDepartmentId) : null;
      }
      if (chainDepts.length === 0) {
        return [{
          key: step.id || idx,
          parallel: false,
          branches: [{ key: `chain-empty-${idx}`, badge: 'Chuỗi quản lý', badgeTitle: '', name: 'Chưa xác định', hasManager: false, avatar: null, role: 'Chưa xác định', isStep: true }],
        }];
      }
      return chainDepts.map((dept) => {
        const emp = dept.managerId ? empById(dept.managerId) : null;
        return {
          key: `${step.id || idx}-${dept.id}`,
          parallel: false,
          branches: [{
            key: `chain-${dept.id}`,
            badge: dept.code || 'Phòng ban',
            badgeTitle: dept.name || '',
            name: emp ? emp.name : 'Chưa có quản lý',
            hasManager: Boolean(emp),
            avatar: emp?.avatar,
            role: emp ? roleLabel(emp, 'Quản lý') : 'Chưa có quản lý',
            isStep: true,
          }],
        };
      });
    }

    // Chỉ định người / theo chức danh bộ phận
    let emp = null;
    if (idx === 0 && selectedApproverId) {
      emp = empById(selectedApproverId);
    }
    if (appType === 'specific_user' || appType === 'specific') {
      emp = empById(step.specificUserId || step.specificUser);
    } else if (appType === 'role' && step.role && !emp) {
      emp = employees?.find((e) => {
        if (e.role === step.role) return true;
        if (e.roles && Array.isArray(e.roles)) return e.roles.includes(step.role);
        return false;
      });
    }
    return [{
      key: step.id || idx,
      parallel: false,
      branches: [{
        key: `step-${step.id || idx}`,
        badge: `Cấp ${step.stepOrder}`,
        badgeTitle: `Bước ${step.stepOrder}`,
        name: emp ? emp.name : (step.name || 'Người duyệt'),
        hasManager: Boolean(emp),
        avatar: emp?.avatar,
        role: emp ? roleLabel(emp, step.roleName || step.role) : (step.roleName || step.role || 'Người duyệt'),
        isStep: true,
      }],
    }];
  });

  const chipW = isFull ? 'w-[260px]' : 'w-[220px]';

  const chip = (node) => {
    const parts = (node.name || 'QL').trim().split(' ');
    const initials = parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return (
      <div key={node.key} className={`flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface px-3 py-2 shadow-sm ${chipW}`}>
        <div className="relative flex-shrink-0">
          {node.hasManager ? (
            node.avatar ? (
              <img src={node.avatar} alt={node.name} className="w-9 h-9 rounded-full object-cover border border-outline-variant" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-[12px] flex items-center justify-center border border-blue-200">
                {initials}
              </div>
            )
          ) : (
            <div className="w-9 h-9 rounded-full bg-warning-container text-warning flex items-center justify-center border border-warning/20">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${node.hasManager ? 'bg-primary/10 text-primary' : 'bg-warning-container text-warning'}`}
              title={node.badgeTitle || node.badge}
            >
              <span className="material-symbols-outlined text-[11px]">{node.isStep ? 'account_tree' : 'apartment'}</span>
              {node.badge}
            </span>
            <span className="text-[12px] font-semibold text-on-surface truncate" title={node.name}>{node.name}</span>
          </div>
          <span className={`text-[10px] truncate font-medium ${node.hasManager ? 'text-secondary' : 'text-warning'}`} title={node.role}>{node.role}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-w-fit">
      {/* Người gửi */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2.5 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-2 shadow-sm">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Sender" className="w-9 h-9 rounded-full object-cover border border-primary/20" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-semibold text-[12px] flex items-center justify-center">{senderInitials}</div>
          )}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-on-surface">{currentUser?.name || 'Tôi'}</span>
            <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">Người gửi</span>
          </div>
        </div>
      </div>

      {/* Các tầng duyệt */}
      {stages.map((stage, si) => (
        <div key={stage.key} className="flex flex-col items-center">
          <div className="w-px h-5 bg-outline-variant" />

          {stage.parallel && stage.branches.length > 1 ? (
            <div className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">call_split</span>
                Bước {si + 1} (Cấp {si + 1}) · song song
              </span>
              <div className="w-px h-3 bg-outline-variant" />
              <div className="flex items-start">
                {stage.branches.map((node, bi) => (
                  <div key={node.key} className="flex flex-col items-center px-3">
                    <div className="flex w-full">
                      <div className={`h-px flex-1 ${bi === 0 ? 'bg-transparent' : 'bg-outline-variant'}`} />
                      <div className={`h-px flex-1 ${bi === stage.branches.length - 1 ? 'bg-transparent' : 'bg-outline-variant'}`} />
                    </div>
                    <div className="w-px h-3 bg-outline-variant" />
                    {chip(node)}
                  </div>
                ))}
              </div>
              <div className="w-px h-3 bg-outline-variant" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">account_tree</span>
                Bước {si + 1} (Cấp {si + 1})
              </span>
              <div className="w-px h-3 bg-outline-variant" />
              {chip(stage.branches[0])}
            </div>
          )}
        </div>
      ))}

      {/* Nối + Hoàn tất */}
      <div className="w-px h-5 bg-outline-variant" />
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-container/30 px-4 py-1.5 shadow-sm">
        <span className="material-symbols-outlined text-success text-[18px]">flag</span>
        <span className="text-[12px] font-semibold text-success">Hoàn tất</span>
      </div>
    </div>
  );
}