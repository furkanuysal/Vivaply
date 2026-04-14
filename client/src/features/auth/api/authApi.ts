import api, { setAccessToken } from "@/shared/lib/api";
import type { AuthResponse, LoginDto, RegisterDto } from "@/features/auth/types";

export const authApi = {
  login: async (data: LoginDto) => {
    const response = await api.post<AuthResponse>("/Auth/login", data);

    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  register: async (data: RegisterDto) => {
    const response = await api.post("/Auth/register", data);
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
