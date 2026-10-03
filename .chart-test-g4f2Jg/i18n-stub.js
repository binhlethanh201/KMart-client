exports.useI18n = () => ({ t: (k, v) => { if (v && v.v0 !== undefined) return String(k).replace(/\{v0\}/g, v.v0); return k; } });
