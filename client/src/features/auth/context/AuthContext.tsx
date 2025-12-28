// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import type { UserProfileDto, LoginDto, RegisterDto } from "../types";
import { toast } from "react-toastify";

interface AuthContextType {
  user: UserProfileDto | null;
  loading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // App start (F5)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Page refresh when Cookie's refresh token with new access token try
        const success = await authService.refreshToken();
        if (success) {
          // Access token success, get profile
          const userData = await authService.getProfile();
          setUser(userData);
        }
      } catch (error) {
        // Session fail, user login page
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginDto) => {
    try {
      const res = await authService.login(data);
      if (res.accessToken) {
        const userData = await authService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    await authService.register(data);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
