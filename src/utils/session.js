const SESSION_STORAGE_KEYS = [
  'kmart_token',
  'kmart_refresh_token',
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
