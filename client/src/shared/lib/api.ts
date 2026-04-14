import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;
export const SERVER_URL = BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const AUTH_EXCLUDED_PATHS = [
  "/Auth/login",
  "/Auth/register",
  "/Auth/refresh-token",
  "/Auth/logout",
];

api.interceptors.request.use(
  (config) => {
    const url = config.url ?? "";

    if (
      accessToken &&
      !AUTH_EXCLUDED_PATHS.some((path) => url.includes(path))
    ) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

interface FailedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    error ? promise.reject(error) : promise.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest.url ?? "";

    if (AUTH_EXCLUDED_PATHS.some((path) => url.includes(path))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/Auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const { accessToken: newAccessToken } = response.data;

        setAccessToken(newAccessToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
