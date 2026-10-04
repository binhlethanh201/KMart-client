import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_CONTROL_CLS, FILTER_SELECT_CLS, FILTER_LABEL_CLS, FILTER_GHOST_BUTTON_CLS } from '../../../styles/filterControls';

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
          <select
            className={selectClass}
            value={filters.block || ''}
            onChange={(e) => {
              const nextBlock = e.target.value || null;
              // Chỉ bỏ phòng ban đang chọn khi nó KHÔNG còn thuộc khối vừa chọn.
              // Trước đây đổi khối luôn xoá phòng ban nên người dùng mất lựa chọn vừa lọc.
              const keepDepartment = (departments || []).some(
                (d) => d.id === filters.departmentId && deptMatchesBlock(d, nextBlock)
              );
              onChange(keepDepartment ? { block: nextBlock } : { block: nextBlock, departmentId: null });
            }}
          >
            <option value="">{t('Tất cả khối')}</option>
            <option value="hq">{t('Khối Văn phòng')}</option>
            <option value="retail">{t('Khối Cửa hàng')}</option>
          </select>
        </div>

        {/* Phòng ban */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Phòng ban')}</label>
          <select
            className={selectClass}
            value={filters.departmentId || ''}
            onChange={(e) => onChange({ departmentId: e.target.value || null })}
          >
            <option value="">{t('Tất cả phòng ban')}</option>
            {filteredDepartments.map(d => (
              <option key={d.id} value={d.id}>{t(d.name)}</option>
            ))}
          </select>
        </div>

        {/* Loại đơn */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Loại đơn')}</label>
          <select
            className={selectClass}
            value={filters.documentTypeId || ''}
            onChange={(e) => onChange({ documentTypeId: e.target.value || null })}
          >
            <option value="">{t('Tất cả loại đơn')}</option>
            {(documentTypes || []).map(dt => (
              <option key={dt.id} value={dt.id}>{t(dt.name)}</option>
            ))}
          </select>
        </div>

        {/* Chức vụ người tạo */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Chức vụ')}</label>
          <select
            className={selectClass}
            value={filters.positionId || ''}
            onChange={(e) => onChange({ positionId: e.target.value || null })}
          >
            <option value="">{t('Tất cả chức vụ')}</option>
            {(positions || []).map(p => (
              <option key={p.id} value={p.id}>{t(p.name || p.positionName)}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái — đã bỏ: báo cáo chỉ thống kê ĐƠN ĐÃ DUYỆT nên lọc trạng thái
            không làm số liệu thay đổi, gây hiểu nhầm là bộ lọc hỏng. */}

        {/* Reset */}
        {(filters.from || filters.to || filters.block || filters.departmentId || filters.documentTypeId || filters.positionId) && (
          <button
            className={`${FILTER_GHOST_BUTTON_CLS} ml-auto mt-[26px]`}
            onClick={() => onChange({ from: null, to: null, block: null, departmentId: null, documentTypeId: null, positionId: null })}
          >
            {t('Đặt lại')}
          </button>
        )}
      </div>
    </div>
  );
}
