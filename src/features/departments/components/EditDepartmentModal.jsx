import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import DepartmentIconPicker from './DepartmentIconPicker';
import { EmployeeSelect } from './AddDepartmentModal';
import Select from '../../../components/Select';
import { departmentService } from '../services/departmentService';
import { formatDateOfBirth } from '../../../utils/dateFormat';
import { useI18n } from '../../../i18n/I18nProvider';

const TYPES = ['Phòng ban', 'Khối chuyên môn', 'Siêu thị / Chi nhánh'];

const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';
const inputCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
// BE-70: ô sai định dạng được tô đỏ (giống form Thêm mới).
const inputErrCls =
  'w-full rounded-md border border-error bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error';

// BE-70: quy tắc phải KHỚP backend (DepartmentValidators.cs).
const CODE_RE = /^[A-Z0-9_]+$/;

export default function EditDepartmentModal({ department, onClose }) {
  const { t } = useI18n();
  const { updateDepartment, employees, departments = [] } = useApproval();
  
  const [code, setCode] = useState(department.code || '');
  const [name, setName] = useState(department.name || '');
  const [type, setType] = useState(department.type || TYPES[0]);
  // BE-98: đơn vị cấp trên ('' = đơn vị cấp cao nhất).
  const [parentId, setParentId] = useState(department.parentDepartmentId || '');
  // Không cho chọn chính nó hoặc đơn vị con/cháu làm cấp trên (tránh vòng lặp).
  const descendantIds = (() => {
    const out = new Set([department.id]);
    const childrenOf = (id) => (departments || []).filter((d) => d.parentDepartmentId === id);
    const walk = (id) => {
      childrenOf(id).forEach((child) => {
        if (out.has(child.id)) return;
        out.add(child.id);
        walk(child.id);
      });
    };
    walk(department.id);
    return out;
  })();
  const parentOptions = (departments || []).filter((d) => !descendantIds.has(d.id) && d.id !== department.id);
  const [icon, setIcon] = useState(department.icon || 'campaign');
  const [iconImage, setIconImage] = useState(department.iconImage || null);
  const [head, setHead] = useState(
    employees.find((e) => e.id === department.managerId) || null
  );
  const [deputy, setDeputy] = useState(
    employees.find((e) => e.id === department.deputyManagerId) || null
  );
  const isStore = type === 'Siêu thị / Chi nhánh';
  // BE-73: nạp danh sách nhân sự trực thuộc để có thể thêm/bớt ngay trong màn Chỉnh sửa.
  const [members, setMembers] = useState([]); // [{ employee, assignment }]
  const [memberQuery, setMemberQuery] = useState('');
  // Chỉ gửi danh sách thành viên lên máy chủ khi đã đọc thành công, tránh gỡ hết
  // nhân sự của phòng khi việc tải danh sách thất bại.
  const [membersLoaded, setMembersLoaded] = useState(false);
  // BE-70: lỗi kiểm tra dữ liệu hiện ngay dưới ô nhập thay vì đóng form rồi báo "Validation failed".
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    departmentService
      .getMembers(department.id)
      .then((list) => {
        if (!alive) return;
        setMembers(
          list.map((u) => {
            const pos = (u.positions || []).find((p) => p.departmentId === department.id);
            return { employee: u, assignment: pos?.isPrimary ? 'primary' : 'secondary' };
          })
        );
        setMembersLoaded(true);
      })
      .catch(() => {
        if (alive) setMembersLoaded(false);
      });
    return () => {
      alive = false;
    };
  }, [department.id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    const next = {};
    const codeValue = code.trim();
    const nameValue = name.trim();

    if (!codeValue) next.code = t('Vui lòng nhập mã phòng ban');
    else if (codeValue.length < 2) next.code = t('Mã phòng ban tối thiểu 2 ký tự');
    else if (codeValue.length > 20) next.code = t('Mã phòng ban tối đa 20 ký tự');
    else if (!CODE_RE.test(codeValue)) next.code = t('Mã phòng ban chỉ gồm chữ in hoa, số và dấu gạch dưới');
    else {
      // BE-71: báo trước nếu mã đang thuộc phòng ban KHÁC (bỏ qua chính phòng ban đang sửa).
      const owner = departments.find(
        (d) => d.id !== department.id && String(d.code || '').trim().toUpperCase() === codeValue
      );
      if (owner) {
        next.code = owner.status === 'Active'
          ? t('Mã "{v0}" đã thuộc phòng ban "{v1}" (đang hoạt động). Hãy dùng mã khác, hoặc xoá phòng ban đó trước khi tạo mới.', { v0: codeValue, v1: owner.name })
          : t('Mã "{v0}" đã thuộc phòng ban "{v1}" (đang ngừng hoạt động). Hãy dùng mã khác, hoặc bật lại / xoá hẳn phòng ban đó trước khi tạo mới.', { v0: codeValue, v1: owner.name });
      }
    }

    if (!nameValue) next.name = t('Vui lòng nhập tên phòng ban');
    else if (nameValue.length < 2) next.name = t('Tên phòng ban tối thiểu 2 ký tự');
    else if (nameValue.length > 100) next.name = t('Tên phòng ban tối đa 100 ký tự');

    return next;
  };

  const headId = head?.id;
  const deputyId = deputy?.id;
  const excludeIds = [
    ...(headId ? [headId] : []),
    ...(deputyId ? [deputyId] : []),
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
    setMembers((m) => [
      ...m,
      { employee: emp, assignment: m.some((x) => x.assignment === 'primary') ? 'secondary' : 'primary' },
    ]);
    setMemberQuery('');
  };
  const removeMember = (id) => {
    setMembers((m) => m.filter((x) => x.employee.id !== id));
    // Bỏ một người khỏi phòng thì đồng thời bỏ luôn chức danh trưởng/phó phòng của họ,
    // nếu không form vẫn gửi họ là trưởng phòng và máy chủ giữ nguyên trong phòng.
    if (headId === id) setHead(null);
    if (deputyId === id) setDeputy(null);
  };
  const setAssignment = (id, assignment) =>
    setMembers((m) =>
      m.map((x) => {
        if (x.employee.id === id) return { ...x, assignment };
        // Chọn "Chính" cho người này thì người đang giữ "Chính" trước đó chuyển sang "Kiêm nhiệm".
        if (assignment === 'primary' && x.assignment === 'primary') return { ...x, assignment: 'secondary' };
        return x;
      })
    );

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.querySelector(`[data-field="edit-dept-${Object.keys(found)[0]}"]`);
      first?.focus?.();
      first?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return;
    }

    setSaving(true);
    // BE-70: chờ máy chủ trả kết quả rồi mới đóng form để không mất dữ liệu khi bị từ chối.
    const updatedId = await updateDepartment(department.id, {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      // BE-98: đổi được đơn vị cấp trên ('' = đưa về cấp cao nhất).
      parentDepartmentId: parentId || null,
      icon,
      iconImage,
      head,
      deputy,
      // BE-73: chỉ gửi khi đã tải được danh sách, nếu không máy chủ sẽ hiểu là "gỡ hết nhân sự".
      ...(membersLoaded ? { members } : {}),
    });
    setSaving(false);
    if (updatedId) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">edit_document</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{t('Chỉnh sửa thông tin')}</h2>
              <p className="text-xs text-secondary mt-0.5">{t('Cập nhật tên và mã phòng ban')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={labelCls}>{t('Mã đơn vị')} <span className="text-error">*</span></label>
            <input
              data-field="edit-dept-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={errors.code ? inputErrCls : inputCls}
              placeholder="VD: HR-01"
            />
            {errors.code && <p className="text-xs text-error mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className={labelCls}>{t('Tên đơn vị / Phòng ban')} <span className="text-error">*</span></label>
            <input
              data-field="edit-dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? inputErrCls : inputCls}
              placeholder={t('VD: Phòng Hành chính Nhân sự')}
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={labelCls}>{t('Loại đơn vị')}</label>
            <Select
              value={type}
              onChange={setType}
              className={inputCls}
              options={TYPES.map((tp) => ({ value: tp, label: t(tp) }))}
            />
          </div>

          <div>
            <label className={labelCls}>{t('Đơn vị cấp trên')}</label>
            <Select
              data-field="edit-dept-parent"
              value={parentId}
              onChange={setParentId}
              className={inputCls}
              options={[
                { value: '', label: t('— Không có (đơn vị cấp cao nhất) —') },
                ...parentOptions.map((d) => ({ value: d.id, label: `${t(d.name)} (${d.code})` })),
              ]}
            />
            <p className="text-xs text-secondary mt-1">
              {t('Không hiển thị chính đơn vị này và các đơn vị trực thuộc (tránh vòng lặp).')}
            </p>
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

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>{isStore ? t('Cửa hàng trưởng') : t('Trưởng phòng')}</label>
              <EmployeeSelect
                employees={employees}
                value={head}
                onChange={setHead}
                placeholder={t('trưởng phòng')}
                exclude={deputy ? [deputy.id] : []}
                allowClear
              />
            </div>
            <div>
              <label className={labelCls}>{t('Phó phòng')}</label>
              <EmployeeSelect
                employees={employees}
                value={deputy}
                onChange={setDeputy}
                placeholder={t('phó phòng')}
                exclude={head ? [head.id] : []}
                allowClear
              />
              <p className="text-xs text-secondary mt-1">
                {t('Dùng cho bước duyệt “Phó phòng / Phó cửa hàng”. Để trống nếu không có.')}
              </p>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4 space-y-3">
            <label className={labelCls}>{t('Thành viên phòng ban')}</label>
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
                          <span className="block text-xs text-secondary truncate">
                            {e.id.substring(0, 8).toUpperCase()} - {t(e.position)}
                            {e.dateOfBirth ? ` - ${formatDateOfBirth(e.dateOfBirth)}` : ''}
                          </span>
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

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

            {membersLoaded && members.length === 0 && !memberQuery && (
              <p className="text-xs text-secondary italic flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {t('Phòng ban chưa có nhân sự trực thuộc.')}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 pt-0 mt-2 flex justify-end gap-2">
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
            className="font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant px-5 py-2 rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {t('Lưu thay đổi')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
