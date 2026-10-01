import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { documentTypeService } from '../../../services/documentTypeService';

export default function ExportModal({ open, onClose, documentTypes, filters }) {
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [docTypeDetail, setDocTypeDetail] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedDocType) {
      setDocTypeDetail(null);
      return;
    }

    documentTypeService.getById(selectedDocType)
      .then(data => {
        setDocTypeDetail(data);
        // Tự động chọn các trường được lưu trữ (không phải file)
        const persistedFields = (data.fields || [])
          .filter(f => f.isPersisted && f.type !== 'file')
          .map(f => f.fieldName || f.name);
        setSelectedFields(persistedFields);
      })
      .catch(err => {
        console.error(err);
        setError('Không tải được cấu hình đơn');
      });
  }, [selectedDocType]);

  const toggleField = (fieldName) => {
    setSelectedFields(prev =>
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleExport = async () => {
    if (!selectedDocType) {
      setError('Vui lòng chọn loại đơn');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const cleanFilters = {
        ...filters,
        from: filters.from ? filters.from : null,
        to: filters.to ? filters.to : null
      };

      const blob = await reportService.exportToExcel({
        documentTypeId: selectedDocType,
        filters: cleanFilters,
        selectedFields: selectedFields,
      });

      const filename = `BaoCao_${docTypeDetail?.name || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      reportService.downloadExcel(blob, filename);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Xuất Excel thất bại. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Xuất Excel Báo Cáo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Chọn loại đơn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại đơn <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={selectedDocType || ''}
              onChange={(e) => setSelectedDocType(e.target.value || null)}
            >
              <option value="">-- Chọn loại đơn --</option>
              {documentTypes.map(dt => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Chỉ xuất các trường được đánh dấu "Lưu trữ" trong cấu hình mẫu đơn
            </p>
          </div>

          {/* Chọn trường */}
          {docTypeDetail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trường sẽ xuất ({selectedFields.length} đã chọn)
              </label>
              <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
                {docTypeDetail.fields
                  ?.filter(f => f.type !== 'file')
                  .map(field => (
                    <label
                      key={field.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.fieldName || field.name)}
                        disabled={!field.isPersisted}
                        onChange={() => toggleField(field.fieldName || field.name)}
                        className="rounded"
                      />
                      <span className="text-sm flex-1">
                        {field.label || field.fieldName || field.name}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        field.isPersisted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {field.isPersisted ? 'Lưu' : 'Không'}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Bộ lọc đang áp dụng */}
          {Object.values(filters).some(v => v) && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <p className="font-medium text-blue-800">Bộ lọc đang áp dụng:</p>
              <ul className="text-blue-700 text-xs mt-1 space-y-1">
                {filters.from && <li>Từ: {filters.from}</li>}
                {filters.to && <li>Đến: {filters.to}</li>}
                {filters.departmentId && <li>Phòng ban: đã chọn</li>}
                {filters.documentTypeId && <li>Loại đơn: đã chọn</li>}
                {filters.status && <li>Trạng thái: {filters.status}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={onClose}
            disabled={exporting}
          >
            Hủy
          </button>
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            onClick={handleExport}
            disabled={!selectedDocType || selectedFields.length === 0 || exporting}
          >
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
