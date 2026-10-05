import { useState, useEffect } from 'react';
import { TIME_RULES } from '../data/mockData';
import apiClient from '../../../services/apiClient';
import { useI18n } from '../../../i18n/I18nProvider';

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function GeneralTab() {
  const { t } = useI18n();
  const [zalo, setZalo] = useState({
    status: 'disconnected',
    appId: '',
    secretKey: '',
    oaId: '',
    templates: []
  });
  const [timeRule, setTimeRule] = useState('business');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch settings & Zalo config from BE
  useEffect(() => {
    Promise.all([
      apiClient.get('/settings').catch(() => ({ data: null })),
      apiClient.get('/settings/zalo').catch(() => ({ data: null }))
    ]).then(([settingsRes, zaloRes]) => {
      // Map settings
      if (settingsRes.data?.timeCalculationMode) {
        setTimeRule(settingsRes.data.timeCalculationMode);
      }

      // Map Zalo config
      if (zaloRes.data) {
        setZalo({
          status: zaloRes.data.isConnected ? 'connected' : 'disconnected',
          appId: zaloRes.data.appId || '',
          secretKey: zaloRes.data.secretKey || '',
          oaId: zaloRes.data.oaId || '',
          templates: zaloRes.data.templates || []
        });
      }

      setLoading(false);
    }).catch(err => {
      console.error(t('Không tải được cấu hình:'), err);
      setLoading(false);
    });
  }, []);

  const handleSaveZalo = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put('/settings/zalo', {
        appId: zalo.appId,
        secretKey: zalo.secretKey,
        oaId: zalo.oaId
      });

      // Test connection
      const testResult = await apiClient.post('/settings/zalo/test', {
        appId: zalo.appId,
        secretKey: zalo.secretKey,
        oaId: zalo.oaId
      });

      if (testResult.data?.success) {
        setZalo(prev => ({ ...prev, status: 'connected' }));
        setMessage({ type: 'success', text: t('Kết nối Zalo OA thành công!') });
      } else {
        setZalo(prev => ({ ...prev, status: 'disconnected' }));
        setMessage({ type: 'error', text: testResult.data?.message || t('Kết nối thất bại. Vui lòng kiểm tra lại thông tin.') });
      }
    } catch (err) {
      console.error(t('Không lưu được cấu hình Zalo:'), err);
      setMessage({ type: 'error', text: t('Lỗi khi lưu cấu hình Zalo.') });
    } finally {
      setSaving(false);
    }
  };

  const connected = zalo.status === 'connected';
  const toggleTemplate = (id) =>
    setZalo((z) => ({ ...z, templates: z.templates.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) }));

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]">
      {/* Zalo OA Integration */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('Tích hợp Zalo OA')}</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              connected ? 'bg-success-container text-on-success-container' : 'bg-surface-container-high text-secondary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success' : 'bg-outline'}`} />
            {connected ? t('Đã kết nối') : t('Chưa kết nối')}
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
              <p className="text-sm text-secondary mt-2">{t('Đang tải cấu hình...')}</p>
            </div>
          ) : (
            <>
              <div>
                <label className={labelCls}>{t('Mã ứng dụng Zalo (App ID)')}</label>
                <input className={fieldCls} value={zalo.appId} onChange={(e) => setZalo((z) => ({ ...z, appId: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>{t('Khoá bảo mật Zalo (Secret Key)')}</label>
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
                    aria-label={t('Hiện mật khẩu')}
                  >
                    <span className="material-symbols-outlined text-[18px]">{showSecret ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('Mã OA (Official Account)')}</label>
                <input className={fieldCls} value={zalo.oaId} onChange={(e) => setZalo((z) => ({ ...z, oaId: e.target.value }))} />
              </div>

              {/* ZNS templates */}
              <div className="border-t border-outline-variant pt-4">
                <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-3">
                  {t('Mẫu thông báo ZNS')}
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

              <button
                onClick={handleSaveZalo}
                disabled={saving}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>sync</span>
                {saving ? t('Đang kiểm tra...') : t('Kiểm tra & Lưu kết nối')}
              </button>
              {message && (
                <div className={`text-sm px-3 py-2 rounded-md ${message.type === 'success' ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
                  {message.text}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* System Time & Timeout Rules */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">schedule</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('Quy tắc thời gian & xử lý quá hạn')}</h3>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-primary-container/20 border border-primary/20 rounded-md p-4 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">timer</span>
            <div>
              <div className="text-sm font-medium text-on-surface">{t('Quy tắc BR11: quá hạn 12 giờ')}</div>
              <p className="text-xs text-secondary mt-0.5">
                {t('Đơn không được xử lý sau 12 giờ sẽ tự động chuyển trả theo cấu hình từng bước duyệt.')}
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('Cách tính 12 giờ quá hạn')}</label>
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
                      <div className={`text-sm font-medium ${active ? 'text-primary' : 'text-on-surface'}`}>{t(r.label)}</div>
                      <div className="text-xs text-secondary mt-0.5">
                        {r.id === 'business' ? t('Chỉ tính thứ 2 đến thứ 6, bỏ qua cuối tuần và ngày lễ.') : t('Đếm 12 giờ liên tục kể từ lúc tạo / chuyển bước, bất kể ngày đêm.')}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-3">{t('Giờ hành chính mặc định')}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('Giờ bắt đầu')}</label>
                <input className={fieldCls} defaultValue="08:00" type="time" />
              </div>
              <div>
                <label className={labelCls}>{t('Giờ kết thúc')}</label>
                <input className={fieldCls} defaultValue="17:30" type="time" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
