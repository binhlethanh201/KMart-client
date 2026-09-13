import { useState, useMemo } from 'react';
import { FORM_TYPES, INITIAL_WORKFLOW, APPROVAL_TYPES, MULTI_RULES, APPROVAL_ROLES, SPECIFIC_USERS } from '../data/mockData';
import { EMPLOYEES } from '../../hr/data/mockData';

const selectCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer';

const HIERARCHY_OPTIONS = [
  { id: 'leader', label: 'Quản lý trực tiếp (Tổ trưởng/Trưởng nhóm)' },
  { id: 'deputy_manager', label: 'Phó phòng' },
  { id: 'manager', label: 'Trưởng phòng' },
  { id: 'higher', label: 'Giám đốc khối / Ban giám đốc' },
];

function SequentialOrderList({ role, order, onChange }) {
  const currentIds = useMemo(() => {
    if (Array.isArray(order)) return order;
    return EMPLOYEES.filter(e => e.role === role).map(e => e.id);
  }, [role, order]);

  const displayList = useMemo(() => {
    return currentIds.map(id => EMPLOYEES.find(e => e.id === id)).filter(Boolean);
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

  const availableToAdd = EMPLOYEES.filter(e => !currentIds.includes(e.id));
  const filteredToAdd = availableToAdd.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-4 bg-surface-container-lowest border border-outline-variant rounded-md p-3 ml-8">
      <div className="text-xs font-semibold text-on-surface mb-3 flex items-center justify-between">
        <span>Danh sách người duyệt tuần tự</span>
        <span className="text-[10px] text-secondary font-normal px-2 py-0.5 bg-surface-container rounded-full">{displayList.length} nhân sự</span>
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
            className={`flex items-center justify-between bg-surface border rounded p-2 shadow-sm transition-all ${
              draggedIdx === idx ? 'opacity-50 border-primary border-dashed' : 'border-outline-variant hover:border-outline cursor-grab active:cursor-grabbing'
            }`}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <span className="material-symbols-outlined text-outline text-[18px]">drag_indicator</span>
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                {idx + 1}
              </div>
              <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full object-cover ml-1" />
              <div className="text-sm text-on-surface font-medium">{emp.name}</div>
              <div className="text-[11px] text-secondary">({emp.id})</div>
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
                onClick={() => { setShowAdd(false); setSearchQuery(''); }}
                className="text-secondary hover:text-error p-0.5 rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="max-h-[180px] overflow-y-auto p-1.5 flex flex-col gap-1">
              {filteredToAdd.length === 0 ? (
                <div className="text-xs text-secondary text-center py-4 italic">Không tìm thấy nhân sự nào</div>
              ) : (
                filteredToAdd.map(e => (
                  <button
                    key={e.id}
                    onClick={() => addSpecificUser(e.id)}
                    className="flex items-center gap-2.5 p-2 hover:bg-surface-container-low rounded text-left transition-colors cursor-pointer"
                  >
                    <img src={e.avatar} alt={e.name} className="w-7 h-7 rounded-full object-cover border border-outline-variant/50" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-on-surface truncate">{e.name}</div>
                      <div className="text-[10px] text-secondary truncate">{e.id} • {e.role}</div>
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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedEmp = EMPLOYEES.find(e => e.name === value || e.id === value);
  const filtered = EMPLOYEES.filter(e => 
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
              <span className="text-[10px] text-secondary leading-tight">{selectedEmp.id} - {selectedEmp.role}</span>
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
                filtered.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onChange(e.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded text-left transition-colors cursor-pointer relative z-50 ${
                      value === e.name ? 'bg-primary-container/40' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <img src={e.avatar} alt={e.name} className="w-7 h-7 rounded-full object-cover border border-outline-variant/50" />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${value === e.name ? 'text-primary' : 'text-on-surface'}`}>{e.name}</div>
                      <div className="text-[10px] text-secondary truncate">{e.id} • {e.role}</div>
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

function RadioCard({ checked, onClick, title, desc, name }) {
  return (
    <label
      className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-colors flex-1 ${
        checked ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:bg-surface-container-low'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onClick} className="mt-0.5 text-primary focus:ring-primary cursor-pointer" />
      <div>
        <div className={`text-sm font-medium ${checked ? 'text-primary' : 'text-on-surface'}`}>{title}</div>
        {desc && <div className="text-xs text-secondary mt-0.5">{desc}</div>}
      </div>
    </label>
  );
}

export default function WorkflowTab() {
  const [formType, setFormType] = useState(FORM_TYPES[0]);

  const [workflows, setWorkflows] = useState(() => {
    const init = {};
    FORM_TYPES.forEach((t, i) => {
      if (i === 0) {
        init[t] = [...INITIAL_WORKFLOW];
      } else {
        // Create slightly varied initial steps so changing tabs has a visual effect
        init[t] = INITIAL_WORKFLOW.slice(0, (i % 3) + 1).map(s => ({...s, id: `${s.id}_${i}`}));
      }
    });
    return init;
  });
  const [saved, setSaved] = useState(false);

  const steps = workflows[formType] || [];

  const updateStep = (id, patch) =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: prev[formType].map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  const removeStep = (id) => 
    setWorkflows((prev) => ({
      ...prev,
      [formType]: prev[formType].filter((s) => s.id !== id),
    }));
  const addStep = () =>
    setWorkflows((prev) => ({
      ...prev,
      [formType]: [
        ...prev[formType],
        {
          id: `s${prev[formType].length + 1}-${Math.floor(Math.random() * 1000)}`,
          name: 'Bước duyệt mới',
          approvalType: 'hierarchy',
          hierarchyOption: 'manager',
          chainStart: 'leader',
          chainEnd: 'manager',
          role: APPROVAL_ROLES[0],
          specificUser: SPECIFIC_USERS[0],
          multiRule: 'sequential',
          timeoutEnabled: true,
          timeoutAction: 'return',
        },
      ],
    }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Form type selector */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-primary">tune</span>
          <span className="font-label-md text-on-surface font-semibold">Cấu hình luồng duyệt cho:</span>
        </div>
        
        <select className={`${selectCls} max-w-xs`} value={formType} onChange={(e) => setFormType(e.target.value)}>
          {FORM_TYPES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Vertical step list */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          // Chỉ hiển thị quy tắc đa người duyệt nếu kiểu duyệt có khả năng ra nhiều người (VD: Vai trò)
          const showMulti = step.approvalType === 'role';
          return (
            <div key={step.id} className="relative pl-8 pb-4">
              {/* connector + number */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-xs flex-shrink-0 z-10">
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && <div className="flex-1 w-px bg-outline-variant my-1" />}
              </div>

              <div className="bg-surface rounded-lg border border-outline-variant shadow-sm">
                {/* Step header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/50">
                  <span className="material-symbols-outlined text-outline cursor-grab" title="Kéo để sắp xếp">drag_indicator</span>
                  <input
                    className={`flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none border-b border-transparent focus:border-primary ${idx === 0 ? 'placeholder:text-secondary' : ''}`}
                    value={step.name}
                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                  />
                  <span className="text-xs text-secondary px-2 py-0.5 bg-surface-container-low rounded">Bước {idx + 1}</span>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                    title="Xoá bước"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  {/* Section A - Kiểu duyệt */}
                  <div>
                    <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">A. Kiểu duyệt</div>
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
                    {/* conditional config */}
                    <div className="mt-2">
                      {step.approvalType === 'hierarchy' && (
                        <select className={`${selectCls} max-w-md`} value={step.hierarchyOption} onChange={(e) => updateStep(step.id, { hierarchyOption: e.target.value })}>
                          {HIERARCHY_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      )}
                      {step.approvalType === 'role' && (
                        <select className={`${selectCls} max-w-md`} value={step.role} onChange={(e) => updateStep(step.id, { role: e.target.value })}>
                          {APPROVAL_ROLES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      )}
                      {step.approvalType === 'specific' && (
                        <UserSelect 
                          value={step.specificUser} 
                          onChange={(val) => updateStep(step.id, { specificUser: val })} 
                        />
                      )}
                      {step.approvalType === 'chain' && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-primary-container/10 p-3 rounded-md border border-primary/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-secondary">Bắt đầu từ:</span>
                            <select className={`${selectCls} min-w-[180px]`} value={step.chainStart || 'leader'} onChange={(e) => updateStep(step.id, { chainStart: e.target.value })}>
                              <option value="leader">Tổ trưởng / Trưởng nhóm</option>
                              <option value="deputy_manager">Phó phòng</option>
                              <option value="manager">Trưởng phòng</option>
                            </select>
                          </div>
                          <span className="material-symbols-outlined text-outline hidden sm:block">arrow_forward</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-secondary">Tối đa đến:</span>
                            <select className={`${selectCls} min-w-[180px]`} value={step.chainEnd || 'manager'} onChange={(e) => updateStep(step.id, { chainEnd: e.target.value })}>
                              <option value="deputy_manager">Phó phòng</option>
                              <option value="manager">Trưởng phòng</option>
                              <option value="higher">Giám đốc / TGĐ</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B - Multi approver rule */}
                  {showMulti && (
                    <div className="border-t border-outline-variant/50 pt-3">
                      <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">B. Quy tắc đa người duyệt</div>
                      <div className="text-[11px] text-secondary mb-2 bg-surface-container-low p-2 rounded border border-outline-variant/30 italic">
                        * Áp dụng khi bước này có nhiều người cùng tham gia duyệt (VD: Có nhiều người cùng giữ vai trò {step.role || 'này'}).
                      </div>
                      <div className="flex flex-col gap-2">
                        {MULTI_RULES.map((r) => (
                          <label key={r.id} className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${step.multiRule === r.id ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:bg-surface-container-low'}`}>
                            <input type="radio" name={`multi-${step.id}`} checked={step.multiRule === r.id} onChange={() => updateStep(step.id, { multiRule: r.id })} className="mt-0.5 text-primary focus:ring-primary cursor-pointer" />
                            <div>
                              <div className={`text-sm font-medium ${step.multiRule === r.id ? 'text-primary' : 'text-on-surface'}`}>{r.label}</div>
                              <div className="text-xs text-secondary mt-0.5">{r.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      {step.multiRule === 'sequential' && (
                        <SequentialOrderList 
                          role={step.role} 
                          order={step.sequentialOrder} 
                          onChange={(newOrder) => updateStep(step.id, { sequentialOrder: newOrder })} 
                        />
                      )}
                    </div>
                  )}

                  {/* Section C - Timeout */}
                  <div className="border-t border-outline-variant/50 pt-3">
                    <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">C. Quy tắc xử lý quá hạn 12 giờ</div>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={step.timeoutEnabled} onChange={(e) => updateStep(step.id, { timeoutEnabled: e.target.checked })} className="text-primary focus:ring-primary rounded cursor-pointer" />
                      <span className="text-sm text-on-surface">Tự động chuyển trả đơn sau 12 giờ không xử lý</span>
                    </label>
                    {step.timeoutEnabled && (
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-xs text-secondary">Hành động:</span>
                        <select className={`${selectCls} max-w-sm`} value={step.timeoutAction} onChange={(e) => updateStep(step.id, { timeoutAction: e.target.value })}>
                          <option value="return">Chuyển trả về nơi khởi tạo (Người tạo đơn)</option>
                          <option value="escalate">Tự động chuyển cấp lên trên</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
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
