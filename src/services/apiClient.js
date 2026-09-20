import axios from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

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
      // Token is invalid/expired
      localStorage.removeItem('kmart_token');
      localStorage.removeItem('kmart_user');
      // Dispatch an event so the UI can redirect
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
