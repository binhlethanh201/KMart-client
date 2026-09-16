import { useState } from 'react';

// Bộ chọn icon đại diện cho phòng ban: 2 chế độ — "Icon" (preset material symbols)
// hoặc "Ảnh" (tải lên ảnh đại diện, tự thu nhỏ về 160px để persist an toàn vào localStorage).

const ICON_PRESETS = [
  { icon: 'campaign', label: 'Marketing' },
  { icon: 'code', label: 'Công nghệ' },
  { icon: 'support_agent', label: 'CSKH' },
  { icon: 'storefront', label: 'Siêu thị' },
  { icon: 'group', label: 'Nhân sự' },
  { icon: 'local_shipping', label: 'Vận hành' },
  { icon: 'science', label: 'R&D' },
  { icon: 'account_balance', label: 'Tài chính' },
];

// Đọc file ảnh, vẽ lại lên canvas ở kích thước tối đa `maxSize` để dữ liệu nhỏ,
// tránh làm phình localStorage khi persist. Trả data URL PNG.
function readImageDownscaled(file, maxSize, onData, onError) {
  const reader = new FileReader();
  reader.onerror = () => onError?.();
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => onData?.(reader.result); // fallback: dùng data URL gốc
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        onData?.(canvas.toDataURL('image/png'));
      } catch {
        onData?.(reader.result); // fallback nếu canvas bị chặn (private mode)
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default function DepartmentIconPicker({ icon, iconImage, onChange }) {
  const [mode, setMode] = useState(iconImage ? 'image' : 'icon');
  const [error, setError] = useState('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    if (m === 'icon') onChange({ iconImage: null });
  };

  const pickIcon = (symbol) => {
    setMode('icon');
    setError('');
    onChange({ icon: symbol, iconImage: null });
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh.');
      return;
    }
    setError('');
    readImageDownscaled(file, 160, (dataUrl) => onChange({ iconImage: dataUrl }), () =>
      setError('Không đọc được file ảnh.')
    );
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block font-label-md text-label-md text-on-surface-variant">
          Icon đại diện
        </label>
        {/* Mode toggle */}
        <div className="flex bg-surface-container-highest rounded-md p-0.5">
          {[
            { v: 'icon', label: 'Icon' },
            { v: 'image', label: 'Ảnh' },
          ].map((opt) => {
            const active = mode === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => switchMode(opt.v)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  active ? 'bg-primary text-on-primary' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview hiện tại khi đã có ảnh */}
      {mode === 'image' && iconImage && (
        <div className="flex items-center gap-2 mb-2 bg-surface-container-low border border-outline-variant/60 rounded-md px-3 py-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={iconImage} alt="Ảnh đại diện" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs text-secondary flex-1">Ảnh đại diện đã chọn.</span>
          <button
            type="button"
            onClick={() => onChange({ iconImage: null })}
            className="text-secondary hover:text-error p-1 rounded hover:bg-error-container/30 transition-colors cursor-pointer"
            title="Xóa ảnh"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {mode === 'icon' ? (
        <div className="grid grid-cols-4 gap-2">
          {ICON_PRESETS.map((p) => {
            const active = icon === p.icon && !iconImage;
            return (
              <button
                key={p.icon}
                type="button"
                onClick={() => pickIcon(p.icon)}
                title={p.label}
                className={`relative flex flex-col items-center gap-1 py-2.5 rounded-md border transition-colors cursor-pointer ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                <span className="text-[10px] truncate w-full text-center px-1">{p.label}</span>
                {active && (
                  <span className="absolute top-1 right-1 material-symbols-outlined text-[14px] text-primary">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 py-6 rounded-md border border-dashed border-primary/50 text-primary hover:bg-primary-container/20 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
          <span className="text-sm font-medium">Tải lên ảnh đại diện</span>
          <span className="text-[11px] text-secondary">PNG, JPG — tự thu nhỏ về 160×160</span>
          <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
        </label>
      )}

      {error && <p className="text-xs text-error mt-1.5">{error}</p>}
    </div>
  );
}
