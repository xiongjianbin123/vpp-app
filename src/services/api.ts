import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动注入 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vpp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 跳转登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vpp_token');
      localStorage.removeItem('vpp_auth_user');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
