import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';

export default function ProductsPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1>{t('Danh mục sản phẩm')}</h1>
    </div>
  );
}
