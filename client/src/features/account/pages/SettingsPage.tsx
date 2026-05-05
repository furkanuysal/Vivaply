import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { accountApi } from "@/features/account/api/accountApi";
import {
  ActivityVisibility,
  FollowPolicy,
  ProfileVisibility,
  type FollowUserDto,
  type UpdatePreferencesDto,
  type UserProfileDto,
} from "@/features/account/types";
import { authApi } from "@/features/auth/api/authApi";
import {
  BellAlertIcon,
  CameraIcon,
  NoSymbolIcon,
  SpeakerXMarkIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_URL } from "@/shared/lib/api";
import LocationPicker from "@/features/location/components/LocationPicker";
import { useTranslation } from "react-i18next";

const DEFAULT_PREFERENCES: UpdatePreferencesDto = {
  profileVisibility: ProfileVisibility.Public,
  activityVisibility: ActivityVisibility.Followers,
  followPolicy: FollowPolicy.AutoAccept,
  emailNotifications: true,
  pushNotifications: true,
};

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<FollowUserDto[]>([]);
  const [mutedUsers, setMutedUsers] = useState<FollowUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "preferences" | "moderation" | "security">("general");
  const [moderationLoading, setModerationLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [uploading, setUploading] = useState(false);
  const [preferences, setPreferences] = useState<UpdatePreferencesDto>(DEFAULT_PREFERENCES);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await accountApi.getProfile();
      setUser(data);
      setBio(data.bio ?? "");
      setUsername(data.username ?? "");
      setLocation(data.location ?? "");
      setPreferences({
        profileVisibility: data.profileVisibility ?? ProfileVisibility.Public,
        activityVisibility: data.activityVisibility ?? ActivityVisibility.Followers,
        followPolicy: data.followPolicy ?? FollowPolicy.AutoAccept,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
      });
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
      await accountApi.updateProfile({
        username,
        bio,
        location,
      });
      setUser((current) =>
        current
          ? {
              ...current,
              username,
              bio,
              location,
            }
          : current,
      );
      toast.success(t("toasts.profile_updated"));
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error(t("toasts.username_cannot_be_taken"));
      } else {
        toast.error(t("toasts.update_failed"));
      }
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountApi.updatePreferences(preferences);
      setUser((current) =>
        current
          ? {
              ...current,
              followPolicy: preferences.followPolicy,
              profileVisibility: preferences.profileVisibility,
              activityVisibility: preferences.activityVisibility,
              emailNotifications: preferences.emailNotifications,
              pushNotifications: preferences.pushNotifications,
            }
          : current,
      );
      toast.success(t("toasts.preferences_updated"));
    } catch {
      toast.error(t("toasts.preferences_error"));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        await accountApi.uploadAvatar(file);
        toast.success(t("toasts.avatar_updated"));
        await loadProfile();
      } catch {
        toast.error(t("toasts.avatar_error"));
      } finally {
        setUploading(false);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success(t("toasts.password_updated"));
      authApi.logout();
    } catch {
      toast.error(t("toasts.password_error"));
    }
  };

  const tabs = [
    {
      id: "general",
      label: t("tabs.general"),
      icon: <UserCircleIcon className="h-5 w-5" />,
    },
    {
      id: "preferences",
      label: t("tabs.preferences"),
      icon: <BellAlertIcon className="h-5 w-5" />,
    },
    {
      id: "moderation",
      label: t("tabs.moderation"),
      icon: <NoSymbolIcon className="h-5 w-5" />,
    },
    {
      id: "security",
      label: t("tabs.security"),
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
  ] as const;

  const visibilityOptions = [
    { value: ProfileVisibility.Public, label: t("preferences.profile_visibility_options.public") },
    { value: ProfileVisibility.FollowersOnly, label: t("preferences.profile_visibility_options.followers_only") },
    { value: ProfileVisibility.Private, label: t("preferences.profile_visibility_options.private") },
  ];

  const activityOptions = [
    { value: ActivityVisibility.Public, label: t("preferences.activity_visibility_options.public") },
    { value: ActivityVisibility.Followers, label: t("preferences.activity_visibility_options.followers") },
    { value: ActivityVisibility.OnlyMe, label: t("preferences.activity_visibility_options.only_me") },
  ];

  const followPolicyOptions = [
    { value: FollowPolicy.AutoAccept, label: t("preferences.follow_policy_options.auto_accept") },
    { value: FollowPolicy.RequestOnly, label: t("preferences.follow_policy_options.request_only") },
    { value: FollowPolicy.Disabled, label: t("preferences.follow_policy_options.disabled") },
  ];

  const loadModerationLists = async () => {
    setModerationLoading(true);
    try {
      const [blocked, muted] = await Promise.all([
        accountApi.getBlockedUsers(),
        accountApi.getMutedUsers(),
      ]);
      setBlockedUsers(blocked);
      setMutedUsers(muted);
    } catch {
      toast.error(t("toasts.moderation_error"));
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "moderation") {
      void loadModerationLists();
    }
  }, [activeTab]);

  const handleUnblock = async (targetUserId: string) => {
    try {
      await accountApi.unblockUser(targetUserId);
      setBlockedUsers((current) => current.filter((user) => user.id !== targetUserId));
      toast.success(t("toasts.unblocked"));
    } catch {
      toast.error(t("toasts.moderation_error"));
    }
  };

  const handleUnmute = async (targetUserId: string) => {
    try {
      await accountApi.unmuteUser(targetUserId);
      setMutedUsers((current) => current.filter((user) => user.id !== targetUserId));
      toast.success(t("toasts.unmuted"));
    } catch {
      toast.error(t("toasts.moderation_error"));
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="w-fit bg-gradient-to-r from-skin-primary to-skin-secondary bg-clip-text text-3xl font-bold text-transparent">
          {t("title")}
        </h1>
        <p className="text-skin-muted">{t("description")}</p>
      </motion.div>

      <div className="flex w-fit gap-2 rounded-xl border border-skin-border/50 bg-skin-surface/50 p-1 backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-skin-primary"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute inset-0 rounded-lg border border-skin-primary/20 bg-skin-primary/10"
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

      <div className="rounded-3xl border border-skin-border/50 bg-skin-surface/40 p-8 shadow-xl backdrop-blur-sm">
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
              <div className="flex flex-col items-center gap-8 border-b border-skin-border/20 pb-8 sm:flex-row">
                <div className="group relative">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-skin-primary to-skin-secondary p-1 shadow-lg shadow-skin-primary/20">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-skin-surface">
                      {user?.avatarUrl ? (
                        <img
                          src={getFullAvatarUrl(user.avatarUrl) || user.avatarUrl}
                          alt={user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="bg-gradient-to-br from-skin-primary to-skin-secondary bg-clip-text text-4xl font-bold text-transparent">
                          {user?.username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                    <div className="flex translate-y-2 transform flex-col items-center gap-1 transition-transform group-hover:translate-y-0">
                      <CameraIcon className="h-8 w-8" />
                      <span className="text-xs font-medium">{t("general.change")}</span>
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
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-skin-text">{user?.username}</h3>
                  <div className="flex flex-col items-center gap-3 text-sm text-skin-muted sm:flex-row">
                    <span className="rounded-full border border-skin-primary/20 bg-skin-primary/10 px-3 py-1 font-medium text-skin-primary">
                      {t("general.level", { level: user?.level || 1 })}
                    </span>
                    <span>{user?.email}</span>
                  </div>
                  <p className="max-w-md text-sm text-skin-muted">{t("general.avatar_hint")}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-skin-text">
                      {t("general.username")}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                      placeholder={t("general.username_placeholder")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-skin-text">
                      {t("general.location")}
                    </label>
                    <LocationPicker value={location} onChange={setLocation} />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-skin-text">
                      {t("general.about")}
                    </label>
                    <textarea
                      className="min-h-[120px] w-full resize-none rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                      placeholder={t("general.about_placeholder")}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <p className="pr-1 text-right text-xs text-skin-muted">
                      {t("general.about_hint")}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-skin-primary px-8 py-3 font-bold text-white shadow-lg shadow-skin-primary/25 transition-all active:scale-95 hover:bg-skin-primary/90 sm:w-auto">
                    {t("general.save_button")}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === "preferences" ? (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl space-y-8"
            >
              <div className="space-y-1 border-b border-skin-border/20 pb-4">
                <h3 className="text-lg font-bold text-skin-text">{t("preferences.title")}</h3>
                <p className="text-sm text-skin-muted">{t("preferences.description")}</p>
              </div>

              <form onSubmit={handleUpdatePreferences} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-skin-text">
                      {t("preferences.profile_visibility")}
                    </label>
                    <select
                      value={preferences.profileVisibility}
                      onChange={(e) =>
                        setPreferences((current) => ({
                          ...current,
                          profileVisibility: Number(e.target.value) as UpdatePreferencesDto["profileVisibility"],
                        }))
                      }
                      className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-skin-muted">{t("preferences.profile_visibility_hint")}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-skin-text">
                      {t("preferences.follow_policy")}
                    </label>
                    <select
                      value={preferences.followPolicy}
                      onChange={(e) =>
                        setPreferences((current) => ({
                          ...current,
                          followPolicy: Number(e.target.value) as UpdatePreferencesDto["followPolicy"],
                        }))
                      }
                      className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                    >
                      {followPolicyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-skin-muted">{t("preferences.follow_policy_hint")}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-skin-text">
                    {t("preferences.activity_visibility")}
                  </label>
                  <select
                    value={preferences.activityVisibility}
                    onChange={(e) =>
                      setPreferences((current) => ({
                        ...current,
                        activityVisibility: Number(e.target.value) as UpdatePreferencesDto["activityVisibility"],
                      }))
                    }
                    className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                  >
                    {activityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-skin-muted">{t("preferences.activity_visibility_hint")}</p>
                </div>

                <div className="space-y-4 rounded-2xl border border-skin-border/40 bg-skin-base/40 p-5">
                  <div>
                    <h4 className="text-sm font-semibold text-skin-text">{t("preferences.notifications_title")}</h4>
                    <p className="mt-1 text-sm text-skin-muted">{t("preferences.notifications_description")}</p>
                  </div>

                  <label className="flex items-center justify-between gap-4 rounded-xl border border-skin-border/30 bg-skin-surface/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-skin-text">{t("preferences.email_notifications")}</p>
                      <p className="text-xs text-skin-muted">{t("preferences.email_notifications_hint")}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        setPreferences((current) => ({
                          ...current,
                          emailNotifications: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-skin-border text-skin-primary focus:ring-skin-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-xl border border-skin-border/30 bg-skin-surface/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-skin-text">{t("preferences.push_notifications")}</p>
                      <p className="text-xs text-skin-muted">{t("preferences.push_notifications_hint")}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) =>
                        setPreferences((current) => ({
                          ...current,
                          pushNotifications: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-skin-border text-skin-primary focus:ring-skin-primary"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-skin-primary px-8 py-3 font-bold text-white shadow-lg shadow-skin-primary/25 transition-all active:scale-95 hover:bg-skin-primary/90 sm:w-auto">
                    {t("preferences.save_button")}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === "moderation" ? (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-1 border-b border-skin-border/20 pb-4">
                <h3 className="text-lg font-bold text-skin-text">{t("moderation.title")}</h3>
                <p className="text-sm text-skin-muted">{t("moderation.description")}</p>
              </div>

              {moderationLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-skin-border/40 bg-skin-base/30 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full border border-red-500/20 bg-red-500/10 p-2 text-red-500">
                        <NoSymbolIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-skin-text">{t("moderation.blocked.title")}</h4>
                        <p className="text-sm text-skin-muted">{t("moderation.blocked.description")}</p>
                      </div>
                    </div>

                    {blockedUsers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-skin-border/50 bg-skin-surface/50 px-4 py-8 text-center text-sm text-skin-muted">
                        {t("moderation.blocked.empty")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUsers.map((blockedUser) => (
                          <div
                            key={blockedUser.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-skin-border/40 bg-skin-surface/70 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-skin-text">@{blockedUser.username}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleUnblock(blockedUser.id)}
                              className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/15"
                            >
                              {t("moderation.blocked.action")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-skin-border/40 bg-skin-base/30 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full border border-skin-secondary/20 bg-skin-secondary/10 p-2 text-skin-secondary">
                        <SpeakerXMarkIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-skin-text">{t("moderation.muted.title")}</h4>
                        <p className="text-sm text-skin-muted">{t("moderation.muted.description")}</p>
                      </div>
                    </div>

                    {mutedUsers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-skin-border/50 bg-skin-surface/50 px-4 py-8 text-center text-sm text-skin-muted">
                        {t("moderation.muted.empty")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mutedUsers.map((mutedUser) => (
                          <div
                            key={mutedUser.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-skin-border/40 bg-skin-surface/70 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-skin-text">@{mutedUser.username}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleUnmute(mutedUser.id)}
                              className="rounded-full border border-skin-secondary/20 bg-skin-secondary/10 px-4 py-2 text-sm font-semibold text-skin-secondary transition hover:bg-skin-secondary/15"
                            >
                              {t("moderation.muted.action")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl space-y-8"
            >
              <div className="space-y-1 border-b border-skin-border/20 pb-4">
                <h3 className="text-lg font-bold text-skin-text">{t("security.title")}</h3>
                <p className="text-sm text-skin-muted">{t("security.description")}</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-skin-text">
                    {t("security.current_password")}
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                    placeholder="********"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-skin-text">
                    {t("security.new_password")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 text-skin-text outline-none transition-all placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
                    placeholder={t("security.new_password_placeholder")}
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-8 py-3 font-bold text-red-500 transition-all active:scale-95 hover:bg-red-500/20 sm:w-auto">
                    {t("security.update_button")}
                  </button>
                  <p className="flex-1 text-xs text-skin-muted">{t("security.hint")}</p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
