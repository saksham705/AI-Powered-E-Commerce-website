import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

let interceptorAttached = false;

export const attachAuthInterceptor = (getToken) => {
  if (interceptorAttached) return;
  interceptorAttached = true;

  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

export default api;