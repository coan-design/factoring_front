import axios from 'axios';
import { useAuthStore } from '../stores/auth-store';

/**
 * Sem prefixo /api/v1 — o backend expõe as rotas na raiz (ver auditoria do
 * contrato no prompt de frontend). Ajuste VITE_API_URL no .env.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
