export default function FilterBar({ filters, departments, documentTypes, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Từ ngày */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Từ ngày:</label>
          <input
            type="date"
            className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.from || ''}
            onChange={(e) => onChange({ from: e.target.value || null })}
          />
        </div>

        {/* Đến ngày */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Đến ngày:</label>
          <input
            type="date"
            className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.to || ''}
            onChange={(e) => onChange({ to: e.target.value || null })}
          />
        </div>

        {/* Phòng ban */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Phòng ban:</label>
          <select
            className="border rounded px-3 py-1.5 text-sm min-w-[180px]"
            value={filters.departmentId || ''}
            onChange={(e) => onChange({ departmentId: e.target.value || null })}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Loại đơn */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Loại đơn:</label>
          <select
            className="border rounded px-3 py-1.5 text-sm min-w-[180px]"
            value={filters.documentTypeId || ''}
            onChange={(e) => onChange({ documentTypeId: e.target.value || null })}
          >
            <option value="">Tất cả loại đơn</option>
            {documentTypes.map(dt => (
              <option key={dt.id} value={dt.id}>{dt.name}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Trạng thái:</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || null })}
          >
            <option value="">Tất cả</option>
            <option value="PendingApproval">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
            <option value="Draft">Nháp</option>
            <option value="NeedsSupplement">Cần bổ sung</option>
            <option value="Canceled">Đã hủy</option>
          </select>
        </div>

        {/* Reset */}
        {(filters.from || filters.to || filters.departmentId || filters.documentTypeId || filters.status) && (
          <button
            className="text-sm text-blue-600 hover:text-blue-700 ml-auto cursor-pointer"
            onClick={() => onChange({ from: null, to: null, departmentId: null, documentTypeId: null, status: null })}
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}
