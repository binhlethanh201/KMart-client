import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_CONTROL_CLS, FILTER_SELECT_CLS, FILTER_LABEL_CLS, FILTER_GHOST_BUTTON_CLS } from '../../../styles/filterControls';
import Select from '../../../components/Select';

export default function FilterBar({ filters, departments, documentTypes = [], positions = [], onChange }) {
  const { t } = useI18n();
  // BE-77/79: style lấy từ bộ dùng chung để mọi trang lọc giống nhau.
  const dateClass = `${FILTER_CONTROL_CLS} min-w-[180px]`;
  const selectClass = `${FILTER_SELECT_CLS} min-w-[180px]`;
  const labelClass = FILTER_LABEL_CLS;

  // Loại đơn vị (giá trị API trả về) thuộc mỗi khối — dùng chung cho cả việc lọc danh sách
  // phòng ban hiển thị và việc giữ/bỏ phòng ban đang chọn khi đổi khối.
  const blockTypes = (block) => {
    // So sánh với giá trị dữ liệu API trả về nên KHÔNG dịch.
    if (block === 'hq') return ['Phòng ban', 'Khối chuyên môn'];
    if (block === 'retail') return ['Siêu thị / Chi nhánh'];
    return null;
  };
  const deptMatchesBlock = (dept, block) => {
    const types = blockTypes(block);
    return !types || types.includes(dept.type);
  };

  const filteredDepartments = (departments || []).filter((d) => deptMatchesBlock(d, filters.block));

  return (
    <div className="p-2">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Từ ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Từ ngày')}</label>
          <input
            type="date"
            className={dateClass}
            value={filters.from || ''}
            onChange={(e) => onChange({ from: e.target.value || null })}
          />
        </div>

        {/* Đến ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Đến ngày')}</label>
          <input
            type="date"
            className={dateClass}
            value={filters.to || ''}
            onChange={(e) => onChange({ to: e.target.value || null })}
          />
        </div>

        {/* Khối */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Khối')}</label>
          <Select
            className={selectClass}
            value={filters.block || ''}
            onChange={(v) => {
              const nextBlock = v || null;
              // Chỉ bỏ phòng ban đang chọn khi nó KHÔNG còn thuộc khối vừa chọn.
              // Trước đây đổi khối luôn xoá phòng ban nên người dùng mất lựa chọn vừa lọc.
              const keepDepartment = (departments || []).some(
                (d) => d.id === filters.departmentId && deptMatchesBlock(d, nextBlock)
              );
              onChange(keepDepartment ? { block: nextBlock } : { block: nextBlock, departmentId: null });
            }}
            options={[
              { value: '', label: t('Tất cả khối') },
              { value: 'hq', label: t('Khối Văn phòng') },
              { value: 'retail', label: t('Khối Cửa hàng') },
            ]}
          />
        </div>

        {/* Phòng ban */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Phòng ban')}</label>
          <Select
            className={selectClass}
            value={filters.departmentId || ''}
            onChange={(v) => onChange({ departmentId: v || null })}
            options={[
              { value: '', label: t('Tất cả phòng ban') },
              ...filteredDepartments.map((d) => ({ value: d.id, label: t(d.name) })),
            ]}
          />
        </div>

        {/* Loại đơn */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Loại đơn')}</label>
          <Select
            className={selectClass}
            value={filters.documentTypeId || ''}
            onChange={(v) => onChange({ documentTypeId: v || null })}
            options={[
              { value: '', label: t('Tất cả loại đơn') },
              ...(documentTypes || []).map((dt) => ({ value: dt.id, label: t(dt.name) })),
            ]}
          />
        </div>

        {/* Chức vụ người tạo */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Chức vụ')}</label>
          <Select
            className={selectClass}
            value={filters.positionId || ''}
            onChange={(v) => onChange({ positionId: v || null })}
            options={[
              { value: '', label: t('Tất cả chức vụ') },
              ...(positions || []).map((p) => ({ value: p.id, label: t(p.name || p.positionName) })),
            ]}
          />
        </div>

        {/* TC-REP-003: Thêm lại bộ lọc trạng thái */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Trạng thái')}</label>
          <Select
            className={selectClass}
            value={filters.status || ''}
            onChange={(v) => onChange({ status: v || null })}
            options={[
              { value: '', label: t('Tất cả trạng thái') },
              { value: 'pendingapproval', label: t('Chờ duyệt') },
              { value: 'approved', label: t('Đã duyệt') },
              { value: 'rejected', label: t('Từ chối') },
              { value: 'needssupplement', label: t('Cần bổ sung') },
              { value: 'canceled', label: t('Đã hủy') },
            ]}
          />
        </div>

        {/* Reset */}
        {(filters.from || filters.to || filters.block || filters.departmentId || filters.documentTypeId || filters.positionId || filters.status) && (
          <button
            className={`${FILTER_GHOST_BUTTON_CLS} ml-auto mt-[26px]`}
            onClick={() => onChange({ from: null, to: null, block: null, departmentId: null, documentTypeId: null, positionId: null, status: null })}
          >
            {t('Đặt lại')}
          </button>
        )}
      </div>
    </div>
  );
}
