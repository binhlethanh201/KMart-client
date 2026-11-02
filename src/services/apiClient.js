import axios from 'axios';
import { clearSessionStorage } from '../utils/session';

export const API_URL = import.meta.env.PUBLIC_API_URL;

if (!API_URL) {
  console.error(
    '[KMart] Thiếu biến môi trường PUBLIC_API_URL. Hãy tạo file .env (xem .env.example) ' +
    'và đặt PUBLIC_API_URL=<địa chỉ máy chủ API>, sau đó khởi động lại dev server / build lại.'
  );
}

const baseURL = `${API_URL}/api`;
const headers = { 'Content-Type': 'application/json' };

const rawClient = axios.create({ baseURL, headers });
const apiClient = axios.create({ baseURL, headers });

const NO_REFRESH_PATHS = /\/auth\/(login|refresh|reset-password)/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kmart_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('kmart_refresh_token');
    refreshPromise = rawClient
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        localStorage.setItem('kmart_token', data.accessToken);
        localStorage.setItem('kmart_refresh_token', data.refreshToken);
        return data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function refreshWithRecovery() {
  const usedRefresh = localStorage.getItem('kmart_refresh_token');
  try {
    return await refreshAccessToken();
  } catch (err) {
    const latestRefresh = localStorage.getItem('kmart_refresh_token');
    if (latestRefresh && latestRefresh !== usedRefresh) {
      return localStorage.getItem('kmart_token');
    }
    throw err;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (!original) return Promise.reject(error);

    if (status === 429 && !original._retried429) {
      original._retried429 = true;
      const retryAfter = Number(error.response.headers['retry-after']) || 2;
      await sleep(Math.min(retryAfter, 10) * 1000);
      return apiClient(original);
    }

    const url = original.url || '';
    if (status === 401 && !NO_REFRESH_PATHS.test(url) && !original._retried401) {
      original._retried401 = true;
      try {
        const token = await refreshWithRecovery();
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        clearSessionStorage();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    if (status === 403 && error.response?.data?.errorCode === 'PASSWORD_CHANGE_REQUIRED') {
      window.dispatchEvent(new Event('auth:password-change-required'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;