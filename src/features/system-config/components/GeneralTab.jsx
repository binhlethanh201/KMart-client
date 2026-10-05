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

  const cardCls = 'bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden';
  const headCls = 'px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-3';

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      {/* Telegram Bot Integration */}
      <div className={cardCls}>
        <div className={headCls}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">send</span>
            <h3 className="text-base font-semibold text-on-surface">{t('Tích hợp Telegram Bot')}</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${connected ? 'bg-success-container text-on-success-container' : 'bg-surface-container-high text-secondary'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success' : 'bg-outline'}`} />
            {connected ? t('Đã kết nối') : t('Chưa kết nối')}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>{t('Telegram Bot Token')}</label>
            <input
              type="password"
              className={fieldCls}
              value={telegram.botToken}
              onChange={(e) => setTelegram((z) => ({ ...z, botToken: e.target.value }))}
              placeholder="123456789:ABCdefGHIjklmNOPqrstUVWxyz"
            />
            <p className="text-xs text-secondary mt-1.5">
              {t('Tạo bot qua @BotFather trên Telegram để lấy mã Token.')}
            </p>
          </div>
          {message && (
            <div className={`text-xs rounded-md px-3 py-2 border ${message.type === 'success' ? 'text-success border-success/30 bg-success-container/30' : 'text-error border-error/30 bg-error-container/30'}`}>
              {message.text}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSaveTelegram}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {t('Lưu cấu hình')}
            </button>
          </div>
        </div>
      </div>

      {/* Thời gian xử lý */}
      <div className={cardCls}>
        <div className={headCls}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <h3 className="text-base font-semibold text-on-surface">{t('Cách tính 12 giờ quá hạn')}</h3>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-5">
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

          <div className="border-t border-outline-variant/50 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-secondary mb-3">{t('Giờ hành chính mặc định')}</div>
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
