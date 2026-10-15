import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest không bật `globals`, nên Testing Library không tự đăng ký cleanup qua afterEach
// toàn cục. Không dọn DOM thì test sau nhìn thấy cả DOM của test trước
// ("Found multiple elements with the role ...").
afterEach(cleanup);
