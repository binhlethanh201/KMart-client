import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FORM_TYPES, INITIAL_WORKFLOW, APPROVAL_TYPES, MULTI_RULES, APPROVAL_ROLES, SPECIFIC_USERS, CONDITION_FIELDS, CONDITION_OPS, TIME_RULES } from '../data/mockData';
import { useHr } from '../../hr/context/HrProvider';
import { useApproval } from '../../../context/useApproval';
import { documentTypeService } from '../../../services/documentTypeService';
import { workflowService } from '../services/workflowService';

const selectCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer';

const HIERARCHY_OPTIONS = [
  { id: 'leader', label: 'Quản lý trực tiếp' },
  { id: 'deputy_manager', label: 'Phó phòng' },
  { id: 'manager', label: 'Trưởng phòng' },
  { id: 'store_manager', label: 'Cửa hàng trưởng' },
  { id: 'area_manager', label: 'Quản lý chi nhánh / Vùng' },
  { id: 'higher', label: 'Giám đốc khối / Ban giám đốc' },
];

// Các khối luồng (track) — tách setup riêng, "common" merge cho cả HQ & Retail
const BLOCK_OPTIONS = [
  { id: 'hq', label: 'Khối Văn phòng', icon: 'apartment' },
  { id: 'retail', label: 'Khối Cửa hàng', icon: 'storefront' },
  { id: 'common', label: 'Dùng chung', icon: 'merge' },
];

// Bước mẫu theo khối
const SAMPLE_RETAIL_STEP = {
  name: 'Cửa hàng trưởng duyệt',
  approvalType: 'hierarchy',
  hierarchyOption: 'store_manager',
  scope: 'retail',
};

const APPROVAL_LABELS = APPROVAL_TYPES.reduce((acc, t) => { acc[t.id] = t.label; return acc; }, {});

// Tóm tắt hình thức duyệt cho trạng thái thu gọn
function approvalSummary(step) {
  switch (step.approvalType) {
    case 'hierarchy': {
      const opt = HIERARCHY_OPTIONS.find((o) => o.id === step.hierarchyOption);
      return `${APPROVAL_LABELS.hierarchy}${opt ? ` · ${opt.label}` : ''}`;
    }
    case 'chain':
      return APPROVAL_LABELS.chain;
    case 'role': {
      const n = Array.isArray(step.approvers) ? step.approvers.length : 0;
      return `Theo chức danh / Bộ phận${n ? ` · ${n} người` : ''}`;
    }
    case 'specific':
      return `Chọn 1 người cụ thể${step.specificUser ? ` · ${step.specificUser}` : ''}`;
    default:
      return 'Chưa cấu hình';
  }
}

function SequentialOrderList({ role, order, onChange }) {
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
        <span>Danh sách người duyệt tuần tự</span>
        <span className="text-[10px] text-secondary font-normal px-2 py-0.5 bg-surface-container rounded-full">
          {displayList.length} nhân sự
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {displayList.length === 0 && (
          <div className="text-xs text-secondary italic py-2">Chưa có người duyệt nào.</div>
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
                  <span className="text-sm text-on-surface font-medium truncate">{emp.name}</span>
                  {emp.position && (
                    <span className="text-[10px] font-semibold text-primary bg-primary-container/40 border border-primary/20 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {emp.position}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-secondary truncate">
                  <span className="truncate">({emp.id.substring(0, 8).toUpperCase()}){emp.department ? ` · ${emp.department}` : ''}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => removeUser(idx)}
              className="text-outline hover:text-error hover:bg-error-container/30 p-1 rounded transition-colors cursor-pointer"
              title="Loại bỏ"
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
            Thêm người duyệt
          </button>
        ) : (
          <div className="mt-1 bg-surface border border-outline-variant rounded-md shadow-lg overflow-hidden flex flex-col relative z-10 w-full sm:w-80">
            <div className="p-2 border-b border-outline-variant/50 flex items-center gap-2 bg-surface-container-lowest">
              <span className="material-symbols-outlined text-secondary text-[16px]">search</span>
              <input
                type="text"
                autoFocus
                placeholder="Tìm tên hoặc mã nhân sự..."
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
                <div className="text-xs text-secondary text-center py-4 italic">Không tìm thấy nhân sự nào</div>
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
                            {e.position}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-secondary truncate">
                        {e.id.substring(0, 8).toUpperCase()}{e.department ? ` • ${e.department}` : ''}
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
          <span className="text-sm text-secondary">Chọn nhân sự...</span>
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
                placeholder="Tìm tên hoặc mã nhân sự..."
                className="flex-1 bg-transparent text-xs text-on-surface outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1.5 flex flex-col gap-1 relative z-50">
              {filtered.length === 0 ? (
                <div className="text-xs text-secondary text-center py-4 italic">Không tìm thấy nhân sự</div>
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
              <h2 className="font-label-md text-on-surface font-semibold">Cấu hình nâng cao — chọn người duyệt</h2>
              <p className="text-xs text-secondary">
                Đã chọn <span className="font-medium text-primary">{selected.size}</span> người tham gia duyệt
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
              placeholder="Tìm theo tên / mã / chức vụ..."
              className="flex-1 bg-transparent text-sm text-on-surface outline-none"
            />
          </div>
          <select
            className={`${selectCls} max-w-[200px]`}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">Tất cả phòng ban</option>
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
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-secondary hover:text-error hover:bg-error-container/30 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>

        {/* Danh sách nhân sự */}
        <div className="overflow-y-auto max-h-[55vh] p-3 flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="text-sm text-secondary text-center py-8 italic">Không tìm thấy nhân sự nào.</div>
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
                        {e.department}
                      </span>
                      <span className="text-outline-variant">·</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">work</span>
                        {e.position}
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
                        <span className="text-[10px] text-secondary uppercase tracking-wider">Kiêm nhiệm:</span>
                        {e.secondary.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/50 rounded px-1.5 py-0.5"
                          >
                            <span className="material-symbols-outlined text-[12px] text-primary">badge</span>
                            <span className="text-[11px] font-medium text-on-surface">{s.department}</span>
                            <span className="text-[11px] text-secondary">· {s.position}</span>
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
            Mẹo: người được tích sẽ tham gia bước duyệt này, ghi đè danh sách tự khớp theo vai trò.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-secondary hover:text-on-surface border border-outline-variant hover:bg-surface-container-low px-4 py-2 rounded-md transition-colors cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={() => onConfirm(Array.from(selected))}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              Xác nhận ({selected.size})
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

// Tạo object step mới với đầy đủ field mặc định
function makeStep(overrides = {}) {
  return {
    id: `s${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: 'Bước duyệt mới',
    approvalType: 'hierarchy',
    hierarchyOption: 'manager',
    chainStart: 'leader',
    chainEnd: 'manager',
    role: APPROVAL_ROLES[0],
    specificUser: SPECIFIC_USERS[0],
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

export default function WorkflowTab() {
  const { employees: EMPLOYEES } = useHr();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [formType, setFormType] = useState('');

  const [block, setBlock] = useState('hq');
  const [openStepIds, setOpenStepIds] = useState(() => new Set());
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [advancedStepId, setAdvancedStepId] = useState(null);

  const [workflows, setWorkflows] = useState({});
  const [saved, setSaved] = useState(false);

  const { formFields } = useApproval();

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
      console.error("Failed to load document types:", err);
      const keys = Object.keys(formFields);
      const merged = keys.map(t => ({ id: t, name: t }));
      setDocumentTypes(merged);
      if (merged.length > 0) {
        setFormType(merged[0].id);
      }
    });
  }, [formFields]);

  useEffect(() => {
    if (!formType) return;
    // TODO: fetch workflowService.getByDocumentType(formType)
    // For now we mock the state transition if data doesn't exist
    setWorkflows(prev => {
      if (prev[formType]) return prev;
      return {
        ...prev,
        [formType]: {
          hq: INITIAL_WORKFLOW.map((s) => ({ ...s, id: `${s.id}_hq`, track: 'hq' })),
          retail: [{ ...makeStep(SAMPLE_RETAIL_STEP), id: `cht_retail`, track: 'retail' }],
          common: [
            {
              ...INITIAL_WORKFLOW[1],
              id: `hr_common`,
              name: 'HR Admin duyệt (chung)',
              track: 'common',
              approvalType: 'role',
              role: 'HR Admin',
              scope: 'auto',
            },
          ],
        }
      };
    });
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
    const newStep = makeStep({ track: block, name: 'Bước duyệt mới' });
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

  const save = async () => {
    try {
      // In a real scenario, map workflows[formType] to WorkflowRequest and call API
      // await workflowService.create({ documentTypeId: formType, name: "Default Workflow", ... });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save workflow:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Form type + Block selector */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="material-symbols-outlined text-primary">tune</span>
            <span className="font-label-md text-on-surface font-semibold">Cấu hình luồng duyệt cho:</span>
          </div>

          <select
            className={`${selectCls} max-w-xs`}
            value={formType}
            onChange={(e) => {
              setFormType(e.target.value);
              setOpenStepIds(new Set());
            }}
          >
            {documentTypes.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Chọn khối luồng (HQ / Retail / Dùng chung) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-outline-variant/50">
          <span className="text-xs text-secondary flex-shrink-0">Khối luồng:</span>
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
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical flow - Accordion / Flow Builder */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          const isActive = openStepIds.has(step.id);
          const activeApproverCount = Array.isArray(step.approvers) && step.approvers.length > 0
            ? step.approvers.length
            : EMPLOYEES.filter((e) => e.role === step.role || e.position === step.role).length;
          const showMulti = step.approvalType === 'role';
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
                        title="Kéo để sắp xếp bước"
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
                      <span className="text-xs text-secondary px-2 py-0.5 bg-surface-container rounded">Bước {idx + 1}</span>
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="text-secondary hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="Thu gọn"
                      >
                        <span className="material-symbols-outlined text-[18px] transition-transform rotate-180">expand_more</span>
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="Xoá bước"
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
                          <span className="text-sm font-semibold text-on-surface">Áp dụng bước này khi</span>
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
                                  {f.label}
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
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="giá trị"
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Cột trái - Hình thức duyệt */}
                        <div>
                          <GroupHeader icon="how_to_reg" label="Hình thức duyệt" />
                          <div className="flex flex-col md:flex-row gap-2">
                            {APPROVAL_TYPES.map((t) => (
                              <RadioCard
                                key={t.id}
                                name={`approval-${step.id}`}
                                checked={step.approvalType === t.id}
                                onClick={() => updateStep(step.id, { approvalType: t.id })}
                                title={t.label}
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
                                {HIERARCHY_OPTIONS.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {step.approvalType === 'role' && (
                              <div className="flex flex-col gap-2 max-w-md">
                                <select
                                  className={selectCls}
                                  value={step.role}
                                  onChange={(e) => updateStep(step.id, { role: e.target.value })}
                                >
                                  {APPROVAL_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      Duyệt theo chức danh: {r}
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
                                    <div className="text-sm font-semibold text-on-surface">Chọn người duyệt</div>
                                    <div className="text-[11px] text-secondary">
                                      {Array.isArray(step.approvers) && step.approvers.length > 0
                                        ? `${step.approvers.length} người đã chọn`
                                        : 'Bấm để mở hộp chọn'}
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
                                          title={`${emp.name} · ${emp.id}${emp.department ? ` · ${emp.department}` : ''}`}
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
                                              · {emp.position}
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
                                <span className="text-sm text-secondary whitespace-nowrap">Bắt đầu từ:</span>
                                <select
                                  className={`${selectCls} min-w-[180px]`}
                                  value={step.chainStart || 'leader'}
                                  onChange={(e) => updateStep(step.id, { chainStart: e.target.value })}
                                >
                                  <option value="leader">Tổ trưởng / Trưởng nhóm</option>
                                  <option value="deputy_manager">Phó phòng</option>
                                  <option value="manager">Trưởng phòng</option>
                                  <option value="store_manager">Cửa hàng trưởng</option>
                                  <option value="area_manager">Quản lý chi nhánh / Vùng</option>
                                </select>
                                <span className="material-symbols-outlined text-outline">arrow_forward</span>
                                <span className="text-sm text-secondary whitespace-nowrap">Tối đa đến:</span>
                                <select
                                  className={`${selectCls} min-w-[180px]`}
                                  value={step.chainEnd || 'manager'}
                                  onChange={(e) => updateStep(step.id, { chainEnd: e.target.value })}
                                >
                                  <option value="deputy_manager">Phó phòng</option>
                                  <option value="manager">Trưởng phòng</option>
                                  <option value="store_manager">Cửa hàng trưởng</option>
                                  <option value="area_manager">Quản lý chi nhánh / Vùng</option>
                                  <option value="higher">Giám đốc / TGĐ</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cột phải - Xử lý quá hạn */}
                        <div>
                          <GroupHeader icon="schedule" label="Xử lý quá hạn 12 giờ" />
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={step.timeoutEnabled}
                              onChange={(e) => updateStep(step.id, { timeoutEnabled: e.target.checked })}
                              className="text-primary focus:ring-primary rounded cursor-pointer"
                            />
                            <span className="text-sm text-on-surface">Tự động chuyển trả đơn sau 12 giờ không xử lý</span>
                          </label>
                          {step.timeoutEnabled && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-6">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap">Chế độ:</span>
                                <select
                                  className={`${selectCls} max-w-[200px]`}
                                  value={step.timeoutMode || 'continuous'}
                                  onChange={(e) => updateStep(step.id, { timeoutMode: e.target.value })}
                                >
                                  {TIME_RULES.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary whitespace-nowrap">Hành động:</span>
                                <select
                                  className={`${selectCls} max-w-[200px]`}
                                  value={step.timeoutAction}
                                  onChange={(e) => updateStep(step.id, { timeoutAction: e.target.value })}
                                >
                                  <option value="return">Chuyển trả về nơi khởi tạo</option>
                                  <option value="escalate">Tự động chuyển cấp lên trên</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hàng dưới full-width - Quy tắc nhiều người duyệt */}
                      {showMulti && (
                        <div className="border-t border-outline-variant/50 pt-4">
                          <GroupHeader icon="group" label="Quy tắc nhiều người duyệt" hint={`${activeApproverCount} người duyệt`} />
                          <div className="flex flex-col sm:flex-row gap-2">
                            {MULTI_RULES.map((r) => (
                              <RadioCard
                                key={r.id}
                                name={`multi-${step.id}`}
                                checked={step.multiRule === r.id}
                                onClick={() => updateStep(step.id, { multiRule: r.id })}
                                title={r.label}
                                desc={r.desc}
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
                        </div>
                      )}

                      {/* Hành động từ chối — full width */}
                      <div className="border-t border-outline-variant/50 pt-4">
                        <GroupHeader icon="block" label="Hành động từ chối" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.rejectReasonRequired !== false}
                            onChange={(e) => updateStep(step.id, { rejectReasonRequired: e.target.checked })}
                            className="text-primary focus:ring-primary rounded cursor-pointer"
                          />
                          <span className="text-sm text-on-surface">
                            Bắt buộc nhập lý do khi từ chối đơn
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
                    title="Mở rộng để chỉnh sửa"
                  >
                    <span
                      className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing flex-shrink-0"
                      title="Kéo để sắp xếp bước"
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
                        <span className="text-xs text-secondary truncate">{approvalSummary(step)}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-secondary px-2 py-0.5 bg-surface-container rounded flex-shrink-0 hidden sm:inline">
                      Bước {idx + 1}
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
          Thêm bước duyệt tiếp theo
        </button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-success text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Đã lưu cấu hình
            </span>
          )}
          <button
            onClick={save}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-5 py-2.5 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Lưu cấu hình Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
