import { useState } from 'react';
import { ZALO_CONFIG, TIME_RULES } from '../data/mockData';

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function GeneralTab() {
  const [zalo, setZalo] = useState(ZALO_CONFIG);
  const [timeRule, setTimeRule] = useState('business');
  const [showSecret, setShowSecret] = useState(false);

  const connected = zalo.status === 'connected';
  const toggleTemplate = (id) =>
    setZalo((z) => ({ ...z, templates: z.templates.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Zalo OA Integration */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Tích hợp Zalo OA</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              connected ? 'bg-success-container text-on-success-container' : 'bg-surface-container-high text-secondary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success' : 'bg-outline'}`} />
            {connected ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Zalo App ID</label>
            <input className={fieldCls} value={zalo.appId} onChange={(e) => setZalo((z) => ({ ...z, appId: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Zalo Secret Key</label>
            <div className="relative">
              <input
                className={fieldCls + ' pr-10'}
                type={showSecret ? 'text' : 'password'}
                value={zalo.secretKey}
                onChange={(e) => setZalo((z) => ({ ...z, secretKey: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
                aria-label="Hiện mật khẩu"
              >
                <span className="material-symbols-outlined text-[18px]">{showSecret ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Oa ID</label>
            <input className={fieldCls} value={zalo.oaId} onChange={(e) => setZalo((z) => ({ ...z, oaId: e.target.value }))} />
          </div>

          {/* ZNS templates */}
          <div className="border-t border-outline-variant pt-4">
            <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-3">
              Mẫu thông báo ZNS
            </div>
            <div className="flex flex-col gap-2">
              {zalo.templates.map((t) => (
                <label key={t.id} className="flex items-center justify-between p-2.5 rounded-md border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer">
                  <span className="text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">{t.enabled ? 'notifications_active' : 'notifications_off'}</span>
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleTemplate(t.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${t.enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                    aria-pressed={t.enabled}
                    aria-label={t.name}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${t.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <button className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2 cursor-pointer mt-1">
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Kiểm tra &amp; Lưu kết nối
          </button>
        </div>
      </div>

      {/* System Time & Timeout Rules */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">schedule</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Quy tắc thời gian &amp; Timeout</h3>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-primary-container/20 border border-primary/20 rounded-md p-4 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">timer</span>
            <div>
              <div className="text-sm font-medium text-on-surface">Quy tắc BR11: Timeout 12 giờ</div>
              <p className="text-xs text-secondary mt-0.5">
                Đơn không được xử lý sau 12 giờ sẽ tự động chuyển trả theo cấu hình từng bước duyệt.
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cách tính 12 giờ timeout</label>
            <div className="flex flex-col gap-2">
              {TIME_RULES.map((r) => {
                const active = timeRule === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-colors ${active ? 'border-primary bg-primary-container/30' : 'border-outline-variant hover:bg-surface-container-low'}`}
                  >
                    <input type="radio" name="timerule" checked={active} onChange={() => setTimeRule(r.id)} className="mt-0.5 text-primary focus:ring-primary cursor-pointer" />
                    <div>
                      <div className={`text-sm font-medium ${active ? 'text-primary' : 'text-on-surface'}`}>{r.label}</div>
                      <div className="text-xs text-secondary mt-0.5">
                        {r.id === 'business' ? 'Chỉ tính thứ 2 đến thứ 6, bỏ qua cuối tuần và ngày lễ.' : 'Đếm 12 giờ liên tục kể từ lúc tạo / chuyển bước, bất kể ngày đêm.'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-3">Giờ hành chính mặc định</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Giờ bắt đầu</label>
                <input className={fieldCls} defaultValue="08:00" type="time" />
              </div>
              <div>
                <label className={labelCls}>Giờ kết thúc</label>
                <input className={fieldCls} defaultValue="17:30" type="time" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
