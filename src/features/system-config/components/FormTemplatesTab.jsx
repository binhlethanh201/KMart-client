import { useState } from 'react';
import { FORM_TYPES, FORM_FIELDS } from '../data/mockData';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function FormTemplatesTab() {
  const [selectedForm, setSelectedForm] = useState(FORM_TYPES[0]);
  const [fields, setFields] = useState(FORM_FIELDS);

  const current = fields[selectedForm] || [];

  const updateField = (idx, patch) =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: prev[selectedForm].map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));

  const addField = () =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: [
        ...prev[selectedForm],
        { id: `field_${Date.now()}`, label: 'Trường mới', type: 'Văn bản', required: false, dynamic: '' },
      ],
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      {/* Form templates list */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
          <h3 className="font-label-md text-on-surface font-semibold uppercase tracking-wide">Mẫu đơn</h3>
        </div>
        <ul className="flex flex-col p-1.5">
          {FORM_TYPES.map((f) => {
            const active = f === selectedForm;
            return (
              <li key={f}>
                <button
                  onClick={() => setSelectedForm(f)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                    active ? 'bg-primary-container/40 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{active ? 'description' : 'draft'}</span>
                  {f}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Field management table */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Quản lý trường: {selectedForm}</h3>
            <p className="text-xs text-secondary mt-0.5">Cấu hình trường dữ liệu và điều kiện hiển thị động</p>
          </div>
          <button
            onClick={addField}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm trường mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left border-b border-outline-variant">
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Tên trường</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Mã field</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Kiểu dữ liệu</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Bắt buộc</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Field động / Điều kiện</th>
              </tr>
            </thead>
            <tbody>
              {current.map((f, idx) => (
                <tr key={f.id} className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low/60 transition-colors">
                  <td className="px-4 py-3 text-on-surface font-medium">{f.label}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-surface-container text-primary px-1.5 py-0.5 rounded">{f.id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-secondary">
                      <span className="material-symbols-outlined text-[14px]">
                        {f.type === 'Tải file' ? 'attach_file' : f.type === 'Ngày' ? 'calendar_month' : f.type === 'Số' ? 'numbers' : f.type === 'Lựa chọn' ? 'list_alt' : 'text_fields'}
                      </span>
                      {f.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={f.required} onChange={(v) => updateField(idx, { required: v })} label="Bắt buộc" />
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <Toggle checked={Boolean(f.dynamic)} onChange={(v) => updateField(idx, { dynamic: v ? 'Hiển thị khi...' : '' })} label="Field động" />
                      {f.dynamic && (
                        <span className="text-xs text-secondary truncate" title={f.dynamic}>{f.dynamic}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
