import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import DepartmentIconPicker from './DepartmentIconPicker';
import { useI18n } from '../../../i18n/I18nProvider';

const TYPES = ['Phòng ban', 'Khối chuyên môn', 'Siêu thị / Chi nhánh'];

const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';
const inputCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
// BE-70: ô sai định dạng được tô đỏ để người dùng thấy ngay chỗ cần sửa.
const inputErrCls =
  'w-full rounded-md border border-error bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error';
const cardCls = 'bg-surface border border-outline-variant/60 rounded-lg p-4';

// BE-70: quy tắc phải KHỚP với backend (K_Market_Application/Validators/DepartmentValidators.cs)
// để lỗi hiện ngay trong form thay vì gửi lên máy chủ rồi nhận "Validation failed".
const CODE_RE = /^[A-Z0-9_]+$/;
const NAME_MIN = 2;
const NAME_MAX = 100;
const CODE_MIN = 2;
const CODE_MAX = 20;

// Searchable single-select for an employee.
export function EmployeeSelect({ employees, value, onChange, placeholder, exclude = [], allowClear = false }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = employees.filter(
    (e) =>
      !exclude.includes(e.id) &&
      (!q ||
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.id.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} text-left flex items-center justify-between cursor-pointer hover:border-primary transition-colors`}
      >
        {value ? (
          <span className="flex items-center gap-2 min-w-0">
            <img className="w-6 h-6 rounded-full object-cover flex-shrink-0" src={value.avatar} alt={value.name} />
            <span className="truncate text-on-surface">{value.name}</span>
            <span className="text-xs text-secondary">- {value.id.substring(0, 8).toUpperCase()}</span>
          </span>
        ) : (
          <span className="text-secondary">{placeholder}</span>
        )}
        <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-surface border border-outline-variant rounded-md shadow-lg max-h-56 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-outline-variant relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
              search
            </span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-sm outline-none focus:border-primary"
              placeholder={t('Tìm nhân sự...')}
            />
          </div>
          <ul className="overflow-y-auto">
            {allowClear && value && (
              <li className="border-b border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                    setQ('');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                  <span className="text-sm">{t('Bỏ chọn')} {placeholder}</span>
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-secondary italic">{t('Không tìm thấy nhân sự.')}</li>
            ) : (
              filtered.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(e);
                      setOpen(false);
                      setQ('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <img className="w-7 h-7 rounded-full object-cover" src={e.avatar} alt={e.name} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-on-surface truncate">{e.name}</span>
                      <span className="block text-xs text-secondary truncate">
                        {e.id.substring(0, 8).toUpperCase()} - {t(e.position)} - {t(e.department)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AddDepartmentModal({ onClose }) {
  const { t } = useI18n();
  const { employees, departments = [], addDepartment } = useApproval();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [status, setStatus] = useState('active');
  const [icon, setIcon] = useState('campaign');
  const [iconImage, setIconImage] = useState(null);
  const [head, setHead] = useState(null);
  const [deputy, setDeputy] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState([]); // [{ employee, assignment }]
  // BE-70: lỗi kiểm tra dữ liệu hiện ngay dưới ô nhập.
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const excludeIds = [
    ...(head ? [head.id] : []),
    ...(deputy ? [deputy.id] : []),
    ...members.map((m) => m.employee.id),
  ];

  const memberResults = employees.filter(
    (e) =>
      !excludeIds.includes(e.id) &&
      (!memberQuery ||
        e.name.toLowerCase().includes(memberQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(memberQuery.toLowerCase()))
  );

  const addMember = (emp) => {
    setMembers((m) => [...m, { employee: emp, assignment: 'primary' }]);
    setMemberQuery('');
  };
  const removeMember = (id) => setMembers((m) => m.filter((x) => x.employee.id !== id));
  const setAssignment = (id, assignment) =>
    setMembers((m) => m.map((x) => (x.employee.id === id ? { ...x, assignment } : x)));

  // BE-70: kiểm tra ngay trên form, dùng ĐÚNG câu chữ mà backend trả về để thông báo
  // được dịch đồng nhất ở cả 3 ngôn ngữ.
  const validate = () => {
    const next = {};
    const codeValue = code.trim();
    const nameValue = name.trim();

    if (!codeValue) next.code = t('Vui lòng nhập mã phòng ban');
    else if (codeValue.length < CODE_MIN) next.code = t('Mã phòng ban tối thiểu 2 ký tự');
    else if (codeValue.length > CODE_MAX) next.code = t('Mã phòng ban tối đa 20 ký tự');
    else if (!CODE_RE.test(codeValue)) next.code = t('Mã phòng ban chỉ gồm chữ in hoa, số và dấu gạch dưới');
    else {
      // BE-71: kiểm tra mã TRƯỚC khi gửi lên máy chủ, và nói rõ phòng ban nào đang giữ mã
      // kèm trạng thái — trước đây chỉ nhận lại "Mã … đã thuộc phòng ban …" sau khi bấm Lưu,
      // nên người dùng hiểu nhầm là phải xoá phòng ban cũ mới tạo được.
      const owner = departments.find(
        (d) => String(d.code || '').trim().toUpperCase() === codeValue
      );
      if (owner) {
        next.code = owner.status === 'Active'
          ? t('Mã "{v0}" đã thuộc phòng ban "{v1}" (đang hoạt động). Hãy dùng mã khác, hoặc xoá phòng ban đó trước khi tạo mới.', { v0: codeValue, v1: owner.name })
          : t('Mã "{v0}" đã thuộc phòng ban "{v1}" (đang ngừng hoạt động). Hãy dùng mã khác, hoặc bật lại / xoá hẳn phòng ban đó trước khi tạo mới.', { v0: codeValue, v1: owner.name });
      }
    }

    if (!nameValue) next.name = t('Vui lòng nhập tên phòng ban');
    else if (nameValue.length < NAME_MIN) next.name = t('Tên phòng ban tối thiểu 2 ký tự');
    else if (nameValue.length > NAME_MAX) next.name = t('Tên phòng ban tối đa 100 ký tự');

    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.querySelector(`[data-field="dept-${Object.keys(found)[0]}"]`);
      first?.focus?.();
      first?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return;
    }

    setSaving(true);
    // BE-70: chờ máy chủ trả kết quả rồi mới đóng form. Trước đây form đóng ngay sau khi
    // gửi nên khi máy chủ từ chối, người dùng mất hết dữ liệu vừa nhập và không hiểu lỗi gì.
    const createdId = await addDepartment({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      status,
      icon,
      iconImage,
      head,
      deputy,
      members,
    });
    setSaving(false);
    if (createdId) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Thêm mới Phòng ban / Đơn vị')}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">add_business</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{t('Thêm mới Phòng ban / Đơn vị')}</h2>
              <p className="text-xs text-secondary mt-0.5">
                {t('Tạo đơn vị mới và phân bổ nhân sự trực thuộc.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant cursor-pointer"
            aria-label={t('Đóng')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body: 2 columns */}
        <div className="grid md:grid-cols-2 gap-5 p-5 overflow-y-auto">
          {/* LEFT: Department metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              {t('Thông tin Đơn vị')}
            </h3>

            <div>
              <label className={labelCls}>
                {t('Mã đơn vị')} <span className="text-error">*</span>
              </label>
              <input
                data-field="dept-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={errors.code ? inputErrCls : inputCls}
                placeholder="VD: HR-01, LOG-01"
              />
              {errors.code
                ? <p className="text-xs text-error mt-1">{errors.code}</p>
                : <p className="text-xs text-secondary mt-1">{t('Tự động viết hoa.')}</p>}
            </div>

            <div>
              <label className={labelCls}>
                {t('Tên đơn vị / Phòng ban')} <span className="text-error">*</span>
              </label>
              <input
                data-field="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? inputErrCls : inputCls}
                placeholder={t('VD: Phòng Hành chính Nhân sự')}
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={labelCls}>{t('Loại đơn vị')}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>{t('Trạng thái')}</label>
              <div className="flex gap-3">
                {[
                  { v: 'active', label: t('Đang hoạt động'), icon: 'check_circle' },
                  { v: 'inactive', label: t('Ngừng hoạt động'), icon: 'cancel' },
                ].map((s) => (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => setStatus(s.v)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer ${
                      status === s.v
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <DepartmentIconPicker
                icon={icon}
                iconImage={iconImage}
                onChange={({ icon: newIcon, iconImage: newImg }) => {
                  if (newIcon !== undefined) setIcon(newIcon);
                  if (newImg !== undefined) setIconImage(newImg);
                }}
              />
            </div>
          </div>

          {/* RIGHT: Personnel assignment */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">group_add</span>
              {t('Phân bổ Nhân sự')}
            </h3>

            <div className={`${cardCls} space-y-3`}>
              <div>
                <label className={labelCls}>
                  {type === 'Siêu thị / Chi nhánh' ? t('Cửa hàng trưởng') : t('Trưởng phòng')}
                </label>
                <EmployeeSelect
                  employees={employees}
                  value={head}
                  onChange={setHead}
                  placeholder={t('Chọn trưởng phòng / cửa hàng trưởng...')}
                  exclude={deputy ? [deputy.id] : []}
                />
              </div>
              <div>
                <label className={labelCls}>{t('Phó phòng')}</label>
                <EmployeeSelect
                  employees={employees}
                  value={deputy}
                  onChange={setDeputy}
                  placeholder={t('Chọn phó phòng (có thể bỏ trống)...')}
                  exclude={head ? [head.id] : []}
                />
              </div>
            </div>

            <div className={`${cardCls} space-y-3`}>
              <label className={labelCls}>{t('Thêm thành viên vào phòng')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className={`${inputCls} pl-9`}
                  placeholder={t('Tìm nhân sự theo tên, mã NV...')}
                  type="text"
                />
              </div>

              {/* Search results */}
              {memberQuery && (
                <ul className="border border-outline-variant rounded-md max-h-40 overflow-y-auto divide-y divide-outline-variant">
                  {memberResults.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-secondary italic">{t('Không tìm thấy nhân sự.')}</li>
                  ) : (
                    memberResults.slice(0, 6).map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => addMember(e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <img className="w-6 h-6 rounded-full object-cover" src={e.avatar} alt={e.name} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-on-surface truncate">{e.name}</span>
                            <span className="block text-xs text-secondary truncate">{e.id.substring(0, 8).toUpperCase()} - {t(e.position)}</span>
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}

              {/* Selected members with primary/kiêm nhiệm toggle */}
              {members.length > 0 && (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.employee.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-surface-container-low border border-outline-variant/60"
                    >
                      <img
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        src={m.employee.avatar}
                        alt={m.employee.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface truncate">{m.employee.name}</p>
                        <p className="text-xs text-secondary truncate">{m.employee.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      {/* Assignment toggle */}
                      <div className="flex bg-surface-container-highest rounded-md p-0.5 flex-shrink-0">
                        {[
                          { v: 'primary', label: t('Chính') },
                          { v: 'secondary', label: t('Kiêm nhiệm') },
                        ].map((opt) => {
                          const active = m.assignment === opt.v;
                          return (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => setAssignment(m.employee.id, opt.v)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                active ? 'bg-primary text-on-primary' : 'text-secondary hover:text-on-surface'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(m.employee.id)}
                        className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-error-container/40 cursor-pointer flex-shrink-0"
                        aria-label={t('Xóa thành viên')}
                      >
                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {members.length === 0 && !memberQuery && (
                <p className="text-xs text-secondary italic flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {t('Chưa chọn thành viên nào. Tìm và thêm nhân sự ở trên.')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 border-t border-outline-variant flex items-center justify-between gap-2 flex-shrink-0">
          <p className="text-xs text-secondary">
            {members.length + (head ? 1 : 0) + (deputy ? 1 : 0)} {t('nhân sự sẽ được phân bổ.')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
            >
              {t('Hủy')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant px-5 py-2 rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {saving ? t('Đang tạo...') : t('Tạo đơn vị mới')}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}
