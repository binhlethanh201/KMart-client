// In-memory store cho file mẫu (template) đính kèm của trường loại "Tải file".
// Giữ data URL ra khỏi localStorage (formFields persisted) để không làm phình quota.
// Khóa theo field id. Sau khi tải lại trang, data URL sẽ mất — khi đó chỉ còn tên file
// (download bị ẩn) nhưng cấu hình tên file mẫu vẫn còn.
const store = new Map();

export const templateFileStore = {
  get(fieldId) {
    return store.get(fieldId);
  },
  set(fieldId, data) {
    store.set(fieldId, data);
  },
  remove(fieldId) {
    store.delete(fieldId);
  },
};
