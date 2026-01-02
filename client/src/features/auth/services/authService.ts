import api, { setAccessToken } from "@/lib/api";
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserProfileDto,
} from "@/features/auth/types";

export const authService = {
  login: async (data: LoginDto) => {
    const response = await api.post<AuthResponse>("/Auth/login", data);

    // If login successful, store access token in memory
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  register: async (data: RegisterDto) => {
    const response = await api.post("/Auth/register", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<UserProfileDto>("/Profile");
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/Auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setAccessToken(null);
    }
  },

  // App first opens, "Silent Login"
  refreshToken: async () => {
    try {
      const response = await api.post("/Auth/refresh-token");
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
