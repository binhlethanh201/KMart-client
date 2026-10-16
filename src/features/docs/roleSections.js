import { isApproverAccount } from '../../utils/approverAccounts';

/**
 * DOCS-07: trang Hướng dẫn chia nội dung theo VAI TRÒ.
 *
 * Mỗi mục cấp 2 trong file markdown có một dòng đánh dấu ngay dưới tiêu đề:
 *
 *     ## 4. Vai trò NHÂN SỰ (HR) — ...
 *     <!-- seen-by: hr -->
 *
 * Trang chỉ hiện những mục mà tài khoản đang đăng nhập được phép xem, nhờ vậy nhân viên
 * không phải đọc qua phần cấu hình hệ thống và ngược lại. Mục KHÔNG có dòng đánh dấu được
 * coi là dùng chung (an toàn cho các bản dịch chưa kịp thêm đánh dấu).
 */
export const SEEN_BY_RE = /^<!--\s*seen-by:\s*([a-z-]+)\s*-->\s*$/;

/** Nhãn hợp lệ và cách quyết định ai thấy. */
export const VISIBILITY = {
  all: () => true,
  // Mục 3: chỉ người có quyền duyệt (dùng lại đúng định nghĩa của sidebar/ủy quyền).
  approver: (currentUser, hasPermission) => isApproverAccount(currentUser, hasPermission),
  // Mục 4 và 5: menu Nhân sự / Cấu hình — cùng điều kiện mà Sidebar đang dùng.
  'hr-admin': (currentUser) => currentUser?.role === 'ADMIN' || currentUser?.role === 'HR',
};

/**
 * Cắt markdown thành các mục theo tiêu đề `##`, chỉ giữ mục được phép xem, và bỏ mọi dòng
 * đánh dấu trước khi render.
 *
 * Tiêu đề phải bị cắt CÙNG mục: nếu chỉ bỏ phần thân thì mục lục vẫn hiện tên mục đã ẩn.
 * Khối đầu tiên (tiêu đề `#` + đoạn mở đầu, trước `## ` đầu tiên) luôn được giữ.
 */
export function filterSectionsByRole(md, canSee = () => true) {
  if (!md) return md;

  const blocks = [{ lines: [], hide: false }];
  for (const line of md.replace(/\r/g, '').split('\n')) {
    const marker = line.match(SEEN_BY_RE);
    if (marker) {
      blocks[blocks.length - 1].hide = !canSee(marker[1]);
      continue;
    }
    if (line.startsWith('## ')) blocks.push({ lines: [], hide: false });
    blocks[blocks.length - 1].lines.push(line);
  }

  return blocks
    .filter((b, i) => i === 0 || !b.hide)
    .flatMap((b) => b.lines)
    .join('\n');
}
