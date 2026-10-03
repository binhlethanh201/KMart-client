import axios from 'axios';
import { clearSessionStorage } from '../utils/session';

// Sau khi hợp nhất: chỉ khai báo địa chỉ API ở MỘT nơi rồi export cho các service khác dùng.
// .env không còn được commit (đã nằm trong .gitignore) nên phải giữ giá trị dự phòng cho máy dev.
export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5151';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kmart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling global errors like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired - BE-14: xoa het trang thai phien, khong chi token
      clearSessionStorage();
      // Dispatch an event so the UI can redirect
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
