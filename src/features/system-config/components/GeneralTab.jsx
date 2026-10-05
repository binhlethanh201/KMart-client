import { useState, useEffect } from 'react';
import { TIME_RULES } from '../data/mockData';
import apiClient from '../../../services/apiClient';
import { useI18n } from '../../../i18n/I18nProvider';

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function GeneralTab() {
  const { t } = useI18n();
  const [telegram, setTelegram] = useState({
    status: 'disconnected',
    botToken: ''
  });
  const [timeRule, setTimeRule] = useState('business');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch settings & Telegram config from BE
  useEffect(() => {
    Promise.all([
      apiClient.get('/settings').catch(() => ({ data: null })),
      apiClient.get('/settings/telegram').catch(() => ({ data: null }))
    ]).then(([settingsRes, telegramRes]) => {
      // Map settings
      if (settingsRes.data?.timeCalculationMode) {
        setTimeRule(settingsRes.data.timeCalculationMode);
      }

      // Map Telegram config
      if (telegramRes.data) {
        setTelegram({
          status: telegramRes.data.isConnected ? 'connected' : 'disconnected',
          botToken: telegramRes.data.botToken || ''
        });
      }
    });
  }, []);

  const handleSaveTelegram = async () => {
    try {
      await apiClient.put('/settings/telegram', {
        botToken: telegram.botToken
      });
      const testResult = await apiClient.post('/settings/telegram/test', {
        botToken: telegram.botToken
      });
      
      if (testResult.data.success) {
        setTelegram(prev => ({ ...prev, status: 'connected' }));
        setMessage({ type: 'success', text: t('Kết nối Telegram Bot thành công!') });
      } else {
        setTelegram(prev => ({ ...prev, status: 'disconnected' }));
        setMessage({ type: 'error', text: testResult.data.message || t('Lỗi khi kết nối Telegram.') });
      }
    } catch (err) {
      console.error(t('Không lưu được cấu hình Telegram:'), err);
      setMessage({ type: 'error', text: t('Lỗi khi lưu cấu hình Telegram.') });
    }
  };

  const connected = telegram.status === 'connected';

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]">
      {/* Telegram Bot Integration */}
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('Tích hợp Telegram Bot')}</h3>
              <span className={`px-2.5 py-1 rounded-full text-label-sm font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-on-surface-variant'}`}>
                {connected ? t('Đã kết nối') : t('Chưa kết nối')}
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelCls}>{t('Telegram Bot Token')}</label>
                  <input 
                    type="password"
                    className={fieldCls} 
                    value={telegram.botToken} 
                    onChange={(e) => setTelegram((z) => ({ ...z, botToken: e.target.value }))} 
                    placeholder="123456789:ABCdefGHIjklmNOPqrstUVWxyz"
                  />
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {t('Tạo bot qua @BotFather trên Telegram để lấy mã Token.')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveTelegram}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-rounded text-[20px]">save</span>
                  <span>{t('Lưu cấu hình')}</span>
                </button>
              </div>
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
  );
}
