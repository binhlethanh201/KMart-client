import { useState } from 'react';
import FormTemplatesTab from '../components/FormTemplatesTab';
import WorkflowTab from '../components/WorkflowTab';
import GeneralTab from '../components/GeneralTab';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

const TABS = [
  { id: 'forms', label: 'Cấu hình Mẫu đơn & Form động', icon: 'description' },
  { id: 'workflow', label: 'Cấu hình Luồng duyệt (Workflow)', icon: 'account_tree' },
  { id: 'general', label: 'Cấu hình Chung & Zalo', icon: 'settings' },
];

export default function SystemConfig() {
  useDocumentTitle('Cấu hình Hệ thống');
  const [active, setActive] = useState('workflow');

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant p-6 flex-shrink-0 z-10 shadow-sm">
        <h1 className="font-display-lg text-on-surface tracking-tight">Cấu hình Hệ thống</h1>
        <p className="font-body-md text-secondary mt-1">
          Quản lý biểu mẫu đơn, luồng phê duyệt và thiết lập quy tắc vận hành hệ thống
        </p>
      </div>

      {/* Horizontal Tabs */}
      <div className="bg-surface border-b border-outline-variant px-6 flex-shrink-0 z-10 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
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
