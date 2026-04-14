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

export const getApiErrorMessage = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim().length > 0) {
      return data;
    }

    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }

      const title = (data as { title?: unknown }).title;
      if (typeof title === "string" && title.trim().length > 0) {
        return title;
      }

      const errors = (data as { errors?: Record<string, string[] | string> }).errors;
      if (errors && typeof errors === "object") {
        const firstError = Object.values(errors)[0];

        if (Array.isArray(firstError) && typeof firstError[0] === "string") {
          return firstError[0];
        }

        if (typeof firstError === "string" && firstError.trim().length > 0) {
          return firstError;
        }
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
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
