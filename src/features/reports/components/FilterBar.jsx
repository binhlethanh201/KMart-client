import { useI18n } from '../../../i18n/I18nProvider';

export default function FilterBar({ filters, departments, documentTypes = [], positions = [], onChange }) {
  const { t } = useI18n();
  const inputClass = "h-[44px] border border-[#D9D5CC] rounded-[3px] px-[16px] text-[14px] text-[#111315] bg-[#FFFEFA] focus:border-[#111315] focus:outline-none transition-colors min-w-[180px]";
  const labelClass = "text-[12px] font-bold uppercase tracking-[1.68px] text-[#66655F]";

  const filteredDepartments = (departments || []).filter(d => {
    if (!filters.block) return true;
    // So sánh với giá trị dữ liệu API trả về nên KHÔNG dịch.
    if (filters.block === 'hq') return d.type === 'Phòng ban' || d.type === 'Khối chuyên môn';
    if (filters.block === 'retail') return d.type === 'Siêu thị / Chi nhánh';
    return true;
  });

  return (
    <div className="p-2">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Từ ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Từ ngày')}</label>
          <input
            type="date"
            className={inputClass}
            value={filters.from || ''}
            onChange={(e) => onChange({ from: e.target.value || null })}
          />
        </div>

        {/* Đến ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Đến ngày')}</label>
          <input
            type="date"
            className={inputClass}
            value={filters.to || ''}
            onChange={(e) => onChange({ to: e.target.value || null })}
          />
        </div>

        {/* Khối */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('Khối')}</label>
          <select
            className={inputClass}
            value={filters.block || ''}
            onChange={(e) => onChange({ block: e.target.value || null, departmentId: null })}
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
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
            className="flex items-center justify-center px-[16px] py-[8px] h-[44px] text-[14px] font-semibold text-[#66655F] bg-transparent border border-transparent hover:border-[#D9D5CC] rounded-[8px] transition-colors ml-auto mt-[26px]"
            onClick={() => onChange({ from: null, to: null, block: null, departmentId: null, documentTypeId: null, positionId: null })}
          >
            {t('Đặt lại')}
          </button>
        )}
      </div>
    </div>
  );
}
