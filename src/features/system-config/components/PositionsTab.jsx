import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { positionService } from '../../hr/services/positionService';
import { useHr } from '../../hr/context/HrProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import { useApproval } from '../../../context/useApproval';
import { describeApiError } from '../../../utils/apiError';
import { notifyHrDataChanged } from '../../../utils/hrEvents';
import { FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS, FILTER_SELECT_CLS } from '../../../styles/filterControls';
import Select from '../../../components/Select';

/**
 * BE-99: màn quản lý CHỨC VỤ & CẤP BẬC.
 *
 * Trước đây chức vụ chỉ sửa được qua API: giao diện chỉ ĐỌC danh sách để hiển thị/dropdown, nên
 * không thể bổ sung các chức danh của sơ đồ tổ chức K&K Global (Tổng giám đốc, Giám đốc khối,
 * Trưởng ban, Kiểm soát viên...). Cấp bậc rất quan trọng vì bộ duyệt dùng nó để chọn người duyệt
 * khi sơ đồ phòng ban chưa phân cấp.
 */
const LEVELS = [
  { value: 1, code: 'STAFF', label: 'Nhân viên' },
  { value: 2, code: 'SENIOR', label: 'Chuyên viên / Cán bộ' },
  { value: 3, code: 'LEADER', label: 'Trưởng nhóm' },
  { value: 4, code: 'DEPUTY_HEAD', label: 'Phó phòng / Phó ban' },
  { value: 5, code: 'MANAGER', label: 'Trưởng phòng / Trưởng ban' },
  { value: 6, code: 'DIRECTOR', label: 'Giám đốc khối / Giám đốc chức năng' },
  { value: 7, code: 'CEO', label: 'Tổng giám đốc' },
  { value: 8, code: 'ADMIN', label: 'Quản trị hệ thống' },
];
const LEVEL_BY_VALUE = LEVELS.reduce((acc, l) => { acc[l.value] = l; return acc; }, {});
const levelLabel = (v) => LEVEL_BY_VALUE[v]?.label || `Cấp ${v}`;

const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';
const inputCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const inputErrCls =
  'w-full rounded-md border border-error bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error';
const CODE_RE = /^[A-Z0-9_]+$/;

function PositionModal({ position, onClose, onSaved }) {
  const { t } = useI18n();
  const isEdit = Boolean(position);
  const [name, setName] = useState(position?.name || '');
  const [code, setCode] = useState(position?.code || '');
  const [level, setLevel] = useState(position?.level ?? 1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const validate = () => {
    const next = {};
    const n = name.trim();
    const c = code.trim().toUpperCase();
    if (!n) next.name = t('Vui lòng nhập tên chức vụ');
    else if (n.length < 2) next.name = t('Tên chức vụ tối thiểu 2 ký tự');
    else if (n.length > 100) next.name = t('Tên chức vụ tối đa 100 ký tự');

    if (!c) next.code = t('Vui lòng nhập mã chức vụ');
    else if (c.length < 2) next.code = t('Mã chức vụ tối thiểu 2 ký tự');
    else if (c.length > 20) next.code = t('Mã chức vụ tối đa 20 ký tự');
    else if (!CODE_RE.test(c)) next.code = t('Mã chức vụ chỉ gồm chữ in hoa, số và dấu gạch dưới');

    if (!LEVEL_BY_VALUE[level]) next.level = t('Cấp bậc chức vụ không hợp lệ');
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    const res = await onSaved({
      id: position?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      level: Number(level),
    });
    setSaving(false);
    if (res?.ok) onClose();
    else setErrors({ submit: res?.message || t('Không lưu được chức vụ') });
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
        className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-start p-5 border-b border-outline-variant/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">{isEdit ? 'edit' : 'add'}</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {isEdit ? t('Sửa chức vụ') : t('Thêm chức vụ')}
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                {t('Cấp bậc dùng để chọn người duyệt khi luồng duyệt theo cấp quản lý.')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant cursor-pointer disabled:opacity-40" aria-label={t('Đóng')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>{t('Tên chức vụ')} <span className="text-error">*</span></label>
            <input
              data-field="pos-name"
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: null, submit: null })); }}
              className={errors.name ? inputErrCls : inputCls}
              placeholder={t('VD: Tổng giám đốc')}
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            {isEdit && name.trim() !== position.name && (
              <p className="text-xs text-warning mt-1 flex items-start gap-1">
                <span className="material-symbols-outlined text-[14px] mt-px">warning</span>
                {t('Đổi tên chức vụ KHÔNG tự cập nhật các bước duyệt đang dùng tên cũ — hãy kiểm tra lại màn Cấu hình luồng duyệt.')}
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>{t('Mã chức vụ')} <span className="text-error">*</span></label>
            <input
              data-field="pos-code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrors((x) => ({ ...x, code: null, submit: null })); }}
              className={errors.code ? inputErrCls : inputCls}
              placeholder="VD: CEO, MGR, STAFF"
            />
            {errors.code ? <p className="text-xs text-error mt-1">{errors.code}</p> : <p className="text-xs text-secondary mt-1">{t('Tự động viết hoa, không dấu.')}</p>}
          </div>

          <div>
            <label className={labelCls}>{t('Cấp bậc')}</label>
            <Select
              data-field="pos-level"
              value={level}
              onChange={(v) => { setLevel(Number(v)); setErrors((x) => ({ ...x, level: null, submit: null })); }}
              className={inputCls}
              options={LEVELS.map((l) => ({ value: l.value, label: `${l.value}. ${t(l.label)}` }))}
            />
            <p className="text-xs text-secondary mt-1">
              {t('Số càng lớn cấp càng cao. Luồng duyệt "cấp quản lý trực tiếp / chuỗi quản lý" dựa vào thứ tự này.')}
            </p>
            {errors.level && <p className="text-xs text-error mt-1">{errors.level}</p>}
          </div>

          {errors.submit && (
            <p className="text-xs text-error flex items-start gap-1">
              <span className="material-symbols-outlined text-[14px] mt-px">error</span>
              {errors.submit}
            </p>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-40">
            {t('Hủy')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="font-label-md text-on-primary bg-primary px-5 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'progress_activity' : 'save'}
            </span>
            {saving ? t('Đang lưu...') : t('Lưu chức vụ')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function PositionsTab() {
  const { t } = useI18n();
  const { employees } = useHr();
  const { pushToast, hasPermission } = useApproval();

  const canManage = hasPermission ? (hasPermission('ROLE_MANAGE') || hasPermission('USER_UPDATE')) : true;

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [modal, setModal] = useState(null); // { position } | { position: null } để thêm mới

  const load = () => {
    setLoading(true);
    positionService.getAll()
      .then((data) => { setPositions(data || []); setError(null); })
      .catch((err) => { console.error('Failed to load positions', err); setError(t('Không tải được danh sách chức vụ.')); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  /** Số nhân sự đang giữ từng chức vụ (đếm từ danh sách nhân sự đã có sẵn trong app). */
  const userCountByPosition = useMemo(() => {
    const counts = {};
    (employees || []).forEach((e) => {
      (e.allPositions || []).forEach((p) => {
        if (p.positionId) counts[p.positionId] = (counts[p.positionId] || 0) + 1;
      });
    });
    return counts;
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return positions.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const matchLevel = levelFilter === 'all' || String(p.level) === String(levelFilter);
      return matchQ && matchLevel;
    }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'vi'));
  }, [positions, search, levelFilter]);

  const save = async (payload) => {
    try {
      if (payload.id) await positionService.update(payload.id, { name: payload.name, code: payload.code, level: payload.level });
      else await positionService.create({ name: payload.name, code: payload.code, level: payload.level });
      pushToast(payload.id ? t('Đã cập nhật chức vụ') : t('Đã thêm chức vụ'), 'success');
      load();
      // BE-99: báo cho nơi khác (form nhân sự, cấu hình luồng duyệt, bộ lọc báo cáo) nạp lại
      // danh sách chức vụ — nếu không, chức vụ vừa thêm không xuất hiện trong các dropdown đó.
      notifyHrDataChanged();
      return { ok: true };
    } catch (err) {
      console.error('Save position failed', err);
      return { ok: false, message: describeApiError(err, t, 'Không lưu được chức vụ') };
    }
  };

  const remove = async (p) => {
    const used = userCountByPosition[p.id] || 0;
    if (used > 0) {
      pushToast(t('Chức vụ "{v0}" đang được gán cho {v1} nhân sự — chuyển họ sang chức vụ khác trước khi xoá.', { v0: p.name, v1: used }), 'error');
      return;
    }
    if (!window.confirm(t('Xoá chức vụ "{v0}"? Thao tác này không thể hoàn tác.', { v0: p.name }))) return;
    try {
      await positionService.remove(p.id);
      pushToast(t('Đã xoá chức vụ'), 'success');
      load();
      notifyHrDataChanged();
    } catch (err) {
      console.error('Delete position failed', err);
      pushToast(describeApiError(err, t, 'Không xoá được chức vụ'), 'error');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <span className={FILTER_SEARCH_ICON_CLS}>search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={FILTER_SEARCH_CLS}
            placeholder={t('Tìm theo tên hoặc mã chức vụ...')}
            type="text"
          />
        </div>
        <Select
          value={levelFilter}
          onChange={setLevelFilter}
          className={FILTER_SELECT_CLS}
          options={[
            { value: 'all', label: t('Cấp bậc: Tất cả') },
            ...LEVELS.map((l) => ({ value: String(l.value), label: `${l.value}. ${t(l.label)}` })),
          ]}
        />
        <span className="text-sm text-secondary ml-auto">{t('{v0} chức vụ', { v0: filtered.length })}</span>
        {canManage && (
          <button
            onClick={() => setModal({ position: null })}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('Thêm chức vụ')}
          </button>
        )}
      </div>

      <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
        {/* BE-137: cuộn ngang trên màn hẹp thay vì cắt mất cột */}
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="bg-[#f6f6f4] text-[12px] uppercase tracking-wide text-secondary">
              <th className="px-4 py-3 font-semibold">{t('Tên chức vụ')}</th>
              <th className="px-4 py-3 font-semibold">{t('Mã')}</th>
              <th className="px-4 py-3 font-semibold">{t('Cấp bậc')}</th>
              <th className="px-4 py-3 font-semibold">{t('Nhân sự đang giữ')}</th>
              <th className="px-4 py-3 font-semibold text-right">{t('Thao tác')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[28px] block mb-2 animate-spin">progress_activity</span>
                {t('Đang tải danh sách chức vụ...')}
              </td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-error">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-secondary">{t('Không có chức vụ nào phù hợp.')}</td></tr>
            ) : filtered.map((p) => {
              const used = userCountByPosition[p.id] || 0;
              return (
                <tr key={p.id} className="border-t border-outline-variant/60 hover:bg-surface-container-low/50">
                  <td className="px-4 py-3 text-on-surface font-medium">{t(p.name)}</td>
                  <td className="px-4 py-3 text-secondary font-mono text-[13px]">{p.code}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-on-surface">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[12px] font-bold flex items-center justify-center">{p.level}</span>
                      {t(levelLabel(p.level))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-secondary">{used > 0 ? t('{v0} nhân sự', { v0: used }) : '—'}</td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ position: p })}
                          title={t('Chỉnh sửa')}
                          className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary-container/30 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => remove(p)}
                          title={t('Xoá chức vụ')}
                          disabled={used > 0}
                          className={`p-1.5 rounded-md cursor-pointer ${used > 0 ? 'text-outline opacity-40 cursor-not-allowed' : 'text-secondary hover:text-error hover:bg-error-container/40'}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[12px] text-secondary bg-[#f6f6f4] border border-outline-variant rounded-lg px-3 py-2.5">
        <span className="material-symbols-outlined text-[16px] text-warning flex-shrink-0 mt-px">info</span>
        <span>
          {t('Bước duyệt "Duyệt theo chức danh" khớp theo TÊN chức vụ, nên tên chức vụ phải là duy nhất và không nên đổi tên sau khi đã cấu hình luồng duyệt.')}
        </span>
      </div>

      {modal && (
        <PositionModal
          position={modal.position}
          onClose={() => setModal(null)}
          onSaved={save}
        />
      )}
    </section>
  );
}
