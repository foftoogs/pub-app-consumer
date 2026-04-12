import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Lazy require breaks the lib/api ↔ features/auth/store cycle. By the time
  // any request fires, the auth store module has been initialised by the
  // root layout, so this is safe.
  const {
    useAuthStore,
  } = require('@/features/auth/store') as typeof import('@/features/auth/store');
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
