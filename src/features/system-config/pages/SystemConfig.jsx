import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import FormTemplatesTab from '../components/FormTemplatesTab';
import WorkflowTab from '../components/WorkflowTab';
import PositionsTab from '../components/PositionsTab';
import GeneralTab from '../components/GeneralTab';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useI18n } from '../../../i18n/I18nProvider';
import PageHeader from '../../../components/PageHeader';

const TABS = [
  { id: 'forms', label: 'Cấu hình Mẫu đơn & Form động', icon: 'description' },
  { id: 'workflow', label: 'Cấu hình Luồng duyệt', icon: 'account_tree' },
  { id: 'positions', label: 'Chức vụ & cấp bậc', icon: 'badge' },
  { id: 'general', label: 'Cấu hình Chung & Telegram', icon: 'settings' },
];

export default function SystemConfig({ defaultActive = 'workflow' }) {
  const { t } = useI18n();
  useDocumentTitle(t('Cấu hình Hệ thống'));
  const [active, setActive] = useState(defaultActive);
  const { currentUser } = useApproval();
  const navigate = useNavigate();

  const canView = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  useEffect(() => {
    if (!canView) {
      navigate('/', { replace: true });
    }
  }, [canView, navigate]);

  useEffect(() => {
    setActive(defaultActive);
  }, [defaultActive]);

  if (!canView) return null;

  const activeTab = TABS.find((tab) => tab.id === active) || TABS[1];

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header — BE-97: khung tiêu đề chung (nền ấm như trang Báo cáo/Phòng ban, chữ đồng nhất) */}
      <PageHeader icon={activeTab.icon} title={activeTab.label} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
        {active === 'forms' && <FormTemplatesTab />}
        {active === 'workflow' && <WorkflowTab />}
        {active === 'positions' && <PositionsTab />}
        {active === 'general' && <GeneralTab />}
      </div>
    </section>
  );
}
