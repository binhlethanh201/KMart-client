// Store cho file mẫu (template) đính kèm của trường loại "Tải file", khoá theo field id.
// Data URL nằm trong bộ nhớ; ĐỒNG THỜI mirror sang localStorage (key riêng, không nhét vào
// formFields) để sau khi tải lại trang — hoặc khi màn tạo đơn đọc ở nơi khác — người tạo đơn
// vẫn còn chỗ tải file mẫu xuống. Mirror hỏng (quota / private mode) thì chỉ mất bản cache,
// cấu hình tên file mẫu trong formFields vẫn còn.
const STORAGE_KEY = 'kmart.form.templateFiles';
const store = new Map();

function loadDisk() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDisk() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(store)));
  } catch {
    /* quota / private mode - bỏ qua, bản trong bộ nhớ vẫn dùng được */
  }
}

// Dựng cache từ bản mirror sẵn có (nếu còn) để download sống sót qua reload trang.
Object.entries(loadDisk()).forEach(([id, data]) => {
  if (data && data.name) store.set(id, data);
});

export const templateFileStore = {
  get(fieldId) {
    return store.get(fieldId) || null;
  },
  set(fieldId, data) {
    store.set(fieldId, data);
    saveDisk();
  },
  remove(fieldId) {
    store.delete(fieldId);
    saveDisk();
  },
};
