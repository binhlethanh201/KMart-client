import { useState } from 'react';
import { FORM_TYPES } from '../data/mockData';
import { useApproval } from '../../../context/useApproval';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function FormTemplatesTab() {
  const [categories, setCategories] = useState([
    { id: 'cat1', name: 'Hành chính - Nhân sự', items: ['Đơn xin nghỉ phép', 'Đơn xin nghỉ thai sản', 'Đơn xin nghỉ việc'] },
    { id: 'cat2', name: 'Chấm công - Đi lại', items: ['Đơn làm thêm (OT)', 'Đơn xin ra ngoài'] },
    { id: 'cat3', name: 'Khác', items: [] }
  ]);

  const [selectedForm, setSelectedForm] = useState(FORM_TYPES[0]);
  const { formFields: fields, setFormFields: setFields, pushToast } = useApproval();

  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [selectedCatIdForNewType, setSelectedCatIdForNewType] = useState('cat1');

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingTypeIdx, setEditingTypeIdx] = useState(null);
  const [tempLabel, setTempLabel] = useState('');
  const [tempType, setTempType] = useState('Văn bản');
  const [tempOptions, setTempOptions] = useState([]);
  const [tempDisplayStyle, setTempDisplayStyle] = useState('dropdown');

  const current = fields[selectedForm] || [];

  const handleAddFormType = () => {
    const name = newTypeName.trim();
    // Check if name already exists in any category
    const exists = categories.some(c => c.items.includes(name));
    if (!name || exists) {
      setIsAddingType(false);
      setNewTypeName('');
      return;
    }
    
    setCategories(prev => prev.map(c => 
      c.id === selectedCatIdForNewType ? { ...c, items: [...c.items, name] } : c
    ));
    setFields(prev => ({
      ...prev,
      [name]: []
    }));
    setSelectedForm(name);
    setIsAddingType(false);
    setNewTypeName('');
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setCategories(prev => [...prev, { id: `cat_${Date.now()}`, name, items: [] }]);
    setIsAddingCat(false);
    setNewCatName('');
  };

  const handleEditCategory = (id) => {
    const name = editCatName.trim();
    if (!name) return;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    setEditingCatId(null);
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteForm = (catId, formName) => {
    setCategories(prev => prev.map(c => 
      c.id === catId ? { ...c, items: c.items.filter(item => item !== formName) } : c
    ));
    if (selectedForm === formName) {
      setSelectedForm('');
    }
  };

  const updateField = (idx, patch) =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: prev[selectedForm].map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));

  const removeField = (idx) =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: prev[selectedForm].filter((_, i) => i !== idx),
    }));

  const addField = () =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: [
        ...prev[selectedForm],
        { id: `field_${Date.now()}`, label: 'Trường mới', type: 'Văn bản', required: false, dynamic: '', options: [] },
      ],
    }));

  const openTypeModal = (idx) => {
    const f = current[idx];
    setEditingTypeIdx(idx);
    setTempLabel(f.label || 'Trường mới');
    setTempType(f.type || 'Văn bản');
    setTempOptions(f.options ? [...f.options] : []);
    
    let defaultStyle = 'dropdown';
    if (f.type === 'Ngày') defaultStyle = 'datetime';
    
    setTempDisplayStyle(f.displayStyle || defaultStyle);
  };

  const handleSaveTypeModal = () => {
    if (editingTypeIdx !== null) {
      updateField(editingTypeIdx, { label: tempLabel, type: tempType, options: tempOptions, displayStyle: tempDisplayStyle });
      setEditingTypeIdx(null);
      pushToast('Đã cập nhật cấu hình trường', 'success');
    }
  };

  const addTempOption = () => setTempOptions([...tempOptions, `Lựa chọn ${tempOptions.length + 1}`]);
  const updateTempOption = (idx, val) => {
    const newOpts = [...tempOptions];
    newOpts[idx] = val;
    setTempOptions(newOpts);
  };
  const removeTempOption = (idx) => {
    setTempOptions(tempOptions.filter((_, i) => i !== idx));
  };

  const [expandedCats, setExpandedCats] = useState(
    categories.reduce((acc, cat) => ({...acc, [cat.id]: true}), {})
  );

  const toggleCat = (id) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      {/* Form templates list */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col max-h-[800px]">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0 flex items-center justify-between">
          <h3 className="font-label-md text-on-surface font-semibold uppercase tracking-wide">Mẫu đơn</h3>
          <button 
            onClick={() => setIsAddingCat(true)}
            className="text-primary hover:bg-primary-container/30 p-1 rounded-md transition-colors cursor-pointer"
            title="Thêm danh mục"
          >
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col p-2 gap-3">
            {categories.map((cat) => {
              const isExpanded = expandedCats[cat.id] !== false; // Default true
              const isEditing = editingCatId === cat.id;
              
              return (
                <li key={cat.id} className="flex flex-col gap-1">
                  <div className="flex items-center group pr-2">
                    <button 
                      onClick={() => toggleCat(cat.id)}
                      className="flex-1 flex items-center gap-2 px-2 py-1 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer text-left uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                      </span>
                      {isEditing ? (
                        <input 
                          autoFocus
                          type="text"
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          onBlur={() => handleEditCategory(cat.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditCategory(cat.id);
                            if (e.key === 'Escape') setEditingCatId(null);
                          }}
                          className="bg-surface border border-primary/50 rounded px-1 py-0.5 text-on-surface outline-none focus:ring-1 focus:ring-primary w-full max-w-[140px] lowercase normal-case"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        cat.name
                      )}
                    </button>
                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditCatName(cat.name);
                            setEditingCatId(cat.id);
                          }}
                          className="text-secondary hover:text-primary p-1 rounded hover:bg-surface-container-low cursor-pointer"
                          title="Đổi tên danh mục"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (cat.items.length === 0) {
                              handleDeleteCategory(cat.id);
                            }
                          }}
                          disabled={cat.items.length > 0}
                          className={`p-1 rounded transition-colors flex-shrink-0 ${
                            cat.items.length > 0 
                              ? 'text-outline opacity-50 cursor-not-allowed' 
                              : 'text-secondary hover:text-error hover:bg-error-container/30 cursor-pointer'
                          }`}
                          title={cat.items.length > 0 ? "Phải xóa hết đơn bên trong để xóa danh mục" : "Xóa danh mục"}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <ul className="flex flex-col gap-0.5">
                      {cat.items.length === 0 && (
                        <li className="text-xs text-secondary italic pl-8 pr-3 py-1">Chưa có mẫu đơn</li>
                      )}
                      {cat.items.map(f => {
                        const active = f === selectedForm;
                        return (
                          <li key={f} className="group/item flex items-center relative pr-2">
                            <button
                              onClick={() => setSelectedForm(f)}
                              className={`flex-1 text-left pl-8 pr-6 py-2 rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                active ? 'bg-primary-container/40 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{active ? 'description' : 'draft'}</span>
                              <span className="truncate">{f}</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteForm(cat.id, f);
                              }}
                              className="absolute right-1 opacity-0 group-hover/item:opacity-100 text-secondary hover:text-error transition-all p-1.5 rounded hover:bg-error-container/30 cursor-pointer flex-shrink-0"
                              title="Xóa mẫu đơn"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="p-2 border-t border-outline-variant/50">
          <button
            onClick={() => setIsAddingType(true)}
            className="w-full text-center px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-primary hover:bg-primary-container/30 border border-dashed border-primary/50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm loại đơn
          </button>
        </div>
      </div>

      {/* Field management table */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Quản lý trường: {selectedForm}</h3>
            <p className="text-xs text-secondary mt-0.5">Cấu hình trường dữ liệu và điều kiện hiển thị động</p>
          </div>
          <button
            onClick={addField}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm trường mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left border-b border-outline-variant">
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Tên trường</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Kiểu dữ liệu</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Bắt buộc</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">Thiết lập nâng cao</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide w-24 whitespace-nowrap text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {current.map((f, idx) => (
                <tr key={f.id} className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low/60 transition-colors">
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={f.label} 
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      className="text-sm font-medium text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none px-1 py-0.5 w-full max-w-[200px] transition-colors"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => openTypeModal(idx)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-surface-container text-secondary border border-outline-variant hover:border-primary hover:text-primary transition-colors cursor-pointer w-full justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {f.type === 'Tải file' ? 'attach_file' : f.type === 'Ngày' ? 'calendar_month' : f.type === 'Số' ? 'numbers' : f.type === 'Lựa chọn' ? 'list_alt' : 'text_fields'}
                        </span>
                        {f.type}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-outline">edit</span>
                    </button>
                    {f.type === 'Lựa chọn' && f.options && f.options.length > 0 && (
                      <div className="text-[10px] text-secondary mt-1 ml-1">
                        {f.options.length} phương án
                      </div>
                    )}
                    {f.type === 'Ngày' && f.displayStyle && (
                      <div className="text-[10px] text-secondary mt-1 ml-1">
                        {f.displayStyle === 'date' ? 'Chỉ ngày' : f.displayStyle === 'time' ? 'Chỉ giờ' : 'Ngày & giờ'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={f.required} onChange={(v) => updateField(idx, { required: v })} label="Bắt buộc" />
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <Toggle checked={Boolean(f.dynamic)} onChange={(v) => updateField(idx, { dynamic: v ? 'Nhập điều kiện hiển thị...' : '' })} label="Logic tự động" />
                      {Boolean(f.dynamic) && (
                        <input 
                          type="text"
                          value={f.dynamic}
                          onChange={(e) => updateField(idx, { dynamic: e.target.value })}
                          className="text-xs text-secondary bg-surface-container-lowest border border-outline-variant/50 rounded px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                          placeholder="VD: Hiển thị khi..."
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeField(idx)}
                      className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                      title="Xóa trường"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal for adding new form type */}
      {isAddingType && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsAddingType(false)}
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-on-surface">Thêm mẫu đơn mới</h3>
              <button 
                onClick={() => setIsAddingType(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  Tên loại đơn <span className="text-error">*</span>
                </label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  placeholder="VD: Đơn xin cấp trang thiết bị..."
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFormType();
                    if (e.key === 'Escape') setIsAddingType(false);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  Lưu vào danh mục
                </label>
                <select 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                  value={selectedCatIdForNewType}
                  onChange={e => setSelectedCatIdForNewType(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg">
              <button 
                onClick={() => setIsAddingType(false)}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddFormType}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                Thêm mẫu đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for adding new category */}
      {isAddingCat && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsAddingCat(false)}
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-on-surface">Thêm danh mục mới</h3>
              <button 
                onClick={() => setIsAddingCat(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Tên danh mục <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                placeholder="VD: Tài chính - Kế toán"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setIsAddingCat(false);
                }}
              />
            </div>
            
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg">
              <button 
                onClick={() => setIsAddingCat(false)}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddCategory}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                Lưu danh mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for configuring field type */}
      {editingTypeIdx !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingTypeIdx(null)}
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30 flex-shrink-0">
              <h3 className="font-headline-sm text-on-surface">Cấu hình Trường dữ liệu</h3>
              <button 
                onClick={() => setEditingTypeIdx(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2 block">
                  Tên trường / Tiêu đề câu hỏi <span className="text-error">*</span>
                </label>
                <input 
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="VD: Có ảnh hưởng đến công việc không?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-3">
                  Chọn kiểu dữ liệu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Văn bản', icon: 'text_fields' },
                    { id: 'Số', icon: 'numbers' },
                    { id: 'Lựa chọn', icon: 'list_alt' },
                    { id: 'Ngày', icon: 'calendar_month' },
                    { id: 'Tải file', icon: 'attach_file' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTempType(t.id);
                        if (t.id === 'Ngày') setTempDisplayStyle('datetime');
                        else if (t.id === 'Lựa chọn') setTempDisplayStyle('dropdown');
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all cursor-pointer ${
                        tempType === t.id 
                          ? 'border-primary bg-primary-container/20 text-primary' 
                          : 'border-outline-variant bg-surface-container-lowest text-secondary hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">{t.icon}</span>
                      <span className="text-xs font-medium">{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {tempType === 'Lựa chọn' && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 animate-fade-in flex flex-col gap-4">
                  
                  {/* Display Style Selection */}
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-2 block">
                      Kiểu hiển thị <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
                        { id: 'radio', label: 'Radio (Chọn 1)', icon: 'radio_button_checked' },
                        { id: 'checkbox', label: 'Checkbox (Chọn nhiều)', icon: 'check_box' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setTempDisplayStyle(style.id)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-all cursor-pointer ${
                            tempDisplayStyle === style.id
                              ? 'border-primary bg-primary-container/20 text-primary font-medium'
                              : 'border-outline-variant bg-surface text-secondary hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-on-surface">
                        Danh sách phương án
                      </label>
                      <span className="text-xs text-secondary bg-surface-variant px-2 py-0.5 rounded-full">
                        {tempOptions.length} phương án
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {tempOptions.length === 0 ? (
                        <p className="text-sm text-secondary italic text-center py-4 bg-surface-container-low rounded-md border border-dashed border-outline-variant">
                          Chưa có phương án nào. Hãy thêm phương án mới.
                        </p>
                      ) : (
                        tempOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-[16px] cursor-grab">drag_indicator</span>
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => updateTempOption(i, e.target.value)}
                              className="flex-1 bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              placeholder="Nhập tên phương án..."
                            />
                            <button 
                              onClick={() => removeTempOption(i)}
                              className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer flex-shrink-0"
                              title="Xóa phương án"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <button
                      onClick={addTempOption}
                      className="mt-3 w-full text-center px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-primary hover:bg-primary-container/30 border border-dashed border-primary/50"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Thêm phương án
                    </button>
                  </div>
                </div>
              )}

              {tempType === 'Ngày' && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 animate-fade-in flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-2 block">
                      Định dạng thời gian <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'date', label: 'Chỉ ngày', subtext: 'DD/MM/YYYY', icon: 'calendar_today' },
                        { id: 'time', label: 'Chỉ giờ', subtext: 'HH:MM', icon: 'schedule' },
                        { id: 'datetime', label: 'Ngày & Giờ', subtext: 'DD/MM HH:MM', icon: 'event' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setTempDisplayStyle(style.id)}
                          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border text-sm transition-all cursor-pointer ${
                            tempDisplayStyle === style.id
                              ? 'border-primary bg-primary-container/20 text-primary font-medium'
                              : 'border-outline-variant bg-surface text-secondary hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
                          <span>{style.label}</span>
                          <span className="text-[10px] font-normal opacity-70">{style.subtext}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
              <button 
                onClick={() => setEditingTypeIdx(null)}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveTypeModal}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
