/**
 * BE-89: ánh xạ dữ liệu đơn về đúng field của cấu hình HIỆN TẠI.
 *
 * Bối cảnh: mỗi field của mẫu đơn có một "tên lưu trữ" (`name` / `fieldName`). Khi quản trị viên sửa
 * mẫu đơn, tên đó có thể đổi (VD `field_1791106166377` -> `from_date`). Nhưng dữ liệu của những đơn
 * đã tạo trước đó vẫn giữ tên CŨ.
 *
 * Hệ quả trước đây:
 *   * form "Bổ sung đơn từ" để trống Từ ngày / Đến ngày / Lý do / Mô tả công việc vì nó tìm giá trị
 *     theo tên MỚI trong khi dữ liệu nằm dưới tên CŨ;
 *   * trang chi tiết đơn hiện thẳng tên khoá thô (`field_1791046240220`) thay vì nhãn "Từ ngày";
 *   * máy chủ lọc dữ liệu theo cấu hình field nên các khoá cũ bị XOÁ khi người dùng bổ sung -> nội
 *     dung đơn bị thay đổi/mất.
 *
 * Cách xử lý: luôn tra cứu giá trị qua MỌI cách gọi tên của field (name / fieldName / id / nhãn), rồi
 * quy về khoá của cấu hình hiện tại. Nhờ vậy dữ liệu cũ đọc được, và khi gửi lại thì được ghi dưới
 * tên mới nên không mất.
 */

/** Các khoá hệ thống không phải field của mẫu đơn. */
const SYSTEM_KEYS = new Set(['departments', '__approvers', '__fieldLabels']);

/** Khoá hệ thống (bắt đầu bằng `__`) luôn bị ẩn khỏi giao diện. */
const isSystemKey = (key) => SYSTEM_KEYS.has(key) || String(key).startsWith('__');

/** Chuẩn hoá để so khớp: bỏ dấu, bỏ khoảng trắng thừa, không phân biệt hoa/thường. */
const normalise = (s) => String(s ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .trim()
  .toLowerCase();

/**
 * BE-89: bản đồ "nhãn -> tên field CŨ" lưu kèm trong dữ liệu đơn (`__fieldLabels`).
 * Nhờ nó, khi mẫu đơn đổi tên field (VD `field_1791106166377` -> `from_date`) thì dữ liệu của những
 * đơn đã tạo trước đó vẫn tra ra được, vì nhãn ("Từ ngày") không đổi.
 */
function legacyKeysByLabel(rawData) {
  const labels = rawData?.__fieldLabels;
  if (!labels || typeof labels !== 'object') return new Map();
  const map = new Map();
  Object.entries(labels).forEach(([oldKey, label]) => {
    const n = normalise(label);
    if (n) map.set(n, oldKey);
  });
  return map;
}

/**
 * BE-91: bản đồ "tên field -> nhãn" lưu kèm trong dữ liệu đơn (`__fieldLabels`).
 * Dùng khi KHÔNG tra được cấu hình field (mẫu đơn đã bị xoá) để vẫn hiển thị nhãn thật.
 */
function labelsByStoredKey(rawData) {
  const labels = rawData?.__fieldLabels;
  if (!labels || typeof labels !== 'object') return new Map();
  return new Map(
    Object.entries(labels)
      .filter(([, label]) => label)
      .map(([key, label]) => [key, String(label)])
  );
}

/** Khoá lưu trữ chính thức của một field theo cấu hình hiện tại. */
export function resolveFieldKey(field) {
  return String(field?.name || field?.fieldName || field?.id || '').trim();
}

/** Mọi tên mà dữ liệu có thể dùng để chỉ field này (tên hiện tại + tên cũ + nhãn). */
export function fieldAliases(field) {
  const aliases = new Set();
  [field?.name, field?.fieldName, field?.id].forEach((v) => {
    const s = String(v ?? '').trim();
    if (s) aliases.add(s);
  });
  return [...aliases];
}

/** Nhãn hiển thị của field: ưu tiên nhãn cấu hình, không có thì dùng tên lưu trữ. */
export function fieldLabel(field) {
  const label = String(field?.label ?? '').trim();
  if (label) return label;
  return resolveFieldKey(field);
}

/** Sắp xếp field theo đúng thứ tự hiển thị trong mẫu đơn. */
export function sortFields(fields) {
  return [...(fields || [])].sort(
    (a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0)
  );
}

/**
 * Tìm khoá dữ liệu ứng với một field: thử tên hiện tại trước, rồi tới tên cũ tra theo NHÃN.
 * @returns {string|null} khoá có trong `data`, hoặc null nếu không tìm thấy
 */
function findDataKey(field, data, legacyByLabel) {
  for (const alias of fieldAliases(field)) {
    if (Object.prototype.hasOwnProperty.call(data, alias)) return alias;
  }
  const labelKey = normalise(fieldLabel(field));
  const legacyKey = labelKey ? legacyByLabel.get(labelKey) : null;
  if (legacyKey && Object.prototype.hasOwnProperty.call(data, legacyKey)) return legacyKey;
  return null;
}

/**
 * Dựng lại `dynamic` (dữ liệu các field động) theo khoá của cấu hình hiện tại.
 *
 * @param {Array} fields danh sách field của mẫu đơn (cấu hình hiện tại)
 * @param {object} rawData dữ liệu thô của đơn (khoá có thể là tên cũ)
 * @returns {{ dynamic: object, unmatched: object }} `dynamic` khoá theo field hiện tại;
 *          `unmatched` là những khoá không thuộc field nào (chỉ để tham khảo).
 */
export function buildDynamicFromRaw(fields, rawData) {
  const data = rawData && typeof rawData === 'object' ? rawData : {};
  const legacyByLabel = legacyKeysByLabel(data);
  const usedKeys = new Set();
  const dynamic = {};

  sortFields(fields).forEach((field) => {
    const key = resolveFieldKey(field);
    if (!key) return;
    const dataKey = findDataKey(field, data, legacyByLabel);
    if (dataKey === null) return;
    dynamic[key] = data[dataKey];
    usedKeys.add(dataKey);
  });

  const unmatched = {};
  Object.entries(data).forEach(([key, value]) => {
    if (isSystemKey(key) || usedKeys.has(key)) return;
    if (Object.prototype.hasOwnProperty.call(dynamic, key)) return;
    unmatched[key] = value;
  });

  return { dynamic, unmatched };
}

/**
 * Danh sách dòng để hiển thị chi tiết đơn: nhãn thật + giá trị, theo thứ tự mẫu đơn.
 * Khoá không khớp field nào vẫn được hiện (giữ nguyên tên khoá) để không giấu dữ liệu.
 *
 * @returns {Array<{key: string, label: string, value: any, translatable: boolean}>}
 */
export function resolveFormRows(fields, rawData) {
  const data = rawData && typeof rawData === 'object' ? rawData : {};
  const legacyByLabel = legacyKeysByLabel(data);
  const labelsByKey = labelsByStoredKey(data);
  const rows = [];
  const usedKeys = new Set();

  sortFields(fields).forEach((field) => {
    const key = resolveFieldKey(field);
    if (!key) return;

    const dataKey = findDataKey(field, data, legacyByLabel);
    if (dataKey === null) return;

    const value = data[dataKey];
    usedKeys.add(dataKey);
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;

    rows.push({ key, label: fieldLabel(field), value, translatable: true });
  });

  Object.entries(data).forEach(([key, value]) => {
    if (isSystemKey(key) || usedKeys.has(key)) return;
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    // BE-91: mẫu đơn của đơn này có thể đã bị xoá nên không tra được cấu hình field. Khi đó dùng
    // nhãn đã lưu kèm trong đơn (`__fieldLabels`) để vẫn hiện "Từ ngày" thay vì tên khoá thô.
    rows.push({ key, label: labelsByKey.get(key) || key, value, translatable: false });
  });

  return rows;
}

export default resolveFormRows;

/**
 * BE-89: đọc `comment` của mốc lịch sử "đã bổ sung và gửi lại" thành danh sách thay đổi.
 * Máy chủ lưu dạng `{ "changes": [{ key, from, to }] }`.
 *
 * @param {string|undefined|null} comment
 * @returns {Array<{key: string, from: string, to: string}>}
 */
export function parseSupplementChanges(comment) {
  const text = String(comment ?? '').trim();
  if (!text || !text.startsWith('{')) return [];
  try {
    const parsed = JSON.parse(text);
    const changes = parsed?.changes;
    if (!Array.isArray(changes)) return [];
    return changes
      .filter((c) => c && c.key)
      .map((c) => ({ key: String(c.key), from: String(c.from ?? ''), to: String(c.to ?? '') }));
  } catch {
    return [];
  }
}

/**
 * BE-89: đổi danh sách thay đổi thành dòng hiển thị, thay tên khoá bằng NHÃN field ("Từ ngày").
 * Khoá không khớp field nào thì giữ nguyên tên khoá để không giấu thông tin.
 *
 * @param {Array<{key: string, from: string, to: string}>} changes
 * @param {Array} fields cấu hình field hiện tại
 * @param {object} [rawData] dữ liệu đơn — có `__fieldLabels` giúp đổi tên khoá cũ thành nhãn
 * @returns {Array<{label: string, from: string, to: string}>}
 */
export function describeSupplementChanges(changes, fields, rawData = {}) {
  // Tên field hiện tại -> nhãn
  const labelByKey = new Map();
  sortFields(fields).forEach((f) => {
    const key = resolveFieldKey(f);
    if (key) labelByKey.set(key, fieldLabel(f));
  });

  // Tên field CŨ (khoá) -> nhãn, lấy từ `__fieldLabels` lưu kèm trong dữ liệu đơn
  const labelByLegacyKey = new Map();
  const legacyLabels = rawData?.__fieldLabels;
  if (legacyLabels && typeof legacyLabels === 'object') {
    Object.entries(legacyLabels).forEach(([oldKey, label]) => {
      labelByLegacyKey.set(oldKey, String(label));
    });
  }

  return (changes || []).map(({ key, from, to }) => ({
    label: labelByKey.get(key) || labelByLegacyKey.get(key) || key,
    from,
    to,
  }));
}
