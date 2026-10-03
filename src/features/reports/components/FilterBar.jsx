export default function FilterBar({ filters, departments, documentTypes = [], positions = [], onChange }) {
  const inputClass = "h-[44px] border border-[#D9D5CC] rounded-[3px] px-[16px] text-[14px] text-[#111315] bg-[#FFFEFA] focus:border-[#111315] focus:outline-none transition-colors min-w-[180px]";
  const labelClass = "text-[12px] font-bold uppercase tracking-[1.68px] text-[#66655F]";

  const filteredDepartments = (departments || []).filter(d => {
    if (!filters.block) return true;
    if (filters.block === 'hq') return d.type === 'Phòng ban' || d.type === 'Khối chuyên môn';
    if (filters.block === 'retail') return d.type === 'Siêu thị / Chi nhánh';
    return true;
  });

  return (
    <div className="p-2">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Từ ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Từ ngày</label>
          <input
            type="date"
            className={inputClass}
            value={filters.from || ''}
            onChange={(e) => onChange({ from: e.target.value || null })}
          />
        </div>

        {/* Đến ngày */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Đến ngày</label>
          <input
            type="date"
            className={inputClass}
            value={filters.to || ''}
            onChange={(e) => onChange({ to: e.target.value || null })}
          />
        </div>

        {/* Khối */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Khối</label>
          <select
            className={inputClass}
            value={filters.block || ''}
            onChange={(e) => onChange({ block: e.target.value || null, departmentId: null })}
          >
            <option value="">Tất cả khối</option>
            <option value="hq">Khối Văn phòng</option>
            <option value="retail">Khối Cửa hàng</option>
          </select>
        </div>

        {/* Phòng ban */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Phòng ban</label>
          <select
            className={inputClass}
            value={filters.departmentId || ''}
            onChange={(e) => onChange({ departmentId: e.target.value || null })}
          >
            <option value="">Tất cả phòng ban</option>
            {filteredDepartments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Loại đơn */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Loại đơn</label>
          <select
            className={inputClass}
            value={filters.documentTypeId || ''}
            onChange={(e) => onChange({ documentTypeId: e.target.value || null })}
          >
            <option value="">Tất cả loại đơn</option>
            {(documentTypes || []).map(dt => (
              <option key={dt.id} value={dt.id}>{dt.name}</option>
            ))}
          </select>
        </div>

        {/* Chức vụ người tạo */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Chức vụ</label>
          <select
            className={inputClass}
            value={filters.positionId || ''}
            onChange={(e) => onChange({ positionId: e.target.value || null })}
          >
            <option value="">Tất cả chức vụ</option>
            {(positions || []).map(p => (
              <option key={p.id} value={p.id}>{p.name || p.positionName}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái — báo cáo chỉ quan tâm đơn đã duyệt */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Trạng thái</label>
          <select
            className={inputClass}
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || null })}
          >
            <option value="">Đã duyệt (mặc định)</option>
            <option value="Approved">Đã duyệt</option>
          </select>
        </div>

        {/* Reset */}
        {(filters.from || filters.to || filters.block || filters.departmentId || filters.documentTypeId || filters.positionId || filters.status) && (
          <button
            className="flex items-center justify-center px-[16px] py-[8px] h-[44px] text-[14px] font-semibold text-[#66655F] bg-transparent border border-transparent hover:border-[#D9D5CC] rounded-[8px] transition-colors ml-auto mt-[26px]"
            onClick={() => onChange({ from: null, to: null, block: null, departmentId: null, documentTypeId: null, positionId: null, status: null })}
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}
