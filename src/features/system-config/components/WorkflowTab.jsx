import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { APPROVAL_TYPES, MULTI_RULES, CONDITION_FIELDS, CONDITION_OPS, TIME_RULES } from '../data/mockData';
import { useHr } from '../../hr/context/HrProvider';
import { useApproval } from '../../../context/useApproval';
import { documentTypeService } from '../../../services/documentTypeService';
import { workflowService } from '../services/workflowService';
import { roleService } from '../../hr/services/roleService';
import { roleLabel } from '../../../utils/roleLabels';
import { useI18n, translate } from '../../../i18n/I18nProvider';

const selectCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer';

// Cấp bậc duyệt — `group` chỉ dùng để gom nhóm trong dropdown (optgroup)
const HIERARCHY_OPTIONS = [
  { id: 'direct_manager', label: 'Quản lý trực tiếp', group: 'Cấp trực tiếp' },
  { id: 'deputy_head', label: 'Phó phòng / Phó cửa hàng', group: 'Trong đơn vị' },
  { id: 'department_head', label: 'Trưởng phòng', group: 'Trong đơn vị' },
  { id: 'store_manager', label: 'Cửa hàng trưởng', group: 'Trong đơn vị' },
  { id: 'branch_manager', label: 'Quản lý chi nhánh', group: 'Cấp trên' },
  { id: 'zone_manager', label: 'Quản lý khu vực', group: 'Cấp trên' },
  { id: 'division_director', label: 'Giám đốc khối / Ban giám đốc', group: 'Cấp trên' },
];

// Nhóm cấp bậc theo khối để hiển thị trong dropdown
const HIERARCHY_GROUPS = ['Cấp trực tiếp', 'Trong đơn vị', 'Cấp trên'];

// Các khối luồng (track) — tách setup riêng, "common" merge cho cả HQ & Retail
const BLOCK_OPTIONS = [
  { id: 'hq', label: 'Khối Văn phòng', icon: 'apartment' },
  { id: 'retail', label: 'Khối Cửa hàng', icon: 'storefront' },
  { id: 'common', label: 'Dùng chung', icon: 'merge' },
];

const BLOCK_IDS = BLOCK_OPTIONS.map((b) => b.id);

// Nhãn ngắn để chú thích "đã cấu hình ở khối nào" trong dropdown chọn loại đơn.
const BLOCK_LABELS = BLOCK_OPTIONS.reduce((acc, b) => { acc[b.id] = b.label; return acc; }, {});

// Nhắc nhở khi một khối chưa có bước duyệt: nhân viên thuộc khối đó sẽ KHÔNG tạo được
// đơn của loại đơn này (backend chặn vì không tìm thấy luồng duyệt nào áp dụng được).
const BLOCK_MISSING_HINTS = {
  hq: 'Chưa cấu hình luồng cho Khối Văn phòng. Nhân viên khối Văn phòng sẽ KHÔNG tạo được đơn loại này. Bấm "Thêm bước duyệt tiếp theo" rồi "Lưu cấu hình luồng duyệt".',
  retail: 'Chưa cấu hình luồng cho Khối Cửa hàng. Nhân viên Siêu thị / Cửa hàng sẽ KHÔNG tạo được đơn loại này. Bấm "Thêm bước duyệt tiếp theo" rồi "Lưu cấu hình luồng duyệt".',
  common: 'Chưa có luồng Dùng chung. Khối nào chưa có luồng riêng (Văn phòng hoặc Cửa hàng) sẽ KHÔNG tạo được đơn loại này. Bấm "Thêm bước duyệt tiếp theo" rồi "Lưu cấu hình luồng duyệt".',
};

const APPROVAL_LABELS = APPROVAL_TYPES.reduce((acc, t) => { acc[t.id] = t.label; return acc; }, {});

// Tóm tắt hình thức duyệt cho trạng thái thu gọn
function approvalSummary(step, employees = []) {
  switch (step.approvalType) {
    case 'hierarchy': {
      const opt = HIERARCHY_OPTIONS.find((o) => o.id === step.hierarchyOption);
      return `${translate(APPROVAL_LABELS.hierarchy)}${opt ? ` · ${translate(opt.label)}` : ''}`;
    }
    case 'chain':
      return translate(APPROVAL_LABELS.chain);
    case 'role': {
      if (step.arrangementMode === 'role') {
        return translate('Duyệt theo chức danh{v0}', { v0: step.role ? ` · ${translate(step.role)}` : '' });
      }
      const n = stepApproverIds(step).length;
      return translate('Duyệt theo sắp xếp{v0}', { v0: n ? ` · ${n} người` : '' });
    }
    case 'specific':
    case 'specific_user': {
      const userId = step.specificUser || step.specificUserId;
      const emp = employees.find((e) => e.id === userId);
      return translate('Chọn 1 người cụ thể{v0}', { v0: emp ? ` · ${emp.name}` : userId ? ` · ${userId.substring(0, 6)}...` : '' });
    }
    default:
      return translate('Chưa cấu hình');
  }
}

/**
 * BE-95: danh sách người duyệt của một bước là MỘT nguồn duy nhất.
 *
 * `approvers` (từ popup cấu hình) và `sequentialOrder` (kéo-thả/thêm/xoá trong danh sách) trước
 * đây là 2 trường tách rời: danh sách sửa `sequentialOrder` còn số lượng hiển thị lấy từ
 * `approvers`, nên thêm/bỏ người trong danh sách không làm số lượng thay đổi theo.
 */
function stepApproverIds(step) {
  if (!step) return [];
  if (Array.isArray(step.sequentialOrder) && step.sequentialOrder.length > 0) return step.sequentialOrder;
  if (Array.isArray(step.approvers)) return step.approvers;
  return [];
}

function SequentialOrderList({ role, order, onChange, isSequential = true }) {
  const { t } = useI18n();
  const { employees: EMPLOYEES } = useHr();
  const currentIds = useMemo(() => {
    if (Array.isArray(order)) return order;
    return EMPLOYEES.filter((e) => e.role === role || e.position === role).map((e) => e.id);
  }, [role, order]);

  const displayList = useMemo(() => {
    return currentIds.map((id) => EMPLOYEES.find((e) => e.id === id)).filter(Boolean);
  }, [currentIds]);

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    const newOrder = [...currentIds];
    const [movedItem] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(dropIdx, 0, movedItem);
    onChange(newOrder);
    setDraggedIdx(null);
  };

  const removeUser = (idx) => {
    const newOrder = [...currentIds];
    newOrder.splice(idx, 1);
    onChange(newOrder);
  };

  const addSpecificUser = (id) => {
    onChange([...currentIds, id]);
    setShowAdd(false);
    setSearchQuery('');
  };

  const availableToAdd = EMPLOYEES.filter((e) => !currentIds.includes(e.id));
  const filteredToAdd = availableToAdd.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-3 bg-surface-container-lowest border border-outline-variant rounded-md p-3">
      <div className="text-xs font-semibold text-on-surface mb-3 flex items-center justify-between">
        <span>{isSequential ? t('Danh sách người duyệt tuần tự') : t('Danh sách người duyệt')}</span>
        <span className="text-[10px] text-secondary font-normal px-2 py-0.5 bg-surface-container rounded-full">
          {displayList.length} {t('nhân sự')}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {displayList.length === 0 && (
          <div className="text-xs text-secondary italic py-2">{t('Chưa có người duyệt nào.')}</div>
        )}
        {displayList.map((emp, idx) => (
          <div
            key={emp.id}
            draggable={isSequential}
            onDragStart={(e) => isSequential && handleDragStart(e, idx)}
            onDragOver={(e) => isSequential && e.preventDefault()}
            onDrop={(e) => isSequential && handleDrop(e, idx)}
            className={`flex items-center justify-between bg-surface border rounded p-2 shadow-sm transition-all ${
                draggedIdx === idx
                ? 'opacity-50 border-primary border-dashed'
                : isSequential 
                  ? 'border-outline-variant hover:border-outline cursor-grab active:cursor-grabbing'
                  : 'border-outline-variant'
              }`}
          >
            <div className="flex items-center gap-2 pointer-events-none min-w-0">
              {isSequential && <span className="material-symbols-outlined text-outline text-[18px] flex-shrink-0">drag_indicator</span>}
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-full object-cover ml-1 flex-shrink-0" />
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-on-surface font-medium truncate">{emp.name}</span>                  {emp.position && (
                    <span className="text-[10px] font-semibold text-primary bg-primary-container/40 border border-primary/20 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {t(emp.position)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-secondary truncate">
                  <span className="truncate">({emp.id.substring(0, 8).toUpperCase()}){emp.department ? ` · ${t(emp.department)}` : ''}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => removeUser(idx)}
              className="text-outline hover:text-error hover:bg-error-container/30 p-1 rounded transition-colors cursor-pointer"
              title={t('Loại bỏ')}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}

        {/* Searchable Add User Dropdown */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary-container/30 w-fit px-2 py-1.5 rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {t('Thêm người duyệt')}
          </button>
        ) : (
          <div className="mt-1 bg-surface border border-outline-variant rounded-md shadow-lg overflow-hidden flex flex-col relative z-10 w-full sm:w-80">
            <div className="p-2 border-b border-outline-variant/50 flex items-center gap-2 bg-surface-container-lowest">
              <span className="material-symbols-outlined text-secondary text-[16px]">search</span>
              <input
                type="text"
                autoFocus
                placeholder={t('Tìm tên hoặc mã nhân sự...')}
                className="flex-1 bg-transparent text-xs text-on-surface outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => {
                  setShowAdd(false);
                  setSearchQuery('');
                }}
                className="text-secondary hover:text-error p-0.5 rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="max-h-[180px] overflow-y-auto p-1.5 flex flex-col gap-1">
              {filteredToAdd.length === 0 ? (
                <div className="text-xs text-secondary text-center py-4 italic">{t('Không tìm thấy nhân sự nào')}</div>
              ) : (
                filteredToAdd.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => addSpecificUser(e.id)}
                    className="flex items-center gap-2.5 p-2 hover:bg-surface-container-low rounded text-left transition-colors cursor-pointer"
                  >
                    <img
                      src={e.avatar}
                      alt={e.name}
                      className="w-7 h-7 rounded-full object-cover border border-outline-variant/50"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-on-surface truncate">{e.name}</span>
                        {e.position && (
                          <span className="text-[10px] font-semibold text-primary bg-primary-container/40 border border-primary/20 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            {t(e.position)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-secondary truncate">
                        {e.id.substring(0, 8).toUpperCase()}{e.department ? ` • ${t(e.department)}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserSelect({ value, onChange }) {
  const { t } = useI18n();
  const { employees: EMPLOYEES } = useHr();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmp = EMPLOYEES.find((e) => e.name === value || e.id === value);
  const filtered = EMPLOYEES.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative w-full max-w-md ${isOpen ? 'z-50' : 'z-10'}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2">
            <img src={selectedEmp.avatar} alt={selectedEmp.name} className="w-6 h-6 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-on-surface leading-tight">{selectedEmp.name}</span>
              <span className="text-[10px] text-secondary leading-tight">
                {selectedEmp.id.substring(0, 8).toUpperCase()} - {selectedEmp.role}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-secondary">{t('Chọn nhân sự...')}</span>
        )}
        <span className="material-symbols-outlined text-outline">expand_more</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-md shadow-lg z-50 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-outline-variant/50 flex items-center gap-2 bg-surface-container-lowest">
              <span className="material-symbols-outlined text-secondary text-[16px]">search</span>
              <input
                type="text"
                autoFocus
                placeholder={t('Tìm tên hoặc mã nhân sự...')}
                className="flex-1 bg-transparent text-xs text-on-surface outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1.5 flex flex-col gap-1 relative z-50">
              {filtered.length === 0 ? (
                <div className="text-xs text-secondary text-center py-4 italic">{t('Không tìm thấy nhân sự')}</div>
              ) : (
                filtered.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onChange(e.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded text-left transition-colors cursor-pointer relative z-50 ${value === e.name ? 'bg-primary-container/40' : 'hover:bg-surface-container-low'
                      }`}
                  >
                    <img
                      src={e.avatar}
                      alt={e.name}
                      className="w-7 h-7 rounded-full object-cover border border-outline-variant/50"
                    />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${value === e.name ? 'text-primary' : 'text-on-surface'}`}>
                        {e.name}
                      </div>
                      <div className="text-[10px] text-secondary truncate">
                        {e.id.substring(0, 8).toUpperCase()} • {e.role}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Popup cấu hình nâng cao — tích chọn người tham gia bước duyệt
function AdvancedApproverModal({ step, approvalRoles, onConfirm, onClose }) {
  const { t } = useI18n();
  const { employees: EMPLOYEES } = useHr();
  
  const [selected, setSelected] = useState(() => new Set(Array.isArray(step.approvers) ? step.approvers : []));
  /**
   * BE-95: quy tắc "Duyệt lần lượt" phải có danh sách người duyệt cụ thể theo thứ tự nên KHÔNG
   * cho chọn "Để người tạo đơn quyết định" (chỉ bỏ ở quy tắc này; 2 quy tắc đồng thời vẫn giữ).
   */
  const roleModeAllowed = step.multiRule !== 'sequential';
  const [arrangementMode, setArrangementMode] = useState(() => {
    const initial = step.arrangementMode || (step.role ? 'role' : 'specific');
    return !roleModeAllowed && initial === 'role' ? 'specific' : initial;
  });
  const [role, setRole] = useState(step.role || '');
  
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [pos, setPos] = useState('all');

  const departments = useMemo(
    () => Array.from(new Set(EMPLOYEES.map((e) => e.department).filter(Boolean))).sort(),
    []
  );
  
  const positions = useMemo(
    () => Array.from(new Set(EMPLOYEES.map((e) => e.position).filter(Boolean))).sort(),
    []
  );

  const filtered = useMemo(
    () =>
      EMPLOYEES.filter((e) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.position || '').toLowerCase().includes(q);
        const matchDept = dept === 'all' || e.department === dept;
        const matchPos = pos === 'all' || e.position === pos;
        return matchSearch && matchDept && matchPos;
      }),
    [search, dept, pos]
  );

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => setSelected((cur) => new Set([...cur, ...filtered.map((e) => e.id)]));
  const clearAll = () => setSelected(new Set());

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg shadow-xl w-full max-w-3xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary">tune</span>
            <div>
              <h2 className="font-label-md text-on-surface font-semibold">{t('Cấu hình nâng cao — chọn người duyệt')}</h2>
              {arrangementMode === 'specific' && (
                <p className="text-xs text-secondary">
                  {t('Đã chọn')} <span className="font-medium text-primary">{selected.size}</span> {t('người tham gia duyệt')}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-surface-container-low border-b border-outline-variant/50">
          {!roleModeAllowed && (
            <div className="flex items-start gap-2 text-[12px] rounded-md border border-outline-variant bg-surface px-3 py-2">
              <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0 mt-px">format_list_numbered</span>
              <span className="text-secondary">
                {t('Quy tắc "Duyệt lần lượt" cần danh sách người duyệt cụ thể theo thứ tự — hãy tích chọn người duyệt bên dưới.')}
              </span>
            </div>
          )}
          {roleModeAllowed && (
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              checked={arrangementMode === 'role'}
              onChange={() => setArrangementMode('role')}
              className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                {t('Để người tạo đơn quyết định')} <span className="font-normal text-secondary">({t('theo chức danh / phòng ban')})</span>
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t('Ví dụ: Chọn Trưởng phòng, khi tạo đơn người dùng sẽ chọn Phòng ban để luồng gửi tới Trưởng phòng của phòng đó.')}
              </div>
              {arrangementMode === 'role' && (
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`${selectCls} bg-surface w-full max-w-sm`}
                  >
                    <option value="" disabled>-- {t('Chọn chức vụ')} --</option>
                    {positions.map((p) => (
                      <option key={p} value={p}>
                        {t(p)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </label>
          )}

          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              checked={arrangementMode === 'specific'}
              onChange={() => setArrangementMode('specific')}
              className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                {t('Chỉ định cụ thể người duyệt')}
              </div>
              <div className="text-[11px] text-secondary mt-0.5">
                {t('Cố định sẵn những người sẽ duyệt bước này.')}
              </div>
            </div>
          </label>
        </div>

        {/* Bộ lọc và Danh sách chỉ hiện khi chọn specific */}
        {arrangementMode === 'specific' && (
          <>
            {/* Bộ lọc */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-outline-variant/30 bg-surface-container-lowest">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px] bg-surface border border-outline-variant rounded-md px-2.5 py-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Tìm theo tên / mã / chức vụ...')}
                  className="flex-1 bg-transparent text-sm text-on-surface outline-none"
                />
              </div>
              <select
                className={`${selectCls} max-w-[150px]`}
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
                <option value="all">{t('Phòng ban')}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className={`${selectCls} max-w-[150px]`}
                value={pos}
                onChange={(e) => setPos(e.target.value)}
              >
                <option value="all">{t('Chức vụ')}</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-xs text-primary hover:bg-primary-container/30 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
              >
                {t('Chọn tất cả')}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-secondary hover:text-error hover:bg-error-container/30 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
              >
                {t('Bỏ chọn')}
              </button>
            </div>

            {/* Danh sách nhân sự */}
            <div className="overflow-y-auto max-h-[55vh] p-3 flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="text-sm text-secondary text-center py-8 italic">{t('Không tìm thấy nhân sự nào.')}</div>
          ) : (
            filtered.map((e) => {
              const isSel = selected.has(e.id);
              return (
                <div
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${isSel ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggle(e.id)}
                    onClick={(e2) => e2.stopPropagation()}
                    className="mt-1 text-primary focus:ring-primary rounded cursor-pointer"
                  />
                  <img src={e.avatar} alt={e.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface truncate">{e.name}</span>
                      <span className="text-[10px] text-secondary">({e.id.substring(0, 8).toUpperCase()})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-secondary mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">apartment</span>
                        {t(e.department)}
                      </span>
                      <span className="text-outline-variant">·</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">work</span>
                        {t(e.position)}
                      </span>
                      <span className="text-outline-variant">·</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">shield_person</span>
                        {e.role}
                      </span>
                    </div>
                    {/* Vị trí kiêm nhiệm — style theo module Nhân sự */}
                    {e.secondary && e.secondary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] text-secondary uppercase tracking-wider">{t('Kiêm nhiệm:')}</span>
                        {e.secondary.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/50 rounded px-1.5 py-0.5"
                          >
                            <span className="material-symbols-outlined text-[12px] text-primary">badge</span>
                            <span className="text-[11px] font-medium text-on-surface">{t(s.department)}</span>
                            <span className="text-[11px] text-secondary">· {t(s.position)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Đóng thẻ if specific */}
          </>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-outline-variant/30 bg-surface-container-lowest mt-auto">
          <span className="text-xs text-secondary">
            {arrangementMode === 'specific' ? t('Mẹo: người được tích sẽ tham gia bước duyệt này, ghi đè danh sách tự khớp theo vai trò.') : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-secondary hover:text-on-surface border border-outline-variant hover:bg-surface-container-low px-4 py-2 rounded-md transition-colors cursor-pointer"
            >
              {t('Huỷ')}
            </button>
            <button
              type="button"
              onClick={() => onConfirm({
                arrangementMode,
                role: arrangementMode === 'role' ? role : '',
                approvers: arrangementMode === 'specific' ? Array.from(selected) : [],
              })}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              {t('Xác nhận')} {arrangementMode === 'specific' && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RadioCard({ checked, onClick, title, desc, badge, name }) {
  return (
    <label
      className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors flex-1 ${checked ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:bg-surface-container-low'
        }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onClick}
        className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-medium ${checked ? 'text-primary' : 'text-on-surface'}`}>{title}</span>
          {badge && (
            <span className="text-[10px] font-mono text-primary bg-primary-container/40 border border-primary/20 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {desc && <div className="text-xs text-secondary mt-0.5">{desc}</div>}
      </div>
    </label>
  );
}

// Tiêu đề nhóm cấu hình kèm icon
function GroupHeader({ icon, label, hint }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
      <span className="text-sm font-semibold text-on-surface">{label}</span>
      {hint && <span className="text-[11px] text-secondary ml-auto">{hint}</span>}
    </div>
  );
}

function makeStep(overrides = {}, roles = [], employees = []) {
  const defaultRole = roles.length > 0 ? (typeof roles[0] === 'string' ? roles[0] : roles[0]?.name || '') : '';
  const defaultSpecificUser = employees.length > 0 ? employees[0]?.id : null;
  return {
    id: `s${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    // Tên mặc định của bước là DỮ LIỆU người dùng sửa được, nhưng lúc tạo mới thì nên là tiếng của
    // ngôn ngữ đang dùng — trước đây hardcode tiếng Việt nên chế độ EN/KO hiện "Bước duyệt mới".
    name: translate('Bước duyệt mới'),
    approvalType: 'hierarchy',
    hierarchyOption: 'department_head',
    chainStart: 'direct_manager',
    chainEnd: 'department_head',
    chainList: ['direct_manager', 'department_head'],
    role: defaultRole,
    specificUser: defaultSpecificUser,
    multiRule: null,
    scope: 'auto',
    condition: null,
    approvers: null,
    timeoutEnabled: true,
    // BE-50: giao diện luôn hiển thị "12 giờ" khi bật xử lý quá hạn, nhưng giá trị đó chỉ là
    // fallback lúc render nên KHÔNG được lưu -> phải khởi tạo thật để cấu hình đúng như đang thấy.
    maxDurationHours: 12,
    timeoutMode: 'continuous',
    timeoutAction: 'return',
    rejectReasonRequired: true,
    ...overrides,
  };
}

function CustomGroupedSelect({ categories, documentTypes, value, onChange, configuredTypes = new Set(), blockStatusOf }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => 
    categories.reduce((acc, cat) => ({...acc, [cat.id]: true}), {})
  );
  
  const toggleGroup = (id) => setExpandedGroups(prev => ({...prev, [id]: !prev[id]}));

  const selectedDoc = documentTypes.find(d => d.id === value);
  const statusOf = (docId) => (blockStatusOf ? blockStatusOf(docId) : { configuredHere: false, otherBlocks: [], blocked: false });
  const statusOfSelected = statusOf(value);
  // Chú thích loại đơn đang chọn đã được cấu hình ở khối nào
  const selectedNote = statusOfSelected.otherBlocks.length > 0
    ? t('Đã cấu hình ở {v0}', { v0: statusOfSelected.otherBlocks.map((b) => t(BLOCK_LABELS[b])).join(', ') })
    : null;

  return (
    <div className="relative w-full min-w-[280px] max-w-[320px] z-[50]">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-md px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <span className="text-sm text-on-surface font-semibold truncate">
            {selectedDoc ? t(selectedDoc.name) : t('Chọn loại đơn...')}
          </span>
          {selectedDoc && configuredTypes.has(selectedDoc.id) && (
            <span className="material-symbols-outlined text-[16px] text-success flex-shrink-0" title={t('Đã cấu hình luồng cho khối này')}>check_circle</span>
          )}
          {selectedNote && (
            <span className="text-[11px] text-secondary truncate" title={selectedNote}>{selectedNote}</span>
          )}
        </div>
        <span className={`material-symbols-outlined text-secondary group-hover:text-primary text-[20px] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+6px)] left-0 min-w-full w-max max-w-[400px] bg-surface rounded-lg shadow-xl border border-outline-variant z-50 overflow-hidden animate-fade-in origin-top flex flex-col">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar w-full pb-1">
              {categories.map((cat, idx) => {
                const catDocs = documentTypes.filter(dt => cat.items.includes(dt.name));
                if (catDocs.length === 0) return null;
                
                const isExpanded = expandedGroups[cat.id] !== false;
                
                return (
                  <div key={cat.id} className="mb-1 last:mb-0">
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleGroup(cat.id); }}
                      className={`px-3 py-2 bg-surface-container-low/90 text-[11px] font-bold text-primary uppercase tracking-wider sticky top-0 backdrop-blur-md flex items-center justify-between z-10 border-b border-outline-variant/30 cursor-pointer hover:bg-surface-container-low ${idx === 0 ? '' : 'mt-1'}`}
                    >
                      <span>{t(cat.name)}</span>
                      <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="py-1">
                        {catDocs.map(f => {
                          const isConfigured = configuredTypes.has(f.id);
                          const st = statusOf(f.id);
                          const note = st.otherBlocks.length > 0
                            ? t('Đã cấu hình ở {v0}', { v0: st.otherBlocks.map((b) => t(BLOCK_LABELS[b])).join(', ') })
                            : null;
                          return (
                            <button
                              key={f.id}
                              disabled={st.blocked}
                              title={st.blocked ? note : undefined}
                              onClick={() => { onChange(f.id); setIsOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                                st.blocked
                                  ? 'opacity-45 cursor-not-allowed text-secondary'
                                  : 'cursor-pointer'
                              } ${
                                value === f.id ? 'bg-primary/10 text-primary font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3/4 before:w-1 before:bg-primary before:rounded-r' : st.blocked ? '' : 'text-on-surface hover:bg-surface-container hover:text-primary'
                              }`}
                            >
                              <span className="flex flex-col gap-0.5 min-w-0">
                                <span className="break-words whitespace-normal leading-tight">{t(f.name)}</span>
                                {note && (
                                  <span className={`text-[11px] leading-tight ${st.blocked ? 'text-secondary' : 'text-on-surface/60'}`}>
                                    {note}
                                  </span>
                                )}
                              </span>
                              {isConfigured && (
                                <span className="material-symbols-outlined text-[16px] text-success flex-shrink-0" title={t('Đã cấu hình luồng cho khối này')}>
                                  check_circle
                                </span>
                              )}
                              {st.blocked && (
                                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0" title={note}>
                                  block
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkflowTab() {
  const { t } = useI18n();
  const { employees: EMPLOYEES } = useHr();

  // State cho roles từ API
  const [approvalRoles, setApprovalRoles] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formType, setFormType] = useState('');

  const [block, setBlock] = useState('hq');
  const [openStepIds, setOpenStepIds] = useState(() => new Set());
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [advancedStepId, setAdvancedStepId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const toggleCat = (id) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));

  const [workflows, setWorkflows] = useState({});
  const [workflowIds, setWorkflowIds] = useState({});
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [allWorkflows, setAllWorkflows] = useState([]);

  const { formFields, pushToast } = useApproval();

  useEffect(() => {
    workflowService.getAll().then(data => {
      setAllWorkflows(data || []);
    }).catch(err => console.error('Failed to load all workflows', err));
  }, []);

  /**
   * Loại đơn đang được cấu hình ở (những) khối nào.
   * Gộp cả dữ liệu đã lưu trên server và thay đổi chưa lưu trong state để dropdown
   * cập nhật ngay sau khi Lưu.
   */
  const blockUsage = useMemo(() => {
    const map = new Map(); // documentTypeId -> Set<'hq'|'retail'|'common'>
    const add = (docId, blk) => {
      if (!docId || !BLOCK_IDS.includes(blk)) return;
      if (!map.has(docId)) map.set(docId, new Set());
      map.get(docId).add(blk);
    };

    allWorkflows.forEach(wf => {
      if (wf.isActive !== false && wf.steps && wf.steps.length > 0) add(wf.documentTypeId, wf.scope);
    });

    Object.keys(workflows).forEach(docId => {
      BLOCK_IDS.forEach(blk => {
        if (workflows[docId] && workflows[docId][blk] && workflows[docId][blk].length > 0) add(docId, blk);
      });
    });

    // BE-49: "Dùng chung" chỉ là phương án DỰ PHÒNG cho khối chưa có luồng riêng.
    // Khi cả Khối Văn phòng và Khối Cửa hàng đều đã có luồng thì cấu hình Dùng chung không
    // còn tác dụng (không đơn nào đi qua nó) -> không tính là "đã cấu hình" nữa, tránh hiển
    // thị nhầm "đã cấu hình ở Dùng chung" và tránh khoá 2 khối kia. Bản ghi cũ sẽ được gỡ
    // tự động khi bấm Lưu (xem save()).
    map.forEach((used) => {
      if (used.has('hq') && used.has('retail')) used.delete('common');
    });

    return map;
  }, [allWorkflows, workflows]);

  /**
   * Trạng thái của một loại đơn trong KHỐI ĐANG CHỌN:
   * - configuredHere: đã có luồng ở chính khối này (vẫn cho bấm để sửa — nếu chặn thì
   *   không còn cách nào mở lại luồng đã cấu hình để chỉnh).
   * - otherBlocks:    đã có luồng ở khối KHÁC -> hiện chú thích.
   * - blocked:        làm mờ, không cho kích hoạt khi loại đơn đã "thuộc" về nơi khác:
   *     + "Dùng chung" chỉ dùng khi loại đơn CHƯA có luồng riêng ở Văn phòng/Cửa hàng.
   *   BE-49: Khối Văn phòng và Khối Cửa hàng là 2 khối CHÍNH, luôn cấu hình được — kể cả khi
   *   đang có luồng "Dùng chung" (trước đây Dùng chung khoá 2 khối này nên không thể chuyển
   *   một loại đơn từ Dùng chung về đúng khối, và khối Cửa hàng như bị "liệt").
   */
  const blockStatusOf = (docId) => {
    const used = blockUsage.get(docId);
    if (!used || used.size === 0) return { configuredHere: false, otherBlocks: [], blocked: false };
    const otherBlocks = [...used].filter(b => b !== block);
    const configuredHere = used.has(block);
    const blocked = !configuredHere && block === 'common' && otherBlocks.length > 0;
    return { configuredHere, otherBlocks, blocked };
  };

  const configuredTypes = useMemo(() => {
    const set = new Set();
    blockUsage.forEach((used, docId) => {
      if (used.has(block)) set.add(docId);
    });
    return set;
  }, [allWorkflows, workflows, block]);

  // Fetch roles từ API
  useEffect(() => {
    roleService.getAll()
      .then(data => {
        const mapped = (data || []).map(r => {
          const code = r.roleName || r.name || r.code || 'UNKNOWN';
          return {
            id: r.id,
            name: code,                              // giá trị lưu/duyệt
            label: roleLabel(code),                  // nhãn tiếng Việt cho người dùng
            description: r.description || '',
          };
        });
        setApprovalRoles(mapped);
      })
      .catch(err => {
        console.error(t('Không tải được chức danh:'), err);
        setApprovalRoles([]);
      });
  }, []);

  useEffect(() => {
    documentTypeService.getAll().then(data => {
      let merged = [];
      const keys = Object.keys(formFields);

      if (data && data.length > 0) {
        merged = [...data];
        // Thêm các form được tạo local chưa có trên DB
        const apiNames = new Set(data.map(d => d.name));
        keys.forEach(k => {
          if (!apiNames.has(k)) {
            merged.push({ id: k, name: k });
          }
        });
      } else {
        merged = keys.map(t => ({ id: t, name: t }));
      }

      setDocumentTypes(merged);
      if (merged.length > 0) {
        setFormType(merged[0].id);
      }
    }).catch(err => {
      console.error(t('Không tải được loại đơn:'), err);
      const keys = Object.keys(formFields);
      const merged = keys.map(t => ({ id: t, name: t }));
      setDocumentTypes(merged);
      if (merged.length > 0) {
        setFormType(merged[0].id);
      }
    });
  }, [formFields]);

  // Dựng danh mục mẫu đơn từ dữ liệu THẬT (cột category) thay vì danh sách cứng.
  // Trước đây danh mục hardcode nên mẫu đơn không nằm trong danh sách bị ẩn khỏi dropdown.
  useEffect(() => {
    if (!documentTypes.length) { setCategories([]); return; }
    const byCat = new Map();
    documentTypes.forEach(dt => {
      const cat = (dt.category && String(dt.category).trim()) || t('Khác');
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(dt.name);
    });
    const built = [...byCat.entries()].map(([name, items]) => ({
      id: `cat_${name}`,
      name,
      items,
    }));
    setCategories(built);
    setExpandedCats(built.reduce((acc, c) => ({ ...acc, [c.id]: true }), {}));
  }, [documentTypes]);

  useEffect(() => {
    if (!formType) return;
    
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formType);
    
    if (isGuid) {
      setLoadingWorkflows(true);
      workflowService.getByDocumentType(formType)
        .then(res => {
          // BE-47: một khối có thể có nhiều phiên bản (bản đang dùng + các bản đã lưu trữ)
          // -> luôn chọn phiên bản ĐANG HOẠT ĐỘNG.
          // BE-49: KHÔNG fallback sang bản đã ngừng hoạt động. Một khối bị gỡ cấu hình
          // (xoá hết bước rồi Lưu -> is_active = false) phải hiện là "chưa cấu hình"; nếu
          // nạp lại bước của bản cũ thì người dùng xoá xong, tải lại trang lại thấy y như cũ.
          const pick = (scope) => res.find(w => w.scope === scope && w.isActive !== false);
          const nextHq = pick('hq');
          const nextRetail = pick('retail');
          const nextCommon = pick('common');
          
          const formatSteps = (wf) => wf && wf.steps ? wf.steps.map(s => {
            const stepData = {
              ...s, 
              id: s.id || `s${Date.now()}-${Math.random()}`,
              specificUser: s.specificUserName || s.specificUserId || null
            };

            // BE-50: nếu bước đang bật "Xử lý quá hạn" mà chưa có số giờ (dữ liệu cũ) thì lấy
            // đúng giá trị giao diện đang hiển thị (12). Trước đây ô nhập chỉ hiển thị 12 nhưng
            // state vẫn rỗng, nên bấm Lưu là bị chặn với lỗi "Cần nhập thời gian xử lý quá hạn"
            // dù trên màn hình đã thấy 12 giờ.
            if (stepData.timeoutEnabled && !(Number(stepData.maxDurationHours) > 0)) {
              stepData.maxDurationHours = 12;
            }
            
            if (stepData.sequentialOrder && typeof stepData.sequentialOrder === 'string') {
              try {
                stepData.sequentialOrder = JSON.parse(stepData.sequentialOrder);
                stepData.approvers = stepData.sequentialOrder;
              } catch(e) {
                stepData.sequentialOrder = null;
                stepData.approvers = [];
              }
            } else if (Array.isArray(stepData.sequentialOrder)) {
              stepData.approvers = stepData.sequentialOrder;
            } else {
              stepData.sequentialOrder = null;
              stepData.approvers = [];
            }
            
            if (stepData.approvalType === 'role') {
              // BE-95: quy tắc "Duyệt lần lượt" BẮT BUỘC có danh sách người duyệt cụ thể (theo
              // thứ tự) nên không dùng chế độ "Để người tạo đơn quyết định" ở đây.
              if (stepData.multiRule === 'sequential') {
                stepData.arrangementMode = 'specific';
              } else if (stepData.sequentialOrder !== null) {
                stepData.arrangementMode = 'specific';
              } else {
                stepData.arrangementMode = 'role';
              }
            }

            if (stepData.approvalType === 'chain') {
              let list = stepData.chainList;
              if (typeof list === 'string') {
                 try { list = JSON.parse(list); } catch (e) { list = []; }
              }
              if (!Array.isArray(list)) list = [];
              if (list.length === 0) {
                const allIds = HIERARCHY_OPTIONS.map(o => o.id);
                const startIdx = allIds.indexOf(stepData.chainStart || 'direct_manager');
                const endIdx = allIds.indexOf(stepData.chainEnd || 'department_head');
                if (startIdx >= 0 && endIdx >= 0) {
                   list = allIds.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
                } else {
                   list = ['direct_manager'];
                }
              }
              stepData.chainList = list;
            }
            return stepData;
          }) : [];

          setWorkflows(prev => ({
            ...prev,
            [formType]: {
              hq: formatSteps(nextHq),
              retail: formatSteps(nextRetail),
              common: formatSteps(nextCommon)
            }
          }));

          setWorkflowIds(prev => ({
            ...prev,
            [`${formType}_hq`]: nextHq?.id,
            [`${formType}_retail`]: nextRetail?.id,
            [`${formType}_common`]: nextCommon?.id,
          }));
        })
        .catch(err => {
      console.error(t('Không tải được luồng duyệt:'), err);
          setWorkflows(prev => {
            if (prev[formType]) return prev;
            return {
              ...prev,
              [formType]: { hq: [], retail: [], common: [] }
            };
          });
        })
        .finally(() => setLoadingWorkflows(false));
    } else {
      setLoadingWorkflows(false);
      setWorkflows(prev => {
        if (prev[formType]) return prev;
        return {
          ...prev,
          [formType]: { hq: [], retail: [], common: [] }
        };
      });
    }
  }, [formType]);

  const steps = (workflows[formType] && workflows[formType][block]) || [];

  // Khối có thể chưa tồn tại trong state (ví dụ loại đơn chưa từng nạp) — luôn đọc qua
  // hàm này để "Thêm bước / Sửa bước" không ném TypeError khiến nút như bị liệt.
  const stepsOf = (state, formKey, blockKey) => state[formKey]?.[blockKey] ?? [];

  const updateStep = (id, patch) =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: stepsOf(prev, formType, block).map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    }));

  /**
   * BE-46: đổi HÌNH THỨC DUYỆT phải khởi tạo luôn các trường mà backend yêu cầu.
   *
   * Trước đây chỉ set { approvalType } nên khi đổi sang một hình thức khác, các trường
   * bắt buộc của hình thức mới vẫn là null (step cũ load từ API không có sẵn) -> backend
   * trả 400 và luồng duyệt KHÔNG lưu được.
   *
   *   hierarchy -> cần hierarchyOption
   *   chain     -> cần chainStart + chainEnd
   *   role      -> cần role
   *   specific  -> cần specificUser
   */
  const changeApprovalType = (id, approvalType) =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: stepsOf(prev, formType, block).map((s) => {
          if (s.id !== id) return s;
          let nextType = approvalType;
          if (approvalType === 'arrangement') nextType = 'role';
          const next = { ...s, approvalType: nextType };
          if (nextType === 'hierarchy' && !next.hierarchyOption) {
            next.hierarchyOption = 'department_head';
          }
          if (nextType === 'chain') {
            if (!next.chainStart) next.chainStart = 'direct_manager';
            if (!next.chainEnd) next.chainEnd = 'department_head';
            if (!next.chainList || next.chainList.length === 0) {
               const allIds = HIERARCHY_OPTIONS.map(o => o.id);
               const startIdx = allIds.indexOf(next.chainStart);
               const endIdx = allIds.indexOf(next.chainEnd);
               if (startIdx >= 0 && endIdx >= 0) {
                  next.chainList = allIds.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
               } else {
                  next.chainList = ['direct_manager', 'department_head'];
               }
            }
            next.multiRule = 'sequential';
          }
          // BE-50: XOÁ các lựa chọn của hình thức CŨ để các bước không "ăn vào nhau"
          // (bước quản lý trực tiếp còn sót người được chỉ định của bước trước...).
          if (nextType !== 'role') {
            next.role = '';
            next.roleName = '';
            next.approvers = null;
            next.sequentialOrder = null;
            next.arrangementMode = 'role';
          }
          if (nextType !== 'specific') {
            next.specificUser = null;
            next.specificUserId = null;
          }
          if (nextType !== 'chain') {
            next.chainStart = null;
            next.chainEnd = null;
            next.chainList = null;
          }
          if (nextType !== 'hierarchy') {
            next.hierarchyOption = null;
          }
          if (nextType === 'specific') {
            next.multiRule = null;
          }
          return next;
        }),
      },
    }));

  // BE-35: đổi CHỨC DANH thì phải xoá người duyệt đã chọn trước đó.
  // Người cũ thuộc chức danh khác nên sẽ không còn trong danh sách ứng viên mới ->
  // giữ lại sẽ gây "specificUserId" mâu thuẫn, đơn có thể không ai duyệt được.
  const changeRole = (id, role) =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: stepsOf(prev, formType, block).map((s) =>
          s.id === id ? { ...s, role, roleName: role, specificUser: null, specificUserId: null, approvers: null, sequentialOrder: null, arrangementMode: 'role' } : s
        ),
      },
    }));
  const removeStep = (id) => {
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: stepsOf(prev, formType, block).filter((s) => s.id !== id),
      },
    }));
    setOpenStepIds((cur) => {
      if (!cur.has(id)) return cur;
      const next = new Set(cur);
      next.delete(id);
      return next;
    });
  };
  const addStep = () => {
    const newStep = makeStep({ track: block, name: translate('Bước duyệt mới') }, approvalRoles, EMPLOYEES);
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: [...stepsOf(prev, formType, block), newStep],
      },
    }));
    setOpenStepIds((cur) => new Set(cur).add(newStep.id));
  };

  // Kéo-thả sắp xếp lại thứ tự step trong track hiện tại
  const onStepDrop = (dropId) => {
    if (!draggedStepId || draggedStepId === dropId) return;
    setDraggedStepId(null);
    setWorkflows((prev) => {
      const arr = [...stepsOf(prev, formType, block)];
      const fromIdx = arr.findIndex((s) => s.id === draggedStepId);
      const toIdx = arr.findIndex((s) => s.id === dropId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return { ...prev, [formType]: { ...prev[formType], [block]: arr } };
    });
  };

  const toggleStep = (id) =>
    setOpenStepIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * BE-46: quy đổi giá trị người duyệt về ID thật.
   *
   * `UserSelect` lưu TÊN nhân sự (`onChange(e.name)`), còn backend cần `specificUserId`.
   * Trước đây `save()` chỉ so sánh theo ID nên KHÔNG BAO GIỜ khớp -> gửi null -> 400.
   */
  const resolveEmployeeId = (val) => {
    if (!val) return null;
    const byId = EMPLOYEES.find((e) => e.id === val);
    if (byId) return byId.id;
    const byName = EMPLOYEES.find((e) => e.name === val);
    return byName ? byName.id : null;
  };

  /**
   * BE-46: gom mọi bước của cả 3 khối để kiểm tra trước khi lưu.
   */
  const scopeDataForValidation = () => {
    const data = workflows[formType] || { hq: [], retail: [], common: [] };
    return ['hq', 'retail', 'common'].flatMap((scope) =>
      (data[scope] || []).map((s, i) => ({ step: s, scope, index: i }))
    );
  };

  /**
   * BE-46: kiểm tra hợp lệ giống backend, trả về danh sách lỗi dạng chuỗi.
   * Giúp người dùng biết CHÍNH XÁC thiếu gì thay vì "lưu không được".
   */
  const validateSteps = (items) =>
    items.flatMap(({ step, scope, index }) => {
      const where = `${scope.toUpperCase()} · Bước ${index + 1}`;
      const errs = [];
      const type = step.approvalType || 'role';
      if (type === 'hierarchy' && !step.hierarchyOption) {
        errs.push(t('{v0}: Cần chọn cấp bậc cho hình thức quản lý trực tiếp', { v0: where }));
      }
      if (type === 'chain') {
        const list = step.chainList || [];
        if (list.length === 0) {
          errs.push(t('{v0}: Cần có ít nhất một cấp duyệt cho chuỗi liên tiếp', { v0: where }));
        }
        
        const uniqueList = new Set(list);
        if (uniqueList.size !== list.length) {
          errs.push(t('{v0}: Có cấp duyệt bị trùng lặp trong chuỗi', { v0: where }));
        }
      }
      if (type === 'role' && (!Array.isArray(step.approvers) || step.approvers.length === 0) && !step.role) {
        errs.push(t('{v0}: Cần chọn chức danh/bộ phận cho hình thức này', { v0: where }));
      }
      // BE-95: quy tắc "Duyệt lần lượt" không dùng chế độ "Để người tạo đơn quyết định" nên bắt
      // buộc phải có danh sách người duyệt cụ thể, nếu không máy chủ sẽ lưu bước trống người duyệt.
      if (type === 'role' && step.multiRule === 'sequential' && stepApproverIds(step).length === 0) {
        errs.push(t('{v0}: Quy tắc "Duyệt lần lượt" cần chọn danh sách người duyệt theo thứ tự', { v0: where }));
      }
      if (type === 'specific') {
        const hasUser =
          resolveEmployeeId(step.specificUser) ||
          (Array.isArray(step.approvers) && step.approvers.length === 1 && resolveEmployeeId(step.approvers[0]));
        if (!hasUser) errs.push(t('{v0}: Cần chọn người duyệt cụ thể', { v0: where }));
      }
      // BE-50: bật "Xử lý quá hạn" thì backend BẮT BUỘC có số giờ > 0. Trước đây bước mới
      // không lưu số giờ nên người dùng chỉ thấy lỗi khó hiểu từ backend khi bấm Lưu.
      if (step.timeoutEnabled && !(Number(step.maxDurationHours) > 0)) {
        errs.push(t('{v0}: Cần nhập thời gian xử lý quá hạn (số giờ lớn hơn 0)', { v0: where }));
      }
      return errs;
    });

  const save = async () => {
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formType);
    if (!isGuid) {
      console.warn(t('Chưa thể lưu luồng duyệt cho loại đơn cục bộ.'));
      pushToast(t('Chưa thể lưu luồng duyệt cho loại đơn cục bộ.'), 'warning');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    // BE-46: kiểm tra trước khi gửi để báo lỗi RÕ RÀNG cho người dùng,
    // thay vì để backend trả 400 rồi nuốt lỗi trong console.
    const invalid = validateSteps(scopeDataForValidation());
    if (invalid.length > 0) {
      // Hiển thị ĐỦ mọi lỗi: trước đây chỉ hiện lỗi đầu tiên nên khi lỗi nằm ở khối khác
      // người dùng tưởng "khối đang sửa không lưu được".
      pushToast(invalid.join(' • '), 'error');
      console.error('Luồng duyệt chưa hợp lệ:', invalid);
      return;
    }

    try {
      const scopeData = workflows[formType] || { hq: [], retail: [], common: [] };
      const scopes = ['hq', 'retail', 'common'];

      // BE-49: "Dùng chung" chỉ là phương án dự phòng. Khi cả Khối Văn phòng và Khối Cửa hàng
      // đều đã có luồng riêng thì cấu hình Dùng chung không còn tác dụng -> tự gỡ để dropdown
      // không hiển thị nhầm "đã cấu hình ở Dùng chung" (và để 2 khối chính không bị khoá).
      const staleCommonId = workflowIds[`${formType}_common`];
      const bothBlocksHaveFlow = scopeData.hq.length > 0 && scopeData.retail.length > 0;
      const dropCommon = bothBlocksHaveFlow && (Boolean(staleCommonId) || scopeData.common?.length > 0);

      // Có thực sự ghi gì lên máy chủ không (để không báo "Đã lưu" khi chưa lưu gì).
      let savedAnything = false;

      for (const scope of scopes) {
        const wfId = workflowIds[`${formType}_${scope}`];
        // BE-95: `scopeData[scope]` có thể chưa tồn tại (dữ liệu nạp dở/khối mới) — trước đây
        // `.map` trên undefined ném TypeError và người dùng chỉ thấy "Không lưu được luồng duyệt".
        const scopeSteps = Array.isArray(scopeData[scope]) ? scopeData[scope] : [];
        const req = {
          name: `Luồng duyệt ${scope.toUpperCase()} cho form ${formType}`,
          documentTypeId: formType,
          scope: scope,
          isDefault: true,
          steps: scopeSteps.map((s, idx) => {
            const type = s.approvalType || 'role';
            // BE-95: "Duyệt lần lượt" luôn là danh sách người duyệt cụ thể (không có chế độ
            // "Để người tạo đơn quyết định") — áp dụng cả khi dữ liệu cũ còn giữ arrangementMode
            // là 'role' để không gửi lên cấu hình mâu thuẫn.
            const arrangementMode = s.multiRule === 'sequential' ? 'specific' : s.arrangementMode;
            // BE-50: CHỈ gửi các trường thuộc hình thức duyệt đang chọn.
            // Trước đây gửi tất cả (role + specificUser + chainStart/End + hierarchyOption) cho
            // MỌI bước, nên các bước "ăn vào nhau": bước quản lý trực tiếp vẫn mang theo người
            // được chỉ định + chức danh của bước khác -> cây luồng và đơn bị lẫn người duyệt.
            const designatedUserId = (() => {
              if (type === 'role' && arrangementMode === 'role') return null;
              if (Array.isArray(s.approvers) && s.approvers.length === 1) return resolveEmployeeId(s.approvers[0]);
              if (s.specificUser) return resolveEmployeeId(s.specificUser);
              if (s.specificUserId) return resolveEmployeeId(s.specificUserId);
              return null;
            })();

            const isRole = type === 'role';
            const isChain = type === 'chain';
            const isHierarchy = type === 'hierarchy';
            const isSpecific = type === 'specific' || type === 'specific_user';

            // Người được chỉ định chỉ có ý nghĩa với bước "chỉ định 1 người" hoặc bước
            // "theo chức danh" ở chế độ chọn tay.
            const specificUserId = isSpecific
              ? designatedUserId
              : (isRole && arrangementMode !== 'role' ? designatedUserId : null);

            const sequentialOrder = isRole && arrangementMode !== 'role'
              ? (stepApproverIds(s).length > 0 ? stepApproverIds(s) : null)
              : null;

            return {
              name: s.name,
              stepOrder: idx + 1,
              isActive: s.isActive !== false,
              approvalType: type,
              hierarchyOption: isHierarchy ? s.hierarchyOption : null,
              chainStart: isChain ? s.chainStart : null,
              chainEnd: isChain ? s.chainEnd : null,
              chainList: isChain ? s.chainList : null,
              role: isRole ? s.role : null,
              roleName: isRole ? s.role : null,
              multiRule: isRole ? s.multiRule : (isChain ? 'sequential' : null),
              sequentialOrder,
              specificUserId,
              scope: s.scope || 'auto',
              condition: s.condition,
              maxDurationHours: s.maxDurationHours,
              timeoutEnabled: s.timeoutEnabled || false,
              timeoutMode: s.timeoutMode,
              timeoutAction: s.timeoutAction,
              rejectReasonRequired: s.rejectReasonRequired !== false
            };
          })
        };

        if (wfId) {
          // BE-49: khối này đã bị gỡ cấu hình -> gửi danh sách bước RỖNG để backend ngừng
          // hoạt động luồng đó (không xoá cứng để đơn cũ vẫn hiển thị được luồng duyệt).
          // Trước đây thao tác này bị backend chặn 400 nên không thể gỡ cấu hình khối nào.
          const payload = scope === 'common' && dropCommon ? { ...req, steps: [] } : req;
          // BE-47: luồng đã có đơn sử dụng sẽ được backend lưu trữ và thay bằng phiên bản
          // mới -> response trả về id MỚI. Không cập nhật lại id thì lần lưu sau sẽ sửa
          // nhầm vào bản đã lưu trữ và sinh thêm phiên bản mới mỗi lần bấm Lưu.
          const updated = await workflowService.update(wfId, payload);
          savedAnything = true;
          if (updated?.id && updated.id !== wfId) {
            setWorkflowIds(prev => ({ ...prev, [`${formType}_${scope}`]: updated.id }));
          }
          if (scope === 'common' && dropCommon) {
            setWorkflowIds(prev => ({ ...prev, [`${formType}_common`]: undefined }));
            setWorkflows(prev => ({
              ...prev,
              [formType]: { ...prev[formType], common: [] },
            }));
          } else if (wfId && scope === 'common') {
            setWorkflowIds(prev => ({ ...prev, [`${formType}_common`]: updated?.id ?? wfId }));
          }
        } else if (req.steps.length > 0 && !(scope === 'common' && dropCommon)) {
          const created = await workflowService.create(req);
          savedAnything = true;
          setWorkflowIds(prev => ({ ...prev, [`${formType}_${scope}`]: created.id }));
        }
      }

      // BE-95: không có khối nào có bước duyệt thì KHÔNG gửi gì lên máy chủ — trước đây vẫn báo
      // "Đã lưu cấu hình luồng duyệt" khiến người dùng tưởng đã lưu được nhưng thực tế không có gì.
      if (!savedAnything) {
        pushToast(
          t('Chưa có bước duyệt nào để lưu. Hãy bấm "Thêm bước duyệt tiếp theo" cho khối cần cấu hình rồi lưu lại.'),
          'warning'
        );
        return;
      }

      // Danh sách "loại đơn đã cấu hình ở khối nào" được dựng từ dữ liệu server -> nạp lại
      // để chú thích trong dropdown đúng ngay sau khi lưu (khối vừa gỡ không còn bị đánh dấu).
      workflowService.getAll()
        .then(data => setAllWorkflows(data || []))
        .catch(err => console.error('Failed to refresh workflows', err));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Một toast duy nhất: pushToast dùng Date.now() làm id nên gọi 2 lần liên tiếp sẽ trùng
      // key trong danh sách toast (React cảnh báo "two children with the same key").
      pushToast(
        dropCommon
          ? t('Đã lưu cấu hình luồng duyệt. Đã gỡ luồng "Dùng chung" vì Khối Văn phòng và Khối Cửa hàng đều đã có luồng riêng')
          : t('Đã lưu cấu hình luồng duyệt'),
        'success'
      );
    } catch (err) {
      console.error(t('Không lưu được luồng duyệt:'), err);
      // Hiển thị thông báo lỗi từ backend (validator trả về mảng errors)
      const data = err?.response?.data;
      const status = err?.response?.status;
      const detail = Array.isArray(data?.errors)
        ? data.errors.join(' • ')
        : (data?.message || data?.error
          || (status ? t('Máy chủ trả về lỗi {v0}', { v0: status }) : null)
          || (err?.request ? t('Không kết nối được tới máy chủ. Kiểm tra lại kết nối rồi thử lưu lại.') : null)
          || (typeof data === 'string' && data.trim() ? data.trim().slice(0, 200) : null));
      pushToast(detail || t('Không lưu được luồng duyệt'), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Form type + Block selector */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="material-symbols-outlined text-primary">tune</span>
            <span className="font-label-md text-on-surface font-semibold">{t('Cấu hình luồng duyệt cho:')}</span>
          </div>

          <CustomGroupedSelect
            categories={categories}
            documentTypes={documentTypes}
            value={formType}
            configuredTypes={configuredTypes}
            blockStatusOf={blockStatusOf}
            onChange={(val) => {
              setFormType(val);
              setOpenStepIds(new Set());
            }}
          />
        </div>

          {/* Chọn khối luồng (HQ / Retail / Dùng chung) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-outline-variant/50">
            <span className="text-xs text-secondary flex-shrink-0">{t('Khối luồng:')}</span>
            <div className="flex flex-wrap gap-1 p-0.5 bg-surface-container-lowest border border-outline-variant rounded-md">
            {BLOCK_OPTIONS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBlock(b.id);
                  setOpenStepIds(new Set());
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors cursor-pointer ${block === b.id ? 'bg-primary text-on-primary font-medium' : 'text-secondary hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">{b.icon}</span>
                {t(b.label)}
              </button>
            ))}
          </div>
        </div>

          {/* Khối đang chọn chưa có bước duyệt -> nhân viên khối đó không tạo được đơn */}
          {!loadingWorkflows && steps.length === 0 && (
            <div className="flex items-start gap-2 text-xs rounded-md border border-warning/40 bg-warning-container/40 text-on-warning-container px-3 py-2">
              <span className="material-symbols-outlined text-[16px] text-warning flex-shrink-0">warning</span>
              <span>{t(BLOCK_MISSING_HINTS[block] || '')}</span>
            </div>
          )}

          {/* Chú giải nhỏ: loại đơn đã cấu hình ở khối nào thì bị làm mờ ở khối còn lại */}
          <div className="flex flex-col gap-1 pt-3 border-t border-outline-variant/50">
            <div className="flex items-start gap-2 text-[11px] text-secondary">
              <span className="material-symbols-outlined text-[15px] text-success flex-shrink-0 mt-px">check_circle</span>
              <span>
                {t('Khối Văn phòng và Khối Cửa hàng là 2 khối CHÍNH, luôn cấu hình được: mỗi khối có luồng riêng cho nhân viên của mình nên một loại đơn có thể có ở cả hai khối.')}
              </span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-secondary pl-[23px]">
              <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">menu_book</span>
              <span>
                {t('Riêng "Dùng chung" là phương án DỰ PHÒNG: chỉ mở khi loại đơn chưa có luồng ở khối nào. Khi cả Văn phòng và Cửa hàng đã có luồng riêng thì luồng Dùng chung tự được gỡ lúc bấm Lưu.')}
              </span>
            </div>
          </div>
        </div>

      {/* Vertical flow - Accordion / Flow Builder */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          const isActive = openStepIds.has(step.id);
          const hasExplicitApprovers = step.arrangementMode !== 'role' && stepApproverIds(step).length > 0;
          const activeApproverCount = stepApproverIds(step).length;
          // BE-95: "Duyệt lần lượt" không có chế độ "Để người tạo đơn quyết định" -> luôn hiển thị
          // như danh sách người duyệt cụ thể để thẻ bước khớp với popup cấu hình.
          const effectiveArrangement = step.multiRule === 'sequential' ? 'specific' : step.arrangementMode;
          const showMulti = step.approvalType === 'role' && hasExplicitApprovers;
          return (
            <div
              key={step.id}
              className="relative pl-8 pb-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onStepDrop(step.id)}
            >
              {/* Đường nối dọc giữa các bước */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 z-10 transition-colors ${isActive
                      ? 'bg-primary text-on-primary shadow-md ring-4 ring-primary/20'
                      : 'bg-primary/10 text-primary border border-primary/30'
                    }`}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && <div className="flex-1 w-px bg-outline-variant my-1" />}
              </div>

              <div
                className={`rounded-lg border transition-all ${draggedStepId === step.id
                    ? 'opacity-50 border-dashed border-primary'
                    : isActive
                      ? 'bg-surface border-primary/40 shadow-md'
                      : 'bg-surface-container-lowest border-outline-variant shadow-sm hover:border-outline'
                  }`}
              >
                {isActive ? (
                  <>
                    {/* Header trạng thái mở rộng */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/50">
                      <span
                        className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing"
                        title={t('Kéo để sắp xếp bước')}
                        draggable
                        onDragStart={() => setDraggedStepId(step.id)}
                        onDragEnd={() => setDraggedStepId(null)}
                      >
                        drag_indicator
                      </span>
                      <input
                        className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none border-b border-transparent focus:border-primary"
                        value={step.name}
                        onChange={(e) => updateStep(step.id, { name: e.target.value })}
                      />
                      <span className="text-xs text-secondary px-2 py-0.5 bg-surface-container rounded">{t('Bước')} {idx + 1}</span>
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="text-secondary hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                        title={t('Thu gọn')}
                      >
                        <span className="material-symbols-outlined text-[18px] transition-transform rotate-180">expand_more</span>
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                        title={t('Xoá bước')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    {/* Body - Grid 2 cột trên màn rộng */}
                    <div className="p-4 flex flex-col gap-4">
                      {/* Điều kiện rẽ nhánh (Conditional Routing) — full width */}
                      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-md p-2.5">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={!!step.condition}
                            onChange={(e) =>
                              updateStep(step.id, {
                                condition: e.target.checked
                                  ? { field: CONDITION_FIELDS[0].id, op: '>', value: '' }
                                  : null,
                              })
                            }
                            className="text-primary focus:ring-primary rounded cursor-pointer"
                          />
                          <span className="material-symbols-outlined text-primary text-[16px]">alt_route</span>
                          <span className="text-sm font-semibold text-on-surface">{t('Áp dụng bước này khi')}</span>
                        </label>
                        {step.condition && (
                          <div className="flex flex-wrap items-center gap-2 pl-6">
                            <select
                              className={`${selectCls} max-w-[180px]`}
                              value={step.condition.field}
                              onChange={(e) =>
                                updateStep(step.id, { condition: { ...step.condition, field: e.target.value } })
                              }
                            >
                              {CONDITION_FIELDS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {t(f.label)}
                                </option>
                              ))}
                            </select>
                            <select
                              className={`${selectCls} w-[70px]`}
                              value={step.condition.op}
                              onChange={(e) =>
                                updateStep(step.id, { condition: { ...step.condition, op: e.target.value } })
                              }
                            >
                              {CONDITION_OPS.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}                            </select>
                            <input
                              type="text"
                              placeholder={t('giá trị')}
                              value={step.condition.value}
                              onChange={(e) =>
                                updateStep(step.id, { condition: { ...step.condition, value: e.target.value } })
                              }
                              className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary max-w-[140px]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Hàng trên - Hình thức duyệt (Full width) */}
                      <div className="w-full">
                        <div>
                          <GroupHeader icon="how_to_reg" label={t('Hình thức duyệt')} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {APPROVAL_TYPES.map((at) => (
                              <RadioCard
                                key={at.id}
                                name={`approval-${step.id}`}
                                checked={at.id === 'arrangement' ? step.approvalType === 'role' : step.approvalType === at.id}
                                onClick={() => changeApprovalType(step.id, at.id)}
                                title={t(at.label)}
                              />
                            ))}
                          </div>
                          {/* Cấu hình theo hình thức duyệt */}
                          <div className="mt-2.5">
                            {step.approvalType === 'hierarchy' && (
                              <select
                                className={`${selectCls} max-w-md`}
                                value={step.hierarchyOption}
                                onChange={(e) => updateStep(step.id, { hierarchyOption: e.target.value })}
                              >
                                {HIERARCHY_GROUPS.map((g) => (
                                  <optgroup key={g} label={t(g)}>
                                    {HIERARCHY_OPTIONS.filter((o) => o.group === g).map((o) => (
                                      <option key={o.id} value={o.id}>
                                        {t(o.label)}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            )}
                            {step.approvalType === 'role' && (
                              <div className="flex flex-col gap-2 w-full">
                                <GroupHeader icon="rule" label={t('Chọn quy tắc duyệt')} />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {MULTI_RULES.map((r) => (
                                    <RadioCard
                                      key={r.id}
                                      name={`multi-${step.id}`}
                                      checked={step.multiRule === r.id}
                                      onClick={() => {
                                        // BE-95: "Duyệt lần lượt" cần danh sách người duyệt cụ thể
                                        // theo thứ tự -> bỏ chế độ "Để người tạo đơn quyết định"
                                        // (chỉ áp dụng cho quy tắc này, 2 quy tắc đồng thời giữ nguyên).
                                        updateStep(step.id, r.id === 'sequential'
                                          ? { multiRule: r.id, arrangementMode: 'specific', role: '' }
                                          : { multiRule: r.id });
                                        setAdvancedStepId(step.id);
                                      }}
                                      title={t(r.label)}
                                      desc={t(r.desc)}
                                      badge={r.badge}
                                    />
                                  ))}
                                </div>

                                {/* Giải thích quy tắc đang chọn để tránh nhầm "chưa đến lượt" */}
                                {step.multiRule && (
                                  <div className="flex items-start gap-2 text-[11px] bg-surface-container-low border border-outline-variant rounded-md px-3 py-2">
                                    <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">info</span>
                                    <span className="text-secondary">
                                      {step.multiRule === 'sequential'
                                        ? t('BẮT BUỘC theo đúng thứ tự: người đứng trước duyệt xong mới tới người kế tiếp (kéo-thả danh sách bên dưới để đổi thứ tự).')
                                        : step.multiRule === 'and'
                                          ? t('KHÔNG cần theo thứ tự: ai duyệt trước cũng được, nhưng TẤT CẢ người trong danh sách phải duyệt thì bước mới hoàn tất.')
                                          : t('KHÔNG cần theo thứ tự: ai duyệt trước cũng được, CHỈ CẦN 1 người duyệt là bước hoàn tất.')}
                                    </span>
                                  </div>
                                )}

                                {step.multiRule && (
                                  <div className="mt-4 border border-outline-variant/60 rounded-lg p-3.5 bg-surface-container-lowest flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-on-surface">
                                        {effectiveArrangement === 'role' ? t('Chức danh / Phòng ban cần duyệt') : t('Danh sách người duyệt')}
                                      </div>
                                      <div className="text-[12px] text-secondary mt-1">
                                        {effectiveArrangement === 'role'
                                          ? t('Để người tạo đơn quyết định · Chức danh: {v0}', { v0: step.role ? t(step.role) : t('Chưa chọn') })
                                          : effectiveArrangement === 'specific' && activeApproverCount > 0
                                          ? t(`Đã chỉ định ${activeApproverCount} người`)
                                          : t('Chưa cấu hình người duyệt')}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setAdvancedStepId(step.id)}
                                      className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors text-sm font-medium px-4 py-2 rounded-md flex-shrink-0 cursor-pointer"
                                    >
                                      {(effectiveArrangement === 'role' && step.role) || (effectiveArrangement === 'specific' && activeApproverCount > 0)
                                        ? t('Thay đổi')
                                        : t('Cấu hình')}
                                    </button>
                                  </div>
                                )}

                                {advancedStepId === step.id && (
                                  <AdvancedApproverModal
                                    step={step}
                                    approvalRoles={approvalRoles}
                                    onClose={() => setAdvancedStepId(null)}
                                    onConfirm={(data) => {
                                      updateStep(step.id, { 
                                        arrangementMode: data.arrangementMode,
                                        role: data.role,
                                        approvers: data.approvers, 
                                        sequentialOrder: data.approvers,
                                        specificUser: null,
                                        specificUserId: null
                                      });
                                      setAdvancedStepId(null);
                                    }}
                                  />
                                )}
                              </div>
                            )}
                            {step.approvalType === 'specific' && (
                              <UserSelect
                                value={step.specificUser}
                                onChange={(val) => updateStep(step.id, { specificUser: val })}
                              />
                            )}
                            {step.approvalType === 'chain' && (
                              <div className="flex flex-col gap-4 mt-2">
                                <label className="text-[12px] font-semibold text-secondary uppercase tracking-wider flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                                  {t('Danh sách các cấp duyệt nối tiếp')}
                                </label>
                                
                                <div className="flex flex-col relative pl-4 border-l-2 border-primary/20 ml-3">
                                  {(step.chainList || []).map((levelId, index) => (
                                    <div key={index} className="flex items-center gap-3 mb-3 relative group">
                                      {/* Timeline dot */}
                                      <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-surface border-2 border-primary shadow-sm z-10 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                      </div>
                                      
                                      <div className="flex-1 bg-surface border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow p-2 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[13px] font-bold text-primary">
                                          {index + 1}
                                        </span>
                                        <select
                                          className={`${selectCls} flex-1 border-none shadow-none bg-transparent hover:bg-surface-container-lowest focus:ring-0 px-2 py-1.5 font-medium`}
                                          value={levelId}
                                          onChange={(e) => {
                                            const newList = [...(step.chainList || [])];
                                            newList[index] = e.target.value;
                                            updateStep(step.id, { chainList: newList });
                                          }}
                                        >
                                          <optgroup label={t('Cấp quản lý (Hierarchy)')}>
                                            {HIERARCHY_OPTIONS.map((o) => (
                                              <option key={o.id} value={o.id} disabled={step.chainList?.includes(o.id) && o.id !== levelId}>{t(o.label)}</option>
                                            ))}
                                          </optgroup>
                                          <optgroup label={t('Chức danh (Role)')}>
                                            {approvalRoles.map((r) => (
                                              <option key={r.id} value={r.name} disabled={step.chainList?.includes(r.name) && r.name !== levelId}>{t(r.label || r.name)}</option>
                                            ))}
                                          </optgroup>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newList = [...(step.chainList || [])];
                                            newList.splice(index, 1);
                                            updateStep(step.id, { chainList: newList });
                                          }}
                                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                          title={t('Xóa cấp duyệt')}
                                        >
                                          <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <div className="relative mt-2 flex">
                                      <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-surface border-2 border-outline-variant shadow-sm z-10 flex items-center justify-center"></div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newList = [...(step.chainList || []), 'direct_manager'];
                                          updateStep(step.id, { chainList: newList });
                                        }}
                                        className="flex items-center gap-2 text-[13px] font-semibold text-primary hover:text-primary-dark hover:bg-primary/5 px-4 py-2 rounded-xl transition-all border border-dashed border-primary/40 hover:border-primary w-full justify-center bg-surface-container-lowest"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        {t('Thêm cấp duyệt mới')}
                                      </button>
                                  </div>
                                </div>

                                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex gap-3 items-start mt-2">
                                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
                                  <p className="text-[12px] text-secondary leading-relaxed flex-1">
                                    {t('Hệ thống sẽ duyệt tuần tự qua từng cấp từ trên xuống dưới. Các cấp không tồn tại trong sơ đồ tổ chức thực tế sẽ được tự động bỏ qua mà không làm gián đoạn luồng.')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Hàng dưới full-width - Thứ tự / Danh sách người duyệt */}
                      {showMulti && (
                        <div className="border-t border-outline-variant/50 pt-4">
                          <GroupHeader
                            icon={step.multiRule === 'sequential' ? "format_list_numbered" : "group"}
                            label={step.multiRule === 'sequential' ? t('Thứ tự duyệt') : t('Danh sách người duyệt')}
                            hint={t('{v0} người duyệt đã chỉ định', { v0: activeApproverCount })}
                          />

                          <SequentialOrderList
                            role={step.role}
                            isSequential={step.multiRule === 'sequential'}
                            order={stepApproverIds(step)}
                            // BE-95: sửa danh sách người duyệt (thêm/xoá/kéo-thả) phải cập nhật CẢ
                            // `approvers` lẫn `sequentialOrder`, nếu không số lượng hiển thị và
                            // dữ liệu gửi lên máy chủ lệch nhau.
                            onChange={(newOrder) => updateStep(step.id, { sequentialOrder: newOrder, approvers: newOrder })}
                          />
                          {(Array.isArray(stepApproverIds(step)) && stepApproverIds(step).length === 1) && (
                            <div className="mt-3 flex items-start gap-2 text-[11px] bg-surface-container-low border border-outline-variant rounded-md px-3 py-2">
                              <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 mt-px">info</span>
                              <span className="text-secondary">
                                {t('Chỉ')} <strong className="text-on-surface">{t('1 người')}</strong> {t('được chỉ định — đơn sẽ chỉ tới người này (không áp dụng quy tắc nhiều người).')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hàng dưới cùng - Cấu hình nâng cao */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4 border-t border-outline-variant/50 pt-4">
                        {/* Cột trái - Xử lý quá hạn */}
                        <div>
                          <GroupHeader icon="schedule" label={t('Xử lý quá hạn')} />
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={step.timeoutEnabled}
                              onChange={(e) => updateStep(step.id, {
                                timeoutEnabled: e.target.checked,
                                maxDurationHours: e.target.checked ? (step.maxDurationHours || 12) : step.maxDurationHours,
                                timeoutMode: e.target.checked ? (step.timeoutMode || 'continuous') : step.timeoutMode,
                                timeoutAction: e.target.checked ? (step.timeoutAction || 'return') : step.timeoutAction,
                              })}
                              className="text-primary focus:ring-primary rounded cursor-pointer"
                            />
                            <span className="text-sm text-on-surface">{t('Tự động xử lý đơn khi quá thời hạn không duyệt')}</span>
                          </label>
                          {step.timeoutEnabled && (
                            <div className="flex flex-col gap-2 pl-6">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap w-[70px]">{t('Thời gian:')}</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={step.maxDurationHours ?? 12}
                                  onChange={(e) => updateStep(step.id, { maxDurationHours: Number(e.target.value) || 1 })}
                                  className={`${selectCls} max-w-[80px]`}
                                />
                                <span className="text-xs text-secondary">{t('giờ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap w-[70px]">{t('Chế độ:')}</span>
                                <select
                                  className={`${selectCls} max-w-[200px]`}
                                  value={step.timeoutMode || 'continuous'}
                                  onChange={(e) => updateStep(step.id, { timeoutMode: e.target.value })}
                                >
                                  {TIME_RULES.map((tr) => (
                                    <option key={tr.id} value={tr.id}>
                                      {t(tr.label)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap w-[70px]">{t('Hành động:')}</span>
                                <select
                                  className={`${selectCls} max-w-[200px]`}
                                  value={step.timeoutAction || 'return'}
                                  onChange={(e) => updateStep(step.id, { timeoutAction: e.target.value })}
                                >
                                  <option value="return">{t('Trả đơn về nơi khởi tạo')}</option>
                                  <option value="escalate">{t('Tự động chuyển lên cấp trên')}</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cột phải - Hành động từ chối */}
                        <div>
                          <GroupHeader icon="block" label={t('Hành động từ chối')} />
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.rejectReasonRequired !== false}
                              onChange={(e) => updateStep(step.id, { rejectReasonRequired: e.target.checked })}
                              className="text-primary focus:ring-primary rounded cursor-pointer"
                            />
                            <span className="text-sm text-on-surface">
                              {t('Bắt buộc nhập lý do khi từ chối đơn')}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Trạng thái thu gọn - Node trong luồng */
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer group"
                    title={t('Mở rộng để chỉnh sửa')}
                  >
                    <span
                      className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing flex-shrink-0"
                      title={t('Kéo để sắp xếp bước')}
                      draggable
                      onDragStart={() => setDraggedStepId(step.id)}
                      onDragEnd={() => setDraggedStepId(null)}
                    >
                      drag_indicator
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-on-surface truncate">{t(step.name)}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-outline text-[14px]">account_tree</span>
                        <span className="text-xs text-secondary truncate">{approvalSummary(step, EMPLOYEES)}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-secondary px-2 py-0.5 bg-surface-container rounded flex-shrink-0 hidden sm:inline">
                      {t('Bước')} {idx + 1}
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary text-[20px] transition-colors flex-shrink-0">
                      expand_more
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={addStep}
          className="bg-surface text-primary border border-primary/40 hover:bg-primary-container/30 transition-colors text-sm font-medium px-4 py-2.5 rounded-md flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('Thêm bước duyệt tiếp theo')}
        </button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-success text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {t('Đã lưu cấu hình')}
            </span>
          )}
          <button
            onClick={save}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-5 py-2.5 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {t('Lưu cấu hình luồng duyệt')}
          </button>
        </div>
      </div>
    </div>
  );
}
