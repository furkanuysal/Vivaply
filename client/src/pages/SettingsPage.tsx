import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { accountService } from "../features/account/services/accountService";
import { authService } from "../features/auth/services/authService";
import type { UserProfileDto } from "../features/account/types";
import {
  CameraIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_URL } from "@/lib/api";
import LocationPicker from "@/features/location/components/LocationPicker";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  // Form States
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await accountService.getProfile();
      setUser(data);
      if ((data as any).bio) setBio((data as any).bio);
      if ((data as any).location) setLocation((data as any).location);
    } finally {
      setLoading(false);
    }
  };

  const getFullAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await accountService.updateProfile({
        username: user.username,
        bio,
        location,
      });
      toast.success(t("toasts.profile_updated"));
    } catch (error) {
      toast.error(t("toasts.update_failed"));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        await accountService.uploadAvatar(file);
        toast.success(t("toasts.avatar_updated"));
        loadProfile();
      } catch (error) {
        toast.error(t("toasts.avatar_error"));
      } finally {
        setUploading(false);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success(t("toasts.password_updated"));
      authService.logout();
    } catch (error) {
      toast.error(t("toasts.password_error"));
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
      </div>
    );

  const tabs = [
    {
      id: "general",
      label: t("tabs.general"),
      icon: <UserCircleIcon className="w-5 h-5" />,
    },
    {
      id: "security",
      label: t("tabs.security"),
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-skin-primary to-skin-secondary w-fit">
          {t("title")}
        </h1>
        <p className="text-skin-muted">{t("description")}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-skin-surface/50 rounded-xl border border-skin-border/50 backdrop-blur w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "text-skin-primary"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-skin-primary/10 rounded-lg border border-skin-primary/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-skin-surface/40 backdrop-blur-sm rounded-3xl border border-skin-border/50 p-8 shadow-xl">
        <AnimatePresence mode="wait">
          {activeTab === "general" ? (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-skin-border/20">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-skin-primary to-skin-secondary p-1 shadow-lg shadow-skin-primary/20">
                    <div className="w-full h-full rounded-full bg-skin-surface overflow-hidden flex items-center justify-center">
                      {user?.avatarUrl ? (
                        <img
                          src={
                            getFullAvatarUrl(user.avatarUrl) || user.avatarUrl
                          }
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-skin-primary to-skin-secondary">
                          {user?.username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full cursor-pointer backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <CameraIcon className="w-8 h-8" />
                      <span className="text-xs font-medium">
                        {t("general.change")}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                    />
                  </label>

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-2xl font-bold text-skin-text">
                    {user?.username}
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-skin-muted">
                    <span className="px-3 py-1 rounded-full bg-skin-primary/10 text-skin-primary border border-skin-primary/20 font-medium">
                      {t("general.level", { level: user?.level || 1 })}
                    </span>
                    <span>{user?.email}</span>
                  </div>
                  <p className="text-sm text-skin-muted max-w-md">
                    {t("general.avatar_hint")}
                  </p>
                </div>
              </div>

              {/* Form Section */}
              <form
                onSubmit={handleUpdateProfile}
                className="space-y-6 max-w-2xl"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-skin-text ml-1">
                      {t("general.location")}
                    </label>
                    <LocationPicker value={location} onChange={setLocation} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-skin-text ml-1">
                      {t("general.about")}
                    </label>
                    <textarea
                      className="w-full bg-skin-base/50 border border-skin-border/50 rounded-xl px-4 py-3 text-skin-text placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50 outline-none transition-all resize-none min-h-[120px]"
                      placeholder={t("general.about_placeholder")}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <p className="text-xs text-skin-muted text-right pr-1">
                      {t("general.about_hint")}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="bg-skin-primary hover:bg-skin-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-skin-primary/25 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                    {t("general.save_button")}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 max-w-xl"
            >
              <div className="space-y-1 pb-4 border-b border-skin-border/20">
                <h3 className="text-lg font-bold text-skin-text">
                  {t("security.title")}
                </h3>
                <p className="text-sm text-skin-muted">
                  {t("security.description")}
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-skin-text ml-1">
                    {t("security.current_password")}
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-skin-base/50 border border-skin-border/50 rounded-xl px-4 py-3 text-skin-text placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50 outline-none transition-all"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-skin-text ml-1">
                    {t("security.new_password")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-skin-base/50 border border-skin-border/50 rounded-xl px-4 py-3 text-skin-text placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50 outline-none transition-all"
                    placeholder={t("security.new_password_placeholder")}
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                  />
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-8 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                    {t("security.update_button")}
                  </button>
                  <p className="text-xs text-skin-muted flex-1">
                    {t("security.hint")}
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
