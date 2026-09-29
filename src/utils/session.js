// BE-14: cac khoa localStorage chua trang thai phien dang nhap.
// Phai xoa khi dang xuat / token het han, neu khong nguoi dung ke tiep tren cung
// trinh duyet se "thua ke" du lieu cua phien truoc (formFields, requests...) -> session nhay.
const SESSION_STORAGE_KEYS = [
  'kmart_token',
  'kmart_user',
  'kmart.approval.v3',
  'kmart.form.fields',
  'kmart.form.categories',
];

export function clearSessionStorage() {
  SESSION_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* private mode / quota - ignore */
    }
  });
}
