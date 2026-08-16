import axios from 'axios';
import { ADMIN_BE as CONFIG_ADMIN_BE } from './config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

export const ADMIN_BE = formatUrl(CONFIG_ADMIN_BE);
export const ADMIN_API_URL = `${ADMIN_BE}/admin`;
export const ADMIN_AUTH_URL = `${ADMIN_API_URL}/auth`;

const TOKEN_KEY = 'zuna_admin_token';
const ADMIN_KEY = 'zuna_admin_profile';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const applyToken = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export const saveSession = (token, admin) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  applyToken(token);
};

/**
 * Refresh the cached profile without touching the token — used after the
 * operator's own name or role changes, so the console stops showing stale
 * details until the next sign-in.
 */
export const saveAdminProfile = (admin) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  applyToken(null);
};

/**
 * Signs the operator out on the server (best effort) and wipes local state.
 */
export const logout = async () => {
  try {
    if (getStoredToken()) await axios.post(`${ADMIN_AUTH_URL}/logout`);
  } catch {
    // Stateless JWT — a failed audit ping must never block sign-out.
  } finally {
    clearSession();
  }
};

/**
 * Installs a response interceptor that force-signs-out on an expired or
 * rejected session. `onUnauthorized` is called once per rejection.
 */
export const installAuthInterceptor = (onUnauthorized) => {
  const id = axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err.response?.status;
      const isAuthEndpoint = String(err.config?.url || '').includes('/auth/');
      if ((status === 401 || status === 403) && !isAuthEndpoint) {
        clearSession();
        onUnauthorized(err.response?.data?.message || 'Your session has ended. Please sign in again.');
      }
      return Promise.reject(err);
    }
  );
  return () => axios.interceptors.response.eject(id);
};
