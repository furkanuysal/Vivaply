import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/outline";

type AuthMode = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState(""); // Used for identifier in login, email in register
  const [username, setUsername] = useState(""); // Only for register
  const [password, setPassword] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setEmail("");
      setUsername("");
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        await authService.login({ identifier: email, password });
        toast.success("Welcome back! 🚀");
        onClose();
        navigate("/profile");
      } else {
        await authService.register({ username, email, password });
        toast.success("Account created! Please login. 🎉");
        setMode("login");
        // Maintain email/password for easy login
      }
    } catch (error: any) {
      const message = error.response?.data || "Authentication failed";
      toast.error(typeof message === "string" ? message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-skin-surface border border-skin-border rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-skin-muted hover:text-skin-text transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header / Tabs */}
        <div className="flex border-b border-skin-border/20">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mode === "login"
                ? "text-skin-primary border-b-2 border-skin-primary bg-skin-base/50"
                : "text-skin-muted hover:text-skin-text"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mode === "register"
                ? "text-skin-secondary border-b-2 border-skin-secondary bg-skin-base/50"
                : "text-skin-muted hover:text-skin-text"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-skin-text mb-2">
              {mode === "login" ? "Welcome Back" : "Join Vivaply"}
            </h2>
            <p className="text-skin-muted text-sm">
              {mode === "login"
                ? "Enter your details to access your account"
                : "Start your journey with us today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-skin-muted uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-skin-base border border-skin-border rounded-lg px-4 py-3 text-skin-text placeholder-skin-muted focus:outline-none focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary transition-all"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-skin-muted uppercase mb-1">
                {mode === "login" ? "Email or Username" : "Email"}
              </label>
              <input
                type="text" // 'text' instead of 'email' because login allows username
                required
                className="w-full bg-skin-base border border-skin-border rounded-lg px-4 py-3 text-skin-text placeholder-skin-muted focus:outline-none focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary transition-all"
                placeholder={
                  mode === "login" ? "john@example.com" : "john@example.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-skin-muted uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-skin-base border border-skin-border rounded-lg px-4 py-3 text-skin-text placeholder-skin-muted focus:outline-none focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-lg font-bold text-skin-base shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                mode === "login"
                  ? "bg-skin-primary hover:bg-skin-primary/90 shadow-skin-primary/20"
                  : "bg-skin-secondary hover:bg-skin-secondary/90 shadow-skin-secondary/20"
              }`}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-skin-muted text-sm">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className={`font-semibold hover:underline ${
                  mode === "login" ? "text-skin-secondary" : "text-skin-primary"
                }`}
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
