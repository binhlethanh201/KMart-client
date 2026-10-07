import { useState, useEffect, useRef } from 'react';
import { delegationService } from '../../../services/delegationService';
import { useApproval } from '../../../context/useApproval';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';
import PageHeader from '../../../components/PageHeader';
import { isApproverAccount } from '../../../utils/approverAccounts';
import { UserSelect, PersonBlock, StepCard, TipCard } from './DelegationsTab';

/**
 * BE-165: trang RIÊNG cho "Người duyệt thay khi quá hạn (mặc định)".
 *
 * Tách khỏi màn Ủy quyền vì đây là hai cơ chế khác nhau: ủy quyền tạm thời có khoảng
 * thời gian hiệu lực, còn đây là cấu hình THƯỜNG TRỰC dùng khi đơn bạn duyệt bị quá hạn
 * mà luồng bật hành động "Duyệt theo ủy quyền quá hạn". Giao diện cùng ngôn ngữ thiết kế
 * với màn Ủy quyền: hướng dẫn 3 bước + khung trạng thái cỡ lớn + khung cài đặt.
 */
export default function TimeoutDelegatePage() {
  const { t } = useI18n();
  const { pushToast, currentUser, hasPermission } = useApproval();
  const canApprove = isApproverAccount(currentUser, hasPermission);

  const [delegateId, setDelegateId] = useState(null);
  const [saved, setSaved] = useState(null); // { delegateId, delegateName }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // BE-167: nút tạo trong khung xanh mở thẳng ô chọn nhân sự ở khung cài đặt.
  const [openSignal, setOpenSignal] = useState(0);
  const setupRef = useRef(null);

  const openPicker = () => {
    setupRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setOpenSignal((s) => s + 1);
  };

  useEffect(() => {
    delegationService
      .getTimeoutDelegate()
      .then((d) => {
        setSaved(d || null);
        setDelegateId(d?.delegateId || null);
      })
      .catch((err) => {
        console.error('Failed to load timeout delegate', err);
        pushToast(describeApiError(err, t, 'Không tải được cấu hình người duyệt thay.'), 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = delegateId !== (saved?.delegateId || null);

  const save = async () => {
    setSaving(true);
    try {
      const res = await delegationService.setTimeoutDelegate(delegateId);
      setSaved(res?.delegateId ? res : null);
      pushToast(
        delegateId
          ? t('Đã lưu người duyệt thay khi quá hạn.')
          : t('Đã xoá người duyệt thay khi quá hạn.'),
        'success'
      );
    } catch (err) {
      console.error('Save timeout delegate failed', err);
      pushToast(describeApiError(err, t, 'Không lưu được người duyệt thay.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // BE-165: nút "Xoá cấu hình" ở khung trạng thái xoá NGAY, không bắt bấm Lưu lần nữa.
  const clearNow = async () => {
    setSaving(true);
    try {
      await delegationService.setTimeoutDelegate(null);
      setSaved(null);
      setDelegateId(null);
      pushToast(t('Đã xoá người duyệt thay khi quá hạn.'), 'success');
    } catch (err) {
      console.error('Clear timeout delegate failed', err);
      pushToast(describeApiError(err, t, 'Không xoá được cấu hình người duyệt thay.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col flex-1 min-h-0 w-full">
      <PageHeader
        icon="hourglass_bottom"
        title="Duyệt thay khi quá hạn"
        subtitle={t('Cài người duyệt thay mặc định cho những đơn bạn duyệt khi bị quá hạn xử lý.')}
      />

      <div className="p-3 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto w-full max-w-[1280px] mx-auto">
        {/* Hướng dẫn 3 bước */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden shrink-0">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">route</span>
              <h3 className="text-sm font-semibold text-on-surface">{t('Cơ chế hoạt động thế nào?')}</h3>
            </div>
            <span className="text-[11px] text-secondary">{t('3 bước')}</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3 items-stretch">
            <StepCard
              index={1}
              icon="person_search"
              title={t('Chọn người duyệt thay mặc định')}
              desc={t('Người này sẽ thay bạn xử lý các đơn bị quá hạn — cài một lần, dùng lâu dài tới khi bạn đổi hoặc xoá.')}
            />
            <StepCard
              index={2}
              icon="hourglass_bottom"
              title={t('Đơn quá hạn tự chuyển')}
              desc={t('Khi đơn bạn duyệt quá hạn và luồng bật "Duyệt theo ủy quyền quá hạn", đơn tự chuyển cho người duyệt thay với một khoảng thời gian mới.')}
            />
            <StepCard
              index={3}
              icon="event_busy"
              title={t('Quá hạn lần hai thì huỷ')}
              desc={t('Người duyệt thay cũng không xử lý trong thời gian quy định thì đơn bị huỷ, trả về người tạo. Bạn chưa cài người duyệt thay thì đơn quá hạn cũng bị huỷ.')}
            />
          </div>
        </div>

        {/* Khung trạng thái cỡ lớn */}
        <div className="bg-primary-container/15 border border-primary/20 rounded-xl px-4 py-6 flex flex-col items-center gap-5 text-center md:flex-1 min-h-[340px] overflow-y-auto">
          {/* my-auto: căn giữa khi khung còn chỗ trống; khi nội dung cao hơn khung thì
              cuộn từ đầu thay vì tràn ngược lên đè lên khối bước phía trên (lỗi màn mobile). */}
          <div className="w-full flex flex-col items-center gap-5 my-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-secondary text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
              {t('Đang tải...')}
            </div>
          ) : saved?.delegateId ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7">
                <PersonBlock label={t('Người duyệt')} name={t('Bạn')} tone="neutral" />
                <div className="flex items-center gap-1.5 text-primary flex-shrink-0">
                  <span className="hidden sm:block w-12 h-px bg-primary/30" />
                  <span className="material-symbols-outlined text-[34px]">hourglass_bottom</span>
                  <span className="hidden sm:block w-12 h-px bg-primary/30" />
                </div>
                <PersonBlock label={t('Duyệt thay khi quá hạn')} name={saved.delegateName} />
              </div>
              <div className="w-full max-w-[620px] rounded-lg bg-surface/80 border border-primary/15 px-4 py-3 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface bg-surface-container-lowest border border-outline-variant/60 rounded-full px-3 py-1.5 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[15px] text-success">verified</span>
                  {t('Đang áp dụng cho mọi đơn bạn duyệt')}
                </span>
                <button
                  onClick={openPicker}
                  disabled={saving}
                  className="text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {t('Đổi người')}
                </button>
                <button
                  onClick={clearNow}
                  disabled={saving}
                  className="text-sm font-medium text-error hover:bg-error-container/30 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {t('Xoá cấu hình')}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px]">hourglass_bottom</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-base font-semibold text-on-surface">{t('Chưa cài người duyệt thay')}</div>
                <div className="text-xs text-secondary max-w-[560px]">
                  {t('Khi đơn bạn duyệt bị quá hạn mà chưa có người duyệt thay, đơn sẽ bị huỷ và trả về người tạo.')}
                </div>
              </div>
              {/* BE-167: nút tạo đặt TRONG khung xanh, đúng kiểu nút "Tạo ủy quyền" bên ủy quyền tạm thời. */}
              {canApprove && (
                <button
                  onClick={openPicker}
                  className="bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  {t('Cài người duyệt thay')}
                </button>
              )}
            </div>
          )}

          {/* BE-168: ô chọn + nút lưu nằm TRONG khung xanh (bỏ khung trắng rời bên dưới). */}
          {canApprove && !loading && (
            <div
              ref={setupRef}
              className="w-full max-w-[620px] rounded-lg bg-surface/80 border border-primary/15 px-4 py-3 flex flex-col sm:flex-row gap-2 sm:items-center"
            >
              <div className="w-full sm:max-w-sm">
                <UserSelect
                  value={delegateId}
                  onChange={(id) => setDelegateId(id)}
                  excludeId={currentUser?.id}
                  openSignal={openSignal}
                />
              </div>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saving ? t('Đang lưu...') : t('Lưu người duyệt thay')}
              </button>
            </div>
          )}

          {/* BE-168: khối thông tin cuối khung — cùng kiểu màn Ủy quyền tạm thời. */}
          <p className="text-sm font-semibold text-on-surface">
            {t('Duyệt thay quá hạn chỉ chuyển quyền DUYỆT đơn quá hạn, không chuyển vai trò hay quyền hệ thống.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">hourglass_bottom</span>
              {t('Đơn bạn duyệt quá hạn')}
            </span>
            <span className="material-symbols-outlined text-[15px] text-primary/40">arrow_forward</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">person_search</span>
              {t('Người duyệt thay mặc định xử lý')}
            </span>
            <span className="material-symbols-outlined text-[15px] text-primary/40">arrow_forward</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">event_busy</span>
              {t('Quá hạn lần hai thì huỷ đơn')}
            </span>
          </div>

          <div className="w-full max-w-[900px] mt-1 pt-4 border-t border-primary/15 grid gap-3 sm:grid-cols-2 text-left">
            <TipCard icon="schedule" text={t('Người duyệt thay nhận cửa sổ thời gian mới bằng đúng số giờ cấu hình ở bước luồng.')} />
            <TipCard icon="looks_one" text={t('Mỗi người chỉ cài được một người duyệt thay; lưu mới sẽ ghi đè cấu hình cũ.')} />
            <TipCard icon="verified_user" text={t('Mọi lần chuyển đơn quá hạn và duyệt thay đều được ghi vào nhật ký hệ thống.')} />
            <TipCard icon="support_agent" text={t('Cần đổi người gấp? Lưu cấu hình mới hoặc xoá cấu hình ngay tại trang này.')} />
          </div>
          </div>
        </div>

        {!canApprove && (
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm px-4 py-3 text-xs text-secondary shrink-0">
            {t('Tài khoản của bạn không thuộc cấp duyệt đơn nên không cần cài đặt này.')}
          </div>
        )}
      </div>
    </section>
  );
}
