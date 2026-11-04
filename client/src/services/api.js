import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true });
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = document.cookie.split('; ').find((part) => part.startsWith('mb_csrf='))?.slice('mb_csrf='.length);
    if (csrf) config.headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !/\/auth\/(login|register)$/.test(error.config?.url || '')) window.dispatchEvent(new Event('matribhasha:session-expired'));
  return Promise.reject(error);
});
export default api;
