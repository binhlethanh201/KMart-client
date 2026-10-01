export default function FilterBar({ filters, departments, onChange }) {
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

        {/* Reset */}
        {(filters.from || filters.to || filters.block || filters.departmentId) && (
          <button
            className="flex items-center justify-center px-[16px] py-[8px] h-[44px] text-[14px] font-semibold text-[#66655F] bg-transparent border border-transparent hover:border-[#D9D5CC] rounded-[8px] transition-colors ml-auto mt-[26px]"
            onClick={() => onChange({ from: null, to: null, block: null, departmentId: null })}
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}
