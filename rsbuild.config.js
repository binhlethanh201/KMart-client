import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: './src/main.jsx' },
  },
  html: {
    template: './index.html',
  },
  server: {
    port: 5173,
  },
  dev: {
    // Tắt hot-module replacement (vite-like "tự sửa trang").
    // Vẫn full-reload khi save; muốn zero auto-change thì dùng `npm run build` + `npm run preview`.
    hmr: false,
  },
});
