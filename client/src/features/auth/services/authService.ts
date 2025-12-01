import api from '../../../lib/api';
import type { LoginDto, RegisterDto, AuthResponse, UserProfileDto } from '../types';

export const authService = {
  login: async (data: LoginDto) => {
    const response = await api.post<AuthResponse>('/Auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterDto) => {
    const response = await api.post('/Auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<UserProfileDto>('/Profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    // Redirect to login page after logout
    window.location.href = '/login';
  }
};