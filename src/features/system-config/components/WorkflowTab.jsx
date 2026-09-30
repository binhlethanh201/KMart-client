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
      const n = Array.isArray(step.approvers) ? step.approvers.length : 0;
      return translate('Theo chức danh / Bộ phận{v0}', { v0: n ? ` · ${n} người` : '' });
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

function SequentialOrderList({ role, order, onChange }) {
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
        <span>{t('Danh sách người duyệt tuần tự')}</span>
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
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
            className={`flex items-center justify-between bg-surface border rounded p-2 shadow-sm transition-all ${draggedIdx === idx
                ? 'opacity-50 border-primary border-dashed'
                : 'border-outline-variant hover:border-outline cursor-grab active:cursor-grabbing'
              }`}
          >
            <div className="flex items-center gap-2 pointer-events-none min-w-0">
              <span className="material-symbols-outlined text-outline text-[18px] flex-shrink-0">drag_indicator</span>
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
function AdvancedApproverModal({ approvers, onConfirm, onClose }) {
  const { t } = useI18n();
  const { employees: EMPLOYEES } = useHr();
  const [selected, setSelected] = useState(() => new Set(Array.isArray(approvers) ? approvers : []));
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');

  const departments = useMemo(
    () => Array.from(new Set(EMPLOYEES.map((e) => e.department).filter(Boolean))).sort(),
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
        return matchSearch && matchDept;
      }),
    [search, dept]
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
              <p className="text-xs text-secondary">
                {t('Đã chọn')} <span className="font-medium text-primary">{selected.size}</span> {t('người tham gia duyệt')}
              </p>
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
            className={`${selectCls} max-w-[200px]`}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">{t('Tất cả phòng ban')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
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

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-outline-variant/30 bg-surface-container-lowest">
          <span className="text-xs text-secondary">
            {t('Mẹo: người được tích sẽ tham gia bước duyệt này, ghi đè danh sách tự khớp theo vai trò.')}
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
              onClick={() => onConfirm(Array.from(selected))}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              {t('Xác nhận (')}{selected.size})
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
    name: 'Bước duyệt mới',
    approvalType: 'hierarchy',
    hierarchyOption: 'department_head',
    chainStart: 'direct_manager',
    chainEnd: 'department_head',
    role: defaultRole,
    specificUser: defaultSpecificUser,
    multiRule: 'sequential',
    scope: 'auto',
    condition: null,
    approvers: null,
    timeoutEnabled: true,
    timeoutMode: 'continuous',
    timeoutAction: 'return',
    rejectReasonRequired: true,
    ...overrides,
  };
}

function CustomGroupedSelect({ categories, documentTypes, value, onChange }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => 
    categories.reduce((acc, cat) => ({...acc, [cat.id]: true}), {})
  );
  
  const toggleGroup = (id) => setExpandedGroups(prev => ({...prev, [id]: !prev[id]}));

  const selectedDoc = documentTypes.find(d => d.id === value);

  return (
    <div className="relative w-full max-w-[280px] z-[50]">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-md px-3 py-2 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
      >
        <span className="text-sm text-on-surface font-medium truncate pr-4">
          {selectedDoc ? selectedDoc.name : t('Chọn loại đơn...')}
        </span>
        <span className={`material-symbols-outlined text-secondary group-hover:text-primary text-[20px] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] left-0 w-[320px] bg-surface rounded-lg shadow-xl border border-outline-variant py-1 z-50 max-h-[250px] overflow-y-auto animate-fade-in origin-top custom-scrollbar">
            {categories.map(cat => {
              const catDocs = documentTypes.filter(dt => cat.items.includes(dt.name));
              if (catDocs.length === 0) return null;
              
              const isExpanded = expandedGroups[cat.id] !== false;
              
              return (
                <div key={cat.id} className="mb-2 last:mb-0">
                  <div 
                    onClick={(e) => { e.stopPropagation(); toggleGroup(cat.id); }}
                    className="px-3 py-1.5 bg-surface-container-low/90 text-[11px] font-bold text-primary uppercase tracking-wider sticky top-0 backdrop-blur-md flex items-center justify-between z-10 border-b border-outline-variant/30 shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-surface-container-low"
                  >
                    <span>{cat.name}</span>
                    <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="py-1">
                      {catDocs.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { onChange(f.id); setIsOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                            value === f.id ? 'bg-primary/10 text-primary font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3/4 before:w-1 before:bg-primary before:rounded-r' : 'text-on-surface hover:bg-surface-container hover:text-primary'
                          }`}
                        >
                          <span className="break-words whitespace-normal">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
  const [saved, setSaved] = useState(false);

  const { formFields, pushToast } = useApproval();

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
      workflowService.getByDocumentType(formType)
        .then(res => {
          const nextHq = res.find(w => w.scope === 'hq');
          const nextRetail = res.find(w => w.scope === 'retail');
          const nextCommon = res.find(w => w.scope === 'common');
          
          const formatSteps = (wf) => wf && wf.steps ? wf.steps.map(s => ({
            ...s, 
            id: s.id || `s${Date.now()}-${Math.random()}`,
            specificUser: s.specificUserName || s.specificUserId || null
          })) : [];

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
        });
    } else {
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

  const updateStep = (id, patch) =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: prev[formType][block].map((s) => (s.id === id ? { ...s, ...patch } : s)),
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
        [block]: prev[formType][block].map((s) => {
          if (s.id !== id) return s;
          const next = { ...s, approvalType };
          if (approvalType === 'hierarchy' && !next.hierarchyOption) {
            next.hierarchyOption = 'department_head';
          }
          if (approvalType === 'chain') {
            if (!next.chainStart) next.chainStart = 'direct_manager';
            if (!next.chainEnd) next.chainEnd = 'department_head';
          }
          if (approvalType === 'role' && !next.role) {
            next.role = approvalRoles.length > 0
              ? (typeof approvalRoles[0] === 'string' ? approvalRoles[0] : approvalRoles[0]?.name || '')
              : '';
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
        [block]: prev[formType][block].map((s) =>
          s.id === id ? { ...s, role, roleName: role, specificUser: null, approvers: null, sequentialOrder: null } : s
        ),
      },
    }));
  const removeStep = (id) => {
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: prev[formType][block].filter((s) => s.id !== id),
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
    const newStep = makeStep({ track: block, name: 'Bước duyệt mới' }, approvalRoles, EMPLOYEES);
    setWorkflows((prev) => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [block]: [...prev[formType][block], newStep],
      },
    }));
    setOpenStepIds((cur) => new Set(cur).add(newStep.id));
  };

  // Kéo-thả sắp xếp lại thứ tự step trong track hiện tại
  const onStepDrop = (dropId) => {
    if (!draggedStepId || draggedStepId === dropId) return;
    setDraggedStepId(null);
    setWorkflows((prev) => {
      const arr = [...prev[formType][block]];
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
        if (!step.chainStart) errs.push(t('{v0}: Cần chọn cấp bắt đầu của chuỗi', { v0: where }));
        if (!step.chainEnd) errs.push(t('{v0}: Cần chọn cấp kết thúc của chuỗi', { v0: where }));
      }
      if (type === 'role' && !step.role) {
        errs.push(t('{v0}: Cần chọn chức danh/bộ phận cho hình thức này', { v0: where }));
      }
      if (type === 'specific') {
        const hasUser =
          resolveEmployeeId(step.specificUser) ||
          (Array.isArray(step.approvers) && step.approvers.length === 1 && resolveEmployeeId(step.approvers[0]));
        if (!hasUser) errs.push(t('{v0}: Cần chọn người duyệt cụ thể', { v0: where }));
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
      pushToast(invalid[0], 'error');
      console.error('Luồng duyệt chưa hợp lệ:', invalid);
      return;
    }

    try {
      const scopeData = workflows[formType] || { hq: [], retail: [], common: [] };
      const scopes = ['hq', 'retail', 'common'];

      for (const scope of scopes) {
        const wfId = workflowIds[`${formType}_${scope}`];
        const req = {
          name: `Luồng duyệt ${scope.toUpperCase()} cho form ${formType}`,
          documentTypeId: formType,
          scope: scope,
          isDefault: true,
          steps: scopeData[scope].map((s, idx) => {
            // BE-35: người được CHỈ ĐỊNH cho bước "theo chức danh".
            // BE-46: resolve được cả khi giá trị là TÊN (UserSelect) hoặc ID.
            const designatedUserId = (() => {
              if (Array.isArray(s.approvers) && s.approvers.length === 1) return resolveEmployeeId(s.approvers[0]);
              if (s.specificUser) return resolveEmployeeId(s.specificUser);
              if (s.specificUserId) return resolveEmployeeId(s.specificUserId);
              return null;
            })();
            const specificUserId = designatedUserId;

            return {
              name: s.name,
              stepOrder: idx + 1,
              isActive: s.isActive !== false,
              approvalType: s.approvalType || 'role',
              hierarchyOption: s.hierarchyOption,
              chainStart: s.chainStart,
              chainEnd: s.chainEnd,
              role: s.role,
              roleName: s.role,
              // Quy tắc nhiều người duyệt: áp dụng cho bước "theo chức danh" (dù chỉ định
              // hay để tự resolve theo chức danh) — trước đây chỉ gửi khi có ≥2 người được
              // CHỈ ĐỊNH nên chọn quy tắc ở chế độ theo chức danh bị mất khi lưu.
              multiRule: s.approvalType === 'role' ? s.multiRule : null,
              // Thứ tự tuần tự: chỉ có ý nghĩa khi quy tắc là "sequential".
              // Ưu tiên thứ tự người dùng đã sắp, nếu chưa sắp thì lấy danh sách đã chỉ định.
              sequentialOrder: (s.approvalType === 'role' && s.multiRule === 'sequential')
                ? (Array.isArray(s.sequentialOrder) && s.sequentialOrder.length > 0
                    ? s.sequentialOrder
                    : (Array.isArray(s.approvers) ? s.approvers : null))
                : null,
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
          await workflowService.update(wfId, req);
        } else if (req.steps.length > 0) {
          const created = await workflowService.create(req);
          setWorkflowIds(prev => ({ ...prev, [`${formType}_${scope}`]: created.id }));
        }
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      pushToast(t('Đã lưu cấu hình luồng duyệt'), 'success');
    } catch (err) {
      console.error(t('Không lưu được luồng duyệt:'), err);
      // Hiển thị thông báo lỗi từ backend (validator trả về mảng errors)
      const data = err?.response?.data;
      const detail = Array.isArray(data?.errors) ? data.errors.join(' • ') : (data?.message || data?.error);
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
      </div>

      {/* Vertical flow - Accordion / Flow Builder */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          const isActive = openStepIds.has(step.id);
          // BE-35: số người duyệt = số người ĐƯỢC CHỈ ĐỊNH, nếu không chỉ định thì lấy
          // toàn bộ nhân sự thuộc chức danh (vì luồng tự resolve theo chức danh).
          const hasExplicitApprovers = Array.isArray(step.approvers) && step.approvers.length > 0;
          const roleMembersCount = EMPLOYEES.filter((e) => e.role === step.role || e.position === step.role).length;
          const activeApproverCount = hasExplicitApprovers
            ? step.approvers.length
            : roleMembersCount;
          // Quy tắc nhiều người duyệt chỉ có nghĩa khi bước là "theo chức danh",
          // KHÔNG chỉ định 1 người cụ thể, và thực tế có ≥2 người có thể duyệt
          // (hoặc người dùng đã chỉ định ≥2 người).
          const showMulti = step.approvalType === 'role'
            && !step.specificUser
            && activeApproverCount >= 2;
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

                      {/* Hàng trên: 2 cột cân bằng (đều ngắn) */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Cột trái - Hình thức duyệt */}
                        <div>
                          <GroupHeader icon="how_to_reg" label={t('Hình thức duyệt')} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {APPROVAL_TYPES.map((at) => (
                              <RadioCard
                                key={at.id}
                                name={`approval-${step.id}`}
                                checked={step.approvalType === at.id}
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
                              <div className="flex flex-col gap-2 max-w-md">
                                <div className="flex items-center justify-between gap-2">
                                  <label className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                                    {t('1. Chọn chức danh cần duyệt')}
                                  </label>
                                </div>
                                <select
                                  className={selectCls}
                                  value={step.role}
                                  onChange={(e) => changeRole(step.id, e.target.value)}
                                >
                                  <option value="">{t('-- Chọn chức danh --')}</option>
                                  {approvalRoles.map((r) => (
                                    <option key={r.id} value={r.name}>
                                      {t('Duyệt theo chức danh:')} {r.label || r.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setAdvancedStepId(step.id)}
                                  className="group flex items-center gap-3 w-full text-left bg-surface-container-lowest border border-outline-variant hover:border-primary hover:bg-primary-container/20 px-3 py-2.5 rounded-md transition-colors cursor-pointer mt-1"
                                >
                                  <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">group_add</span>
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-on-surface">{t('2. Chỉ định người duyệt (không bắt buộc)')}</div>
                                    <div className="text-[11px] text-secondary">
                                      {Array.isArray(step.approvers) && step.approvers.length > 0
                                        ? t('{v0} người đã chỉ định', { v0: step.approvers.length })
                                        : t('Không chỉ định thì mọi người thuộc chức danh {v0} đều duyệt được', { v0: roleLabel(step.role) || '...' })}
                                    </div>
                                  </div>
                                  {Array.isArray(step.approvers) && step.approvers.length > 0 && (
                                    <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                      {step.approvers.length}
                                    </span>
                                  )}
                                  <span className="material-symbols-outlined text-outline group-hover:text-primary text-[20px] transition-colors flex-shrink-0">
                                    chevron_right
                                  </span>
                                </button>

                                {/* Preview các người duyệt đã chọn */}
                                {Array.isArray(step.approvers) && step.approvers.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {step.approvers.map((id) => {
                                      const emp = EMPLOYEES.find((e) => e.id === id);
                                      if (!emp) return null;
                                      return (
                                        <span
                                          key={id}
                                          className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 rounded-full pl-0.5 pr-2 py-0.5"
                                          title={`${emp.name} · ${emp.id}${emp.department ? ` · ${t(emp.department)}` : ''}`}
                                        >
                                          <img
                                            src={emp.avatar}
                                            alt={emp.name}
                                            className="w-6 h-6 rounded-full object-cover border border-surface"
                                          />
                                          <span className="text-[11px] font-medium text-on-surface truncate max-w-[110px]">
                                            {emp.name}
                                          </span>
                                          {emp.position && (
                                            <span className="text-[9px] text-secondary truncate max-w-[80px]">
                                              · {t(emp.position)}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {advancedStepId === step.id && (
                                  <AdvancedApproverModal
                                    approvers={step.approvers}
                                    onClose={() => setAdvancedStepId(null)}
                                    onConfirm={(ids) => {
                                      updateStep(step.id, { approvers: ids });
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
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-secondary whitespace-nowrap">{t('Bắt đầu từ:')}</span>
                                <select
                                  className={`${selectCls} min-w-[180px]`}
                                  value={step.chainStart || 'direct_manager'}
                                  onChange={(e) => updateStep(step.id, { chainStart: e.target.value })}
                                >
                                  {HIERARCHY_OPTIONS.map((o) => (
                                    <option key={o.id} value={o.id}>{t(o.label)}</option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined text-outline">arrow_forward</span>
                                <span className="text-sm text-secondary whitespace-nowrap">{t('Tối đa đến:')}</span>
                                <select
                                  className={`${selectCls} min-w-[180px]`}
                                  value={step.chainEnd || 'department_head'}
                                  onChange={(e) => updateStep(step.id, { chainEnd: e.target.value })}
                                >
                                  {HIERARCHY_OPTIONS.map((o) => (
                                    <option key={o.id} value={o.id}>{t(o.label)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cột phải - Xử lý quá hạn */}
                        <div>
                          <GroupHeader icon="schedule" label={t('Xử lý quá hạn')} />
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={step.timeoutEnabled}
                              onChange={(e) => updateStep(step.id, {
                                timeoutEnabled: e.target.checked,
                                // BE-38: mặc định 12 giờ nếu chưa nhập (UI trước đây ghi "12 giờ" cứng
                                // nhưng KHÔNG hề gửi maxDurationHours -> BE dùng 48h, sai với nhãn).
                                maxDurationHours: e.target.checked ? (step.maxDurationHours || 12) : step.maxDurationHours,
                                timeoutMode: e.target.checked ? (step.timeoutMode || 'continuous') : step.timeoutMode,
                                timeoutAction: e.target.checked ? (step.timeoutAction || 'return') : step.timeoutAction,
                              })}
                              className="text-primary focus:ring-primary rounded cursor-pointer"
                            />
                            <span className="text-sm text-on-surface">{t('Tự động xử lý đơn khi quá thời hạn không duyệt')}</span>
                          </label>
                          {step.timeoutEnabled && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-6">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap">{t('Số giờ tối đa:')}</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={step.maxDurationHours ?? 12}
                                  onChange={(e) => updateStep(step.id, { maxDurationHours: Number(e.target.value) || 1 })}
                                  className={`${selectCls} max-w-[100px]`}
                                />
                                <span className="text-xs text-secondary">{t('giờ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap">{t('Chế độ:')}</span>
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
                                <span className="text-xs text-secondary whitespace-nowrap">{t('Hành động:')}</span>
                                <select
                                  className={`${selectCls} max-w-[220px]`}
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
                      </div>

                      {/* Hàng dưới full-width - Quy tắc nhiều người duyệt */}
                      {showMulti && (
                        <div className="border-t border-outline-variant/50 pt-4">
                          <GroupHeader
                            icon="group"
                            label={t('Quy tắc nhiều người duyệt')}
                            hint={t('{v0} người duyệt{v1}', { v0: activeApproverCount, v1: hasExplicitApprovers ? ' (đã chỉ định)' : ' (theo chức danh)' })}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {MULTI_RULES.map((r) => (
                              <RadioCard
                                key={r.id}
                                name={`multi-${step.id}`}
                                checked={step.multiRule === r.id}
                                onClick={() => updateStep(step.id, { multiRule: r.id })}
                                title={t(r.label)}
                                desc={t(r.desc)}
                                badge={r.badge}
                              />
                            ))}
                          </div>

                          {step.multiRule === 'sequential' && (
                            <SequentialOrderList
                              role={step.role}
                              order={step.sequentialOrder || step.approvers}
                              onChange={(newOrder) => updateStep(step.id, { sequentialOrder: newOrder })}
                            />
                          )}

                          {/* BE-35: cảnh báo cấu hình chưa rõ ràng để tránh lỗi khi duyệt */}
                          {(!Array.isArray(step.approvers) || step.approvers.length === 0) && (
                            <div className="mt-3 flex items-start gap-2 text-[11px] bg-surface-container-low border border-outline-variant rounded-md px-3 py-2">
                              <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 mt-px">info</span>
                              <span className="text-secondary">
                                {t('Không chỉ định ai thì')} <strong className="text-on-surface">{t('mọi người thuộc chức danh')} {roleLabel(step.role) || t('(chưa chọn)')}</strong> {t('đều thấy và duyệt được đơn này.')}
                              </span>
                            </div>
                          )}
                          {(Array.isArray(step.approvers) && step.approvers.length === 1) && (
                            <div className="mt-3 flex items-start gap-2 text-[11px] bg-surface-container-low border border-outline-variant rounded-md px-3 py-2">
                              <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 mt-px">info</span>
                              <span className="text-secondary">
                                {t('Chỉ')} <strong className="text-on-surface">{t('1 người')}</strong> {t('được chỉ định — đơn sẽ chỉ tới người này (không áp dụng quy tắc nhiều người).')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hành động từ chối — full width */}
                      <div className="border-t border-outline-variant/50 pt-4">
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
                      <div className="text-sm font-semibold text-on-surface truncate">{step.name}</div>
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
