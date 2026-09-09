import { useState } from 'react';
import { FORM_TYPES, INITIAL_WORKFLOW, APPROVAL_TYPES, MULTI_RULES, APPROVAL_ROLES, SPECIFIC_USERS } from '../data/mockData';

const selectCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer';

const HIERARCHY_OPTIONS = [
  { id: 'direct', label: 'Quản lý trực tiếp (Trưởng phòng)' },
  { id: 'higher', label: 'Cấp quản lý cao hơn (Giám đốc khối / TGĐ)' },
];

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
  const [steps, setSteps] = useState(INITIAL_WORKFLOW);
  const [saved, setSaved] = useState(false);

  const updateStep = (id, patch) =>
    setSteps((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id) => setSteps((list) => list.filter((s) => s.id !== id));
  const addStep = () =>
    setSteps((list) => [
      ...list,
      {
        id: `s${list.length + 1}-${Math.floor(Math.random() * 1000)}`,
        name: 'Bước duyệt mới',
        approvalType: 'hierarchy',
        hierarchyOption: 'direct',
        role: APPROVAL_ROLES[0],
        specificUser: SPECIFIC_USERS[0],
        multiRule: 'sequential',
        timeoutEnabled: true,
        timeoutAction: 'return',
      },
    ]);

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
          const showMulti = step.approvalType === 'hierarchy' || step.approvalType === 'role';
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
                        <select className={`${selectCls} max-w-md`} value={step.specificUser} onChange={(e) => updateStep(step.id, { specificUser: e.target.value })}>
                          {SPECIFIC_USERS.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Section B - Multi approver rule */}
                  {showMulti && (
                    <div className="border-t border-outline-variant/50 pt-3">
                      <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">B. Quy tắc đa người duyệt</div>
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
                    </div>
                  )}

                  {/* Section C - Timeout BR11 */}
                  <div className="border-t border-outline-variant/50 pt-3">
                    <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">C. Quy tắc Timeout 12 Giờ (BR11)</div>
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
