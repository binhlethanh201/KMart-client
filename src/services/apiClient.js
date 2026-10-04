import axios from 'axios';
import { clearSessionStorage } from '../utils/session';

// Sau khi hợp nhất: chỉ khai báo địa chỉ API ở MỘT nơi rồi export cho các service khác dùng.
//
// BE-119: KHÔNG dùng giá trị dự phòng `|| 'http://localhost:5151'` nữa. Lý do: khi deploy (bản
// build tĩnh), nếu quên cấu hình biến môi trường thì giá trị dự phòng sẽ âm thầm trỏ mọi request về
// localhost của CHÍNH MÁY NGƯỜI DÙNG — giao diện vẫn chạy nhưng mọi API đều hỏng, rất khó lần ra.
// Nay địa chỉ API CHỈ đến từ biến môi trường (xem `.env.example`); thiếu biến thì cảnh báo rõ ngay
// trên console thay vì im lặng dùng sai địa chỉ.
export const API_URL = import.meta.env.PUBLIC_API_URL;

if (!API_URL) {
  console.error(
    '[KMart] Thiếu biến môi trường PUBLIC_API_URL. Hãy tạo file .env (xem .env.example) ' +
    'và đặt PUBLIC_API_URL=<địa chỉ máy chủ API>, sau đó khởi động lại dev server / build lại.'
  );
}

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
