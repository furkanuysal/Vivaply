import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Swagger port
export const BASE_URL = import.meta.env.VITE_API_URL;

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

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // If access token exists, add it to the request headers
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface FailedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh is already in progress, add to queue
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Wait for refresh token
        const response = await axios.post(
          `${BASE_URL}/Auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = response.data;

        // Save new access token
        setAccessToken(newAccessToken);

        // Update header
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Resolve queue
        processQueue(null, newAccessToken);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed (expired or invalid)
        processQueue(refreshError, null);
        setAccessToken(null);
        // Logout user
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
