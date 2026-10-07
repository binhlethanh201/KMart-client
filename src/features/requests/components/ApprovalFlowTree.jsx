import { useMemo } from 'react';
import { ROLE_LABELS } from '../../../utils/roleLabels';
import { useI18n } from '../../../i18n/I18nProvider';
import { getFullAvatarUrl } from '../../hr/services/userService';

// BE-20: biểu đồ cây luồng phê duyệt dự kiến, tách riêng để tái sử dụng
// cho cả bản thu gọn (inline trong modal) và bản đầy đủ (popup toàn màn hình).
//
// variant: 'inline' (chip nhỏ) | 'full' (chip lớn hơn cho popup)
export default function ApprovalFlowTree({
  steps = [],
  resolvedSteps = null,
  departments = [],
  employees = [],
  currentUser,
  selectedApproverId,
  selectedApprover = null,
  departmentsSelected = [],
  variant = 'inline',
}) {
  const { t } = useI18n();
  const isFull = variant === 'full';

  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.stepOrder - b.stepOrder),
    [steps]
  );

  const senderInitials = (() => {
    const name = currentUser?.name || t('Tôi');
    const parts = name.trim().split(' ');
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  })();

  const ownDeptId = currentUser?.departmentId;
  const empById = (id) => employees?.find((e) => e.id === id);
  const roleLabel = (emp, fallback) => {
    if (!emp) return fallback || t('Người duyệt');
    if (emp.department && emp.position) return `${emp.department} - ${emp.position}`;
    if (emp.department) return emp.department;
    if (emp.position) return emp.position;
    const r = emp.role || (emp.roles && emp.roles[0]) || '';
    const code = String(typeof r === 'string' ? r : (r?.roleName || '')).toUpperCase();
    if (ROLE_LABELS[code]) return ROLE_LABELS[code];
    return code || fallback || t('Nhân viên');
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
          badge: dept?.code || t('Phòng ban'),
          badgeTitle: dept?.name || t('Phòng ban của người tạo'),
          name: emp ? emp.name : t('Chưa có quản lý'),
          hasManager: Boolean(emp),
          avatar: emp?.avatar,
          role: emp ? roleLabel(emp, 'Quản lý trực tiếp') : t('Chưa có quản lý'),
          isStep: true,
        }],
      }];
    }

    // Chuỗi quản lý liên tiếp: đi từ danh sách tùy chỉnh (chainList)
    if (appType === 'chain') {
      const HIERARCHY_OPTIONS = [
        'direct_manager',
        'deputy_head',
        'department_head',
        'store_manager',
        'branch_manager',
        'zone_manager',
        'division_director',
      ];
      const labels = {
        direct_manager: 'Quản lý trực tiếp',
        deputy_head: 'Phó phòng / Phó cửa hàng',
        department_head: 'Trưởng phòng',
        store_manager: 'Cửa hàng trưởng',
        branch_manager: 'Quản lý chi nhánh',
        zone_manager: 'Quản lý khu vực',
        division_director: 'Giám đốc khối',
      };
      
      const guessHierarchyApprover = (lvl, deptId) => {
        if (!deptId) return null;
        const dept = departments.find(d => d.id === deptId);
        if (!dept) return null;
        
        // Hàm xóa dấu tiếng Việt
        const removeAccents = (str) => {
          if (!str) return '';
          return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        };

        // Hàm tìm người kiêm nhiệm trong phòng (nếu không gán ManagerId)
        const findConcurrent = (targetDept, roles) => {
          if (!targetDept) return null;
          const searchRoles = roles.map(r => removeAccents(r));
          return employees?.find(e => {
            const posMatch = searchRoles.some(r => removeAccents(e.position).includes(r) || removeAccents(e.role) === r);
            if (e.departmentId === targetDept.id && posMatch) return true;
            
            if (Array.isArray(e.allPositions)) {
              return e.allPositions.some(p => p.departmentId === targetDept.id && searchRoles.some(r => removeAccents(p.positionName).includes(r)));
            }
            return false;
          }) || null;
        };

        // Hàm tìm global (áp dụng cho Giám đốc theo luật "trừ giám đốc ra")
        const findGlobal = (roles) => {
          const searchRoles = roles.map(r => removeAccents(r));
          return employees?.find(e => {
            if (searchRoles.some(r => removeAccents(e.position).includes(r) || removeAccents(e.role) === r)) return true;
            if (Array.isArray(e.allPositions)) {
              return e.allPositions.some(p => searchRoles.some(r => removeAccents(p.positionName).includes(r)));
            }
            return false;
          }) || null;
        };

        if (lvl === 'deputy_head') {
          return dept.deputyManagerId ? empById(dept.deputyManagerId) : findConcurrent(dept, ['phó', 'deputy']);
        }
        if (lvl === 'department_head' || lvl === 'store_manager' || lvl === 'direct_manager') {
          return dept.managerId ? empById(dept.managerId) : findConcurrent(dept, ['trưởng', 'quản lý', 'manager', 'head']);
        }
        if (lvl === 'branch_manager' || lvl === 'zone_manager') {
          const parent = dept.parentDepartmentId ? departments.find(d => d.id === dept.parentDepartmentId) : null;
          return (parent?.managerId ? empById(parent.managerId) : findConcurrent(parent, ['trưởng', 'quản lý', 'manager', 'director']))
              || findConcurrent(dept, ['giám đốc', 'director']);
        }
        if (lvl === 'division_director') {
          let top = dept;
          let guard = 0;
          while (top.parentDepartmentId && guard++ < 20) {
            const p = departments.find(d => d.id === top.parentDepartmentId);
            if (p) top = p; else break;
          }
          const directorRoles = ['giám đốc', 'director', 'ceo'];
          if (top && top.id !== dept.id) {
            return top.managerId ? empById(top.managerId) : (findConcurrent(top, ['giám đốc', 'director', 'ceo', 'quản lý']) || findGlobal(directorRoles));
          }
          return findConcurrent(dept, directorRoles) || findGlobal(directorRoles);
        }
        return null;
      };

      const guessRoleApprover = (roleName, targetDeptId) => {
        const roleCode = String(roleName).toUpperCase();
        return employees?.find((e) => {
          const hasRole = 
            String(e.role || '').toUpperCase() === roleCode ||
            String(e.position || '').toUpperCase() === roleCode ||
            (e.roles && Array.isArray(e.roles) && e.roles.some(r => String(r).toUpperCase() === roleCode)) ||
            (Array.isArray(e.secondary) && e.secondary.some(s => String(s.position || '').toUpperCase() === roleCode)) ||
            (Array.isArray(e.allPositions) && e.allPositions.some(p => String(p.position || p.name || '').toUpperCase() === roleCode)) ||
            (Array.isArray(e.systemRoles) && e.systemRoles.some(r => String(r?.roleName || r || '').toUpperCase() === roleCode));
          if (!hasRole) return false;
          // BE-48: Nếu đang dự đoán Role trong chuỗi duyệt, bắt buộc người đó phải kiêm nhiệm trong phòng ban đích
          if (targetDeptId) {
            if (e.departmentId === targetDeptId) return true;
            if (Array.isArray(e.allPositions) && e.allPositions.some(p => p.departmentId === targetDeptId)) return true;
            return false;
          }
          return true;
        }) || null;
      };

      const getApprover = (lvl) => {
        if (HIERARCHY_OPTIONS.includes(lvl)) {
          const predictedUser = guessHierarchyApprover(lvl, ownDeptId);
          return {
            predictedUser,
            badgeTitle: t(labels[lvl]),
          };
        } else {
          const predictedUser = guessRoleApprover(lvl, ownDeptId);
          const code = String(lvl).toUpperCase();
          const roleTitle = ROLE_LABELS[code] || lvl;
          return {
            predictedUser,
            badgeTitle: t(roleTitle),
          };
        }
      };
      
      const list = Array.isArray(step.chainList) && step.chainList.length > 0
          ? step.chainList
          : [];

      // Logic cũ cho fall-back (nếu không dùng chainList mà dùng dữ liệu cũ)
      if (list.length === 0) {
        const startIdx = HIERARCHY_OPTIONS.indexOf(step.chainStart || 'direct_manager');
        const endIdx = HIERARCHY_OPTIONS.indexOf(step.chainEnd || 'department_head');
        for (let i = Math.max(0, startIdx); i <= Math.max(0, endIdx); i++) {
          list.push(HIERARCHY_OPTIONS[i]);
        }
      }

      const chainLevels = [];
      list.forEach((lvl, index) => {
        const { predictedUser, badgeTitle } = getApprover(lvl);
        chainLevels.push({
          key: `${step.id || idx}-chain-${index}-${lvl}`,
          parallel: false,
          branches: [{
            key: `chain-${index}-${lvl}`,
            badge: t('Chuỗi quản lý'),
            badgeTitle: badgeTitle,
            name: predictedUser ? predictedUser.name : t('Chưa có quản lý'),
            hasManager: Boolean(predictedUser),
            avatar: predictedUser?.avatar,
            role: predictedUser ? roleLabel(predictedUser, badgeTitle) : badgeTitle,
            isStep: true,
          }],
        });
      });
      return chainLevels;
    }

    // Chỉ định người / theo chức danh bộ phận
    let emp = null;
    if (idx === 0 && selectedApproverId) {
      emp = empById(selectedApproverId);
    }
    
    // Tìm danh sách người được chỉ định trước (mảng ID)
    const designatedIds = Array.isArray(step.approverIds) && step.approverIds.length > 0 
      ? step.approverIds 
      : (Array.isArray(step.sequentialOrder) ? step.sequentialOrder : []);

    if (!emp && designatedIds.length > 0) {
      let users = designatedIds.map(id => empById(id)).filter(Boolean);

      // BE-48: Lọc và sắp xếp những người được chỉ định theo các phòng ban đích (nếu có)
      if (departmentsSelected && departmentsSelected.length > 0) {
        const orderedUsers = [];
        departmentsSelected.forEach(deptId => {
          const userInDept = users.find(u => 
            u.departmentId === deptId || 
            (Array.isArray(u.allPositions) && u.allPositions.some(p => p.departmentId === deptId)) ||
            (Array.isArray(u.secondary) && u.secondary.some(p => p.departmentId === deptId))
          );
          if (userInDept && !orderedUsers.includes(userInDept)) {
            orderedUsers.push(userInDept);
          }
        });
        users = orderedUsers;
      }

      if (users.length > 0) {
        if (step.multiRule === 'sequential') {
          // Trả về nhiều chặng nối tiếp nhau
          return users.map((u, ui) => ({
            key: `${step.id || idx}-seq-${ui}`,
            parallel: false,
            branches: [{
              key: `step-${step.id || idx}-seq-${ui}`,
              badge: t('Cấp {v0}.{v1}', { v0: step.stepOrder, v1: ui + 1 }),
              badgeTitle: t('Bước {v0} - Người thứ {v1}', { v0: step.stepOrder, v1: ui + 1 }),
              name: u.name,
              hasManager: true,
              avatar: u.avatar,
              role: roleLabel(u, step.roleName || step.role),
              isStep: true,
            }],
          }));
        } else {
          // Trả về 1 chặng song song với nhiều nhánh
          return [{
            key: step.id || idx,
            parallel: true,
            branches: users.map((u, ui) => ({
              key: `step-${step.id || idx}-par-${ui}`,
              badge: t('Cấp {v0}', { v0: step.stepOrder }),
              badgeTitle: t('Bước {v0} - Song song', { v0: step.stepOrder }),
              name: u.name,
              hasManager: true,
              avatar: u.avatar,
              role: roleLabel(u, step.roleName || step.role),
              isStep: true,
            })),
          }];
        }
      }
    }

    if (appType === 'specific_user' || appType === 'specific') {
      emp = empById(step.specificUserId || step.specificUser) || emp;
    } 

    if (appType === 'role' && step.role && !emp) {
      const roleCode = String(step.role).toUpperCase();
      
      const getRoleApproverInDept = (deptId) => {
        return employees?.find((e) => {
          if (!deptId) {
            const hasRole = 
              String(e.role || '').toUpperCase() === roleCode ||
              String(e.position || '').toUpperCase() === roleCode ||
              (e.roles && Array.isArray(e.roles) && e.roles.some(r => String(r).toUpperCase() === roleCode)) ||
              (Array.isArray(e.secondary) && e.secondary.some(s => String(s.position || '').toUpperCase() === roleCode)) ||
              (Array.isArray(e.allPositions) && e.allPositions.some(p => String(p.position || p.positionName || p.name || '').toUpperCase() === roleCode)) ||
              (Array.isArray(e.systemRoles) && e.systemRoles.some(r => String(r?.roleName || r || '').toUpperCase() === roleCode));
            return hasRole;
          }

          // Kiểm tra xem nhân sự có đúng vai trò/chức vụ tại chính phòng ban deptId này không
          const isPrimaryInDept = e.departmentId === deptId;
          const primaryRoleMatches = isPrimaryInDept && (
            String(e.role || '').toUpperCase() === roleCode ||
            String(e.position || '').toUpperCase() === roleCode ||
            (e.roles && Array.isArray(e.roles) && e.roles.some(r => String(r).toUpperCase() === roleCode)) ||
            (Array.isArray(e.systemRoles) && e.systemRoles.some(r => String(r?.roleName || r || '').toUpperCase() === roleCode))
          );
          if (primaryRoleMatches) return true;

          const hasPosInDept = Array.isArray(e.allPositions) && e.allPositions.some(p => 
            p.departmentId === deptId && String(p.position || p.positionName || p.name || '').toUpperCase() === roleCode
          );
          if (hasPosInDept) return true;

          const hasSecInDept = Array.isArray(e.secondary) && e.secondary.some(s => 
            s.departmentId === deptId && String(s.position || s.positionName || '').toUpperCase() === roleCode
          );
          if (hasSecInDept) return true;

          return false;
        });
      };

      if (departmentsSelected && departmentsSelected.length > 0) {
        const resolvedUsers = departmentsSelected.map(deptId => getRoleApproverInDept(deptId)).filter(Boolean);
        
        if (resolvedUsers.length > 0) {
          if (step.multiRule === 'sequential') {
            return resolvedUsers.map((u, ui) => ({
              key: `${step.id || idx}-seq-${ui}`,
              parallel: false,
              branches: [{
                key: `step-${step.id || idx}-seq-${ui}`,
                badge: t('Cấp {v0}.{v1}', { v0: step.stepOrder, v1: ui + 1 }),
                badgeTitle: t('Bước {v0} - Người thứ {v1}', { v0: step.stepOrder, v1: ui + 1 }),
                name: u.name,
                hasManager: true,
                avatar: u.avatar,
                role: roleLabel(u, step.roleName || step.role),
                isStep: true,
              }],
            }));
          } else {
            return [{
              key: step.id || idx,
              parallel: true,
              branches: resolvedUsers.map((u, ui) => ({
                key: `step-${step.id || idx}-par-${ui}`,
                badge: t('Cấp {v0}', { v0: step.stepOrder }),
                badgeTitle: t('Bước {v0} - Song song', { v0: step.stepOrder }),
                name: u.name,
                hasManager: true,
                avatar: u.avatar,
                role: roleLabel(u, step.roleName || step.role),
                isStep: true,
              })),
            }];
          }
        }
      }
      // Fallback
      emp = getRoleApproverInDept(null) || emp;
    }

    return [{
      key: step.id || idx,
      parallel: false,
      branches: [{
        key: `step-${step.id || idx}`,
        badge: t('Cấp {v0}', { v0: step.stepOrder }),
        badgeTitle: t('Bước {v0}', { v0: step.stepOrder }),
        name: emp ? emp.name : (step.name || 'Người duyệt'),
        hasManager: Boolean(emp),
        avatar: emp?.avatar,
        role: emp ? roleLabel(emp, step.roleName || step.role) : (step.roleName || step.role || 'Người duyệt'),
        isStep: true,
      }],
    }];
  });

  /**
   * BE-50: nếu backend đã trả về luồng ĐÃ PHÂN GIẢI (đúng người duyệt thật theo sơ đồ tổ chức)
   * thì dùng thẳng dữ liệu đó. Trước đây cây luồng tự "đoán" người duyệt ở client nên hiển thị
   * sai: có cả chính người gửi, gộp/tách bước không đúng với cấu hình.
   */
  const flowStages = useMemo(() => {
    if (!Array.isArray(resolvedSteps) || resolvedSteps.length === 0) return stages;

    const makeBranch = (stepNo, u, ui) => ({
      key: `resolved-${stepNo}-${u.id || ui}`,
      name: u.fullName || t('Người duyệt'),
      hasManager: true,
      avatar: getFullAvatarUrl(u.avatarUrl) || u.avatarUrl,
      role: [u.departmentName, u.positionName].filter(Boolean).join(' - ') || t('Người duyệt'),
      isStep: true,
      // BE-146: người được ủy quyền duyệt thay — ghi rõ duyệt thay cho ai
      onBehalfOfName: u.isDelegate ? (u.onBehalfOfName || null) : null,
    });

    const missingBranch = (stepNo) => ({
      key: `resolved-${stepNo}-none`,
      name: t('Chưa xác định được người duyệt'),
      hasManager: false,
      role: t('Cần bổ sung trưởng phòng / người duyệt cho bước này'),
      isStep: true,
    });

    const out = [];
    let levelNo = 0;

    [...resolvedSteps]
      .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
      .forEach((s, i) => {
        const stepNo = s.stepOrder ?? i + 1;
        const people = Array.isArray(s.approvers) ? s.approvers : [];
        const branches = people.length > 0
          ? people.map((u, ui) => makeBranch(stepNo, u, ui))
          : [missingBranch(stepNo)];

        // BE-95: quy tắc "Duyệt lần lượt" (multiRule = sequential) — mỗi người duyệt là MỘT CẤP
        // riêng, theo đúng thứ tự đã cấu hình. Trước đây cả bước chỉ vẽ người đầu tiên
        // (branches[0]) nên các cấp duyệt phía sau bị ẩn khỏi sơ đồ.
        const isSequential = String(s.multiRule || '').toLowerCase() === 'sequential';
        const levels = isSequential && branches.length > 1
          ? branches.map((b) => [b])
          : [branches];

        levels.forEach((levelBranches) => {
          levelNo += 1;
          const badge = t('Cấp {v0}', { v0: levelNo });
          const badgeTitle = t('Bước {v0}', { v0: stepNo });
          out.push({
            key: levelBranches.length === 1 ? levelBranches[0].key : `resolved-${stepNo}`,
            stepNo,
            levelNo,
            parallel: levelBranches.length > 1,
            branches: levelBranches.map((b) => ({ ...b, badge, badgeTitle })),
          });
        });
      });

    return out;
  }, [resolvedSteps, stages, t]);

  /*
   * WF-07: người duyệt BƯỚC 1 do người dùng CHỈ ĐỊNH trong form ("Người duyệt (chỉ định)")
   * phải hiện đúng tên ở cấp duyệt đầu tiên trong MỌI dạng luồng: luồng hierarchy/chain
   * return sớm không qua đoạn nhận selectedApproverId, còn luồng máy chủ phân giải thì
   * endpoint preview không nhận tham số người chỉ định. Ghi đè tại đây (sau flowStages)
   * để cả sơ đồ lẫn chuỗi "Đường đi của đơn" đều hiện tên người được chọn.
   */
  const displayStages = useMemo(() => {
    const designatedId = selectedApproverId || (selectedApprover && selectedApprover.id) || '';
    if (!designatedId || !Array.isArray(flowStages) || flowStages.length === 0) return flowStages;
    const emp = empById(designatedId)
      || (selectedApprover && selectedApprover.id === designatedId ? selectedApprover : null);
    if (!emp) return flowStages;
    const [first, ...rest] = flowStages;
    const oldBadge = first.branches?.[0]?.badge;
    const oldBadgeTitle = first.branches?.[0]?.badgeTitle;
    const overridden = {
      ...first,
      parallel: false,
      branches: [{
        key: `selected-${designatedId}`,
        name: emp.name,
        hasManager: true,
        avatar: emp.avatar,
        role: roleLabel(emp),
        isStep: true,
        badge: oldBadge,
        badgeTitle: oldBadgeTitle,
      }],
    };
    return [overridden, ...rest];
  }, [flowStages, selectedApproverId, selectedApprover, employees]);

  // Chuỗi "từ ai ➔ đến ai" để đọc nhanh toàn bộ luồng (chỉ hiện ở bản đầy đủ).
  const chainPath = useMemo(() => {
    const people = [];
    displayStages.forEach((stage) => {
      const names = stage.branches
        .filter((b) => b.hasManager)
        .map((b) => b.name)
        .filter(Boolean);
      if (names.length === 0) return;
      people.push({
        key: stage.key,
        // BE-95: "Cấp" là số thứ tự cấp duyệt (bước "Duyệt lần lượt" có nhiều cấp trong cùng 1 bước)
        stepNo: stage.levelNo ?? stage.stepNo,
        label: names.join(' / '),
      });
    });
    return people;
  }, [displayStages]);

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
          {/* BE-146: nhãn "duyệt thay cho ..." khi người này nhận ủy quyền */}
          {node.onBehalfOfName && (
            <span
              className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-px rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide w-fit max-w-full"
              title={t('Người được ủy quyền duyệt thay cho {v0}', { v0: node.onBehalfOfName })}
            >
              <span className="material-symbols-outlined text-[10px]">assignment_ind</span>
              <span className="truncate">{t('Duyệt thay cho')} {node.onBehalfOfName}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    /* BE-83/85: bản `full` (popup) không được để cây rộng hơn khung chứa làm nó tràn ra ngoài.
       Hàng người duyệt cùng cấp giữ nguyên MỘT DÒNG (không xuống dòng) để thấy rõ họ ngang cấp nhau;
       khi hàng đó rộng hơn khung thì khung tự cuộn ngang, và cả cây được căn giữa trong vùng cuộn.
       Bản `inline` (chip nhỏ trong form) vẫn giữ `min-w-fit` vì đã nằm trong khung tự cuộn ngang. */
    <div className={`flex flex-col items-center ${isFull ? 'w-max min-w-full' : 'min-w-fit'}`}>
      {/* BE-50: chuỗi "từ ai ➔ đến ai" — đọc nhanh toàn bộ luồng duyệt */}
      {isFull && chainPath.length > 0 && (
        <div className="mb-5 w-full max-w-[900px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <span className="material-symbols-outlined text-[15px]">route</span>
            {t('Đường đi của đơn')}
          </span>
          <span className="text-[12px] font-semibold text-on-surface">{currentUser?.name || t('Tôi')}</span>
          {chainPath.map((p) => (
            <span key={p.key} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase text-secondary">{t('Cấp')} {p.stepNo}</span>
                <span className="text-[12px] font-semibold text-on-surface">{p.label}</span>
              </span>
            </span>
          ))}
          <span className="material-symbols-outlined text-success text-[16px]">arrow_forward</span>
          <span className="text-[12px] font-semibold text-success">{t('Hoàn tất')}</span>
        </div>
      )}

      {/* Người gửi */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2.5 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-2 shadow-sm">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Sender" className="w-9 h-9 rounded-full object-cover border border-primary/20" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-semibold text-[12px] flex items-center justify-center">{senderInitials}</div>
          )}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-on-surface">{currentUser?.name || t('Tôi')}</span>
            <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">{t('Người gửi')}</span>
          </div>
        </div>
      </div>

      {/* Các tầng duyệt — có mũi tên chỉ hướng đi giữa các bước */}
      {displayStages.map((stage, si) => (
        <div key={stage.key} className="flex flex-col items-center">
          <div className="flex flex-col items-center" title={t('Chuyển tiếp sang bước sau')}>
            <div className="w-px h-3 bg-outline-variant" />
            <span className="material-symbols-outlined text-primary text-[18px] leading-none">arrow_downward</span>
            <div className="w-px h-2 bg-outline-variant" />
          </div>

          {stage.parallel && stage.branches.length > 1 ? (
            <div className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">call_split</span>
                {t('Bước')} {stage.stepNo ?? si + 1} {t('(Cấp')} {stage.levelNo ?? stage.stepNo ?? si + 1}) · song song
              </span>
              <div className="w-px h-3 bg-outline-variant" />
              {/* BE-85: những người duyệt CÙNG CẤP phải nằm CÙNG MỘT DÒNG.
                  Nếu cho xuống dòng thì 2 người dòng trên + 1 người dòng dưới trông như khác cấp.
                  Cả hàng rộng hơn khung thì để khung cuộn ngang (xem CreateRequestModal) chứ không cắt. */}
              <div className="flex items-start justify-center">
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
                {t('Bước')} {stage.stepNo ?? si + 1} {t('(Cấp')} {stage.levelNo ?? stage.stepNo ?? si + 1})
              </span>
              <div className="w-px h-3 bg-outline-variant" />
              {chip(stage.branches[0])}
            </div>
          )}
        </div>
      ))}

      {/* Nối + Hoàn tất */}
      <div className="flex flex-col items-center">
        <div className="w-px h-3 bg-outline-variant" />
        <span className="material-symbols-outlined text-success text-[18px] leading-none">arrow_downward</span>
        <div className="w-px h-2 bg-outline-variant" />
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-container/30 px-4 py-1.5 shadow-sm">
        <span className="material-symbols-outlined text-success text-[18px]">flag</span>
        <span className="text-[12px] font-semibold text-success">{t('Hoàn tất')}</span>
      </div>
    </div>
  );
}