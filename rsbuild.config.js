import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: './src/main.jsx' },
  },
  html: {
    template: './public/index.html',
  },
  server: {
    port: 5173,
  },
  performance: {
    /*
     * Bản build production loại bỏ toàn bộ console.* — lỗi axios in ra console
     * kèm `config.headers.Authorization` (Bearer token) nên giữ console ở prod
     * là kênh lộ token trên devtools của người dùng.
     */
    removeConsole: true,
  },
  dev: {
    // Tắt hot-module replacement (vite-like "tự sửa trang").
    // Vẫn full-reload khi save; muốn zero auto-change thì dùng `npm run build` + `npm run preview`.
    hmr: false,
  },
});
