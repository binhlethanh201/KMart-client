import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-98: sơ đồ cây tổ chức.
 *
 * Trước đây màn "Cơ cấu tổ chức & Siêu thị" chỉ có lưới thẻ phẳng nên không thấy được quan hệ
 * cấp trên – cấp dưới (dù dữ liệu đã có `parentDepartmentId`). Cây này dựng từ chính dữ liệu đó:
 * đơn vị không có cấp trên là gốc, các đơn vị con thụt vào trong, có thể mở/thu từng nhánh.
 *
 * BE-113: khi đang TÌM KIẾM/LỌC, cây nhận thêm cả cấp trên và cấp dưới của kết quả khớp:
 *   * `isFilterMatch === false` -> đơn vị chỉ hiện để giữ nhánh, được LÀM MỜ;
 *   * bộ đếm tách rõ "<N> kết quả · <M> đơn vị hiển thị" để không gây hiểu nhầm là mất dữ liệu.
 */
export default function OrgTree({
  departments = [],
  onEdit,
  onToggleStatus,
  onDelete,
  canEdit = false,
  matchCount,
  isFiltered = false,
  autoExpandKey,
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});

  const { roots, childrenOf } = useMemo(() => {
    const byParent = new Map();
    departments.forEach((d) => {
      const key = d.parentDepartmentId || '__root__';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(d);
    });
    // Đơn vị có cấp trên nhưng cấp trên KHÔNG nằm trong danh sách đang xem (bị lọc/bị xoá)
    // vẫn phải hiển thị, nếu không sẽ "mất" khỏi sơ đồ.
    const ids = new Set(departments.map((d) => d.id));
    const rootList = departments.filter((d) => !d.parentDepartmentId || !ids.has(d.parentDepartmentId));
    rootList.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
    byParent.forEach((list) => list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi')));
    return { roots: rootList, childrenOf: (id) => byParent.get(id) || [] };
  }, [departments]);

  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  // BE-113: có kết quả tìm kiếm/lọc thì mở sẵn mọi nhánh để nhìn thấy ngay vị trí của kết quả
  // (nếu để nhánh đang thu thì kết quả nằm sâu sẽ không thấy, càng giống "bị mất").
  useEffect(() => {
    if (!autoExpandKey || !isFiltered) return;
    setCollapsed({});
  }, [autoExpandKey, isFiltered]);

  const Node = ({ dept, depth }) => {
    const children = childrenOf(dept.id);
    const isCollapsed = collapsed[dept.id] === true;
    const leader = dept.leaders?.[0];
    // BE-113: đơn vị không khớp điều kiện lọc chỉ hiện để giữ nhánh -> làm mờ, không nổi ngang
    // với kết quả thật.
    const dimmed = dept.isFilterMatch === false;

    return (
      <div className={`flex flex-col ${dimmed ? 'opacity-45' : ''}`}>
        <div
          className="group relative flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2.5 shadow-sm hover:border-primary/40 hover:shadow transition-all"
          style={{ marginLeft: depth * 28 }}
        >
          {/* đường nối nhánh */}
          {depth > 0 && (
            <span
              className="absolute top-1/2 -translate-y-1/2 border-t border-dashed border-outline"
              style={{ left: -18, width: 18 }}
            />
          )}

          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggle(dept.id)}
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-secondary hover:bg-surface-container cursor-pointer"
              aria-label={isCollapsed ? t('Mở nhánh') : t('Thu nhánh')}
              title={isCollapsed ? t('Mở nhánh') : t('Thu nhánh')}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCollapsed ? 'chevron_right' : 'expand_more'}
              </span>
            </button>
          ) : (
            // Đơn vị không có cấp dưới: để khoảng trống cho thẳng hàng, không hiện nút vô dụng.
            <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-outline/40">
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </span>
          )}

          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {dept.iconImage
              ? <img src={dept.iconImage} alt={t(dept.name)} className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-[20px]">{dept.icon}</span>}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/departments/${dept.id}`)}
                className="font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer truncate"
              >
                {t(dept.name)}
              </button>
              <span className="text-[11px] font-mono text-secondary bg-surface-container px-1.5 py-0.5 rounded">{dept.code}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-secondary">{t(dept.type)}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${dept.status === 'Active' ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
                {dept.status === 'Active' ? t('Đang hoạt động') : t('Ngừng hoạt động')}
              </span>
            </div>
            <div className="text-[12px] text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
              {leader && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {leader.title === 'Cửa hàng trưởng' ? t('Cửa hàng trưởng') : t('Trưởng phòng')}: {leader.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {t('{v0} nhân sự', { v0: dept.memberCount || 0 })}
                {children.length > 0 && ` · ${t('{v0} đơn vị trực thuộc', { v0: children.length })}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => navigate(`/departments/${dept.id}`)}
              title={t('Xem chi tiết')}
              className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary-container/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(dept)}
                  title={t('Chỉnh sửa')}
                  className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary-container/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus?.(dept)}
                  title={dept.status === 'Active' ? t('Ngừng hoạt động') : t('Mở hoạt động')}
                  className="p-1.5 rounded-md text-secondary hover:text-warning hover:bg-warning-container/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(dept)}
                  title={t('Xóa phòng ban')}
                  className="p-1.5 rounded-md text-secondary hover:text-error hover:bg-error-container/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {!isCollapsed && children.map((child) => <Node key={child.id} dept={child} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <div className="bg-[#f6f6f4] border border-outline-variant rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
          <span className="font-semibold">{t('Sơ đồ tổ chức')}</span>
        </div>
        <span className="text-xs text-secondary">
          {isFiltered
            ? t('{v0} kết quả · {v1} đơn vị hiển thị', { v0: matchCount ?? 0, v1: departments.length })
            : t('{v0} đơn vị · {v1} đơn vị cấp cao nhất', { v0: departments.length, v1: roots.length })}
        </span>
      </div>

      {roots.length === 0 ? (
        <div className="py-10 text-center text-secondary text-sm">{t('Chưa có đơn vị nào để hiển thị.')}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {roots.map((dept) => <Node key={dept.id} dept={dept} depth={0} />)}
        </div>
      )}
    </div>
  );
}
