import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "@/features/auth/services/authService";
import type { UserProfileDto, LoginDto, RegisterDto } from "@/features/auth/types";
import { toast } from "react-toastify";

const AUTH_MARKER_KEY = "vivaply_is_logged_in";

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

  useEffect(() => {
    const initAuth = async () => {
      const hasAuthMarker = localStorage.getItem(AUTH_MARKER_KEY);

      if (!hasAuthMarker) {
        setLoading(false);
        return;
      }

      try {
        const success = await authService.refreshToken();
        if (success) {
          const userData = await authService.getProfile();
          setUser(userData);
        } else {
          localStorage.removeItem(AUTH_MARKER_KEY);
        }
      } catch (error) {
        localStorage.removeItem(AUTH_MARKER_KEY);
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
        localStorage.setItem(AUTH_MARKER_KEY, "true");
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    await authService.register(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      localStorage.removeItem(AUTH_MARKER_KEY);
      setUser(null);
      toast.info("Logged out successfully");
    }
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
