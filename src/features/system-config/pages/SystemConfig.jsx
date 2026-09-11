import { useState, useEffect } from 'react';
import FormTemplatesTab from '../components/FormTemplatesTab';
import WorkflowTab from '../components/WorkflowTab';
import GeneralTab from '../components/GeneralTab';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

const TABS = [
  { id: 'forms', label: 'Cấu hình Mẫu đơn & Form động', icon: 'description' },
  { id: 'workflow', label: 'Cấu hình Luồng duyệt', icon: 'account_tree' },
  { id: 'general', label: 'Cấu hình Chung & Zalo', icon: 'settings' },
];

export default function SystemConfig({ defaultActive = 'workflow' }) {
  useDocumentTitle('Cấu hình Hệ thống');
  const [active, setActive] = useState(defaultActive);

  useEffect(() => {
    setActive(defaultActive);
  }, [defaultActive]);

  const activeTab = TABS.find((t) => t.id === active) || TABS[1];

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant px-6 pt-6 pb-6 flex-shrink-0 z-10 shadow-sm">
        <h1 className="font-display-lg text-on-surface tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-primary">{activeTab.icon}</span>
          {activeTab.label}
        </h1>

      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
        {active === 'forms' && <FormTemplatesTab />}
        {active === 'workflow' && <WorkflowTab />}
        {active === 'general' && <GeneralTab />}
      </div>
    </section>
  );
}
