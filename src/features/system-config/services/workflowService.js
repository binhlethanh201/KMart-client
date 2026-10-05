/**
 * BE-134: TRƯỚC ĐÂY tồn tại 2 bản `workflowService` (bản gốc ở `src/services/` và bản này)
 * với các method trùng tên nhưng gọi endpoint khác nhau (bản này từng gọi POST
 * `/workflows/{id}/set-default` trong khi BE nhận PUT -> HTTP 405, lỗi TC-WF-014).
 * Nay chỉ còn MỘT nguồn duy nhất ở `src/services/workflowService.js`; file này giữ lại
 * làm alias để các import cũ trong `system-config` không phải đổi đường dẫn.
 */
export { workflowService } from '../../../services/workflowService';
