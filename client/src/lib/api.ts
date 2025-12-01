import axios from 'axios';

// Swagger port
export const BASE_URL = 'https://localhost:44340/api'; 

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor to add Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;