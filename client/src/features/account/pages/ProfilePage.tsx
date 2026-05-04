import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  LockClosedIcon,
  MapPinIcon,
  NoSymbolIcon,
  SpeakerXMarkIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { accountApi } from "@/features/account/api/accountApi";
import {
  FollowPolicy,
  FollowStatus,
  type FollowUserDto,
  type UserProfileDto,
} from "@/features/account/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import PostCard from "@/features/feed/components/PostCard";
import { feedApi } from "@/features/feed/api/feedApi";
import {
  applyPostUpdateToList,
  subscribeToPostUpdates,
} from "@/features/feed/services/postUpdateEvents";
import type { FeedItemDto } from "@/features/feed/types";
import { SERVER_URL } from "@/shared/lib/api";

export default function ProfilePage() {
  const { t } = useTranslation(["profile", "feed"]);
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [posts, setPosts] = useState<FeedItemDto[]>([]);
  const [profileAccess, setProfileAccess] = useState<"visible" | "hidden" | "notFound">(
    "visible",
  );
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [isModerationMenuOpen, setIsModerationMenuOpen] = useState(false);
  const [socialListOpen, setSocialListOpen] = useState(false);
  const [socialListLoading, setSocialListLoading] = useState(false);
  const [socialListMode, setSocialListMode] = useState<"followers" | "following">(
    "followers",
  );
  const [socialUsers, setSocialUsers] = useState<FollowUserDto[]>([]);
  const activeTab = getValidProfileTab(searchParams.get("tab"));
  const moderationMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        if (currentUser?.username) {
          navigate(`/${currentUser.username}`, { replace: true });
        }
        return;
      }

      try {
        setProfileAccess("visible");
        const data = await accountApi.getProfileByUsername(username);
        setUser(data);

        if (data.canViewProfile !== false) {
          await loadPosts(username, activeTab);
        } else {
          setPosts([]);
          setNextCursor(null);
        }
      } catch (error) {
        const status = getAxiosStatus(error);

        if (status === 403) {
          setUser(null);
          setPosts([]);
          setNextCursor(null);
          setProfileAccess("hidden");
          return;
        }

        if (status === 404) {
          setUser(null);
          setPosts([]);
          setNextCursor(null);
          setProfileAccess("notFound");
          return;
        }

        toast.error(t("profile:errors.load_profile"));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [activeTab, username, currentUser?.username, navigate, t]);

  useEffect(
    () =>
      subscribeToPostUpdates((update) => {
        const nextUpdate =
          update.createdPost && update.createdPost.actor.username !== username
            ? { ...update, createdPost: undefined }
            : update;

        setPosts((current) =>
          applyPostUpdateToList(current, nextUpdate).filter((item) =>
            matchesProfileTab(item, activeTab),
          ),
        );
      }),
    [activeTab, username],
  );

  useEffect(() => {
    const handleFollowRequestAccepted = () => {
      setUser((current) =>
        current?.isCurrentUser
          ? {
              ...current,
              followersCount: (current.followersCount ?? 0) + 1,
            }
          : current,
      );
    };

    window.addEventListener(
      "follow-request:accepted",
      handleFollowRequestAccepted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "follow-request:accepted",
        handleFollowRequestAccepted as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!isModerationMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        moderationMenuRef.current &&
        !moderationMenuRef.current.contains(event.target as Node)
      ) {
        setIsModerationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isModerationMenuOpen]);

  const loadPosts = async (
    username: string,
    scope: ProfileTab,
    cursor?: string | null,
  ) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setPostsLoading(true);
      }

      const response = await feedApi.getProfileFeed(username, scope, cursor);
      setPosts((prev) =>
        cursor ? [...prev, ...response.items] : response.items,
      );
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("Profile posts could not be loaded", error);
      toast.error(t("profile:empty_title"));
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
    }
  };

  const getFullAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (!path.startsWith("/uploads/")) return null;
    return `${SERVER_URL}${path}`;
  };

  const handleFollowToggle = async () => {
    if (!user || user.isCurrentUser || followLoading) return;

    const previous = user;
    const hasExistingRelation =
      user.relationStatus === FollowStatus.Accepted ||
      user.relationStatus === FollowStatus.Pending;

    const nextStatus = hasExistingRelation
      ? null
      : user.followPolicy === FollowPolicy.RequestOnly
        ? FollowStatus.Pending
        : FollowStatus.Accepted;

    setFollowLoading(true);
    setUser((current) =>
      current
        ? {
            ...current,
            relationStatus: nextStatus,
            followersCount: Math.max(
              0,
              (current.followersCount ?? 0) +
                (user.relationStatus === FollowStatus.Accepted
                  ? -1
                  : nextStatus === FollowStatus.Accepted
                    ? 1
                    : 0),
            ),
          }
        : current,
    );

    try {
      if (hasExistingRelation) {
        await accountApi.unfollowUser(user.id);
      } else {
        await accountApi.followUser(user.id);
      }
    } catch (error) {
      setUser(previous);
      toast.error(t("profile:errors.follow_action"));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!user || user.isCurrentUser || blockLoading) return;

    const wasBlocked = user.isBlockedByCurrentUser === true;
    setBlockLoading(true);

    try {
      if (wasBlocked) {
        await accountApi.unblockUser(user.id);
        setIsModerationMenuOpen(false);
        if (username) {
          const refreshed = await accountApi.getProfileByUsername(username);
          setUser(refreshed);
          if (refreshed.canViewProfile !== false) {
            await loadPosts(username, activeTab);
          } else {
            setPosts([]);
            setNextCursor(null);
          }
        }
      } else {
        await accountApi.blockUser(user.id);
        setIsModerationMenuOpen(false);
        setUser((current) =>
          current
            ? {
                ...current,
                isBlockedByCurrentUser: true,
                isMutedByCurrentUser: false,
                canViewProfile: false,
                relationStatus: null,
              }
            : current,
        );
        setPosts([]);
        setNextCursor(null);
      }
    } catch (error) {
      toast.error(t("profile:errors.block_action"));
    } finally {
      setBlockLoading(false);
    }
  };

  const handleMuteToggle = async () => {
    if (!user || user.isCurrentUser || muteLoading || user.isBlockedByCurrentUser) return;

    const wasMuted = user.isMutedByCurrentUser === true;
    setMuteLoading(true);

    try {
      if (wasMuted) {
        await accountApi.unmuteUser(user.id);
      } else {
        await accountApi.muteUser(user.id);
      }

      setIsModerationMenuOpen(false);

      setUser((current) =>
        current
          ? {
              ...current,
              isMutedByCurrentUser: !wasMuted,
            }
          : current,
      );
    } catch (error) {
      toast.error(t("profile:errors.mute_action"));
    } finally {
      setMuteLoading(false);
    }
  };

  const profileTabs: Array<{ key: ProfileTab; label: string }> = [
    { key: "posts", label: t("profile:tabs.posts") },
    { key: "content", label: t("profile:tabs.content") },
    { key: "replies", label: t("profile:tabs.replies") },
    { key: "media", label: t("profile:tabs.media") },
  ];
  const activeTabIndex = profileTabs.findIndex((tab) => tab.key === activeTab);

  const openSocialList = async (mode: "followers" | "following") => {
    if (
      !user ||
      user.isBlockedByCurrentUser ||
      user.hasBlockedCurrentUser
    ) {
      return;
    }

    setSocialListMode(mode);
    setSocialListOpen(true);
    setSocialListLoading(true);

    try {
      const items =
        mode === "followers"
          ? await accountApi.getFollowers(user.id)
          : await accountApi.getFollowing(user.id);
      setSocialUsers(items);
    } catch (error) {
      setSocialUsers([]);
      toast.error(t("profile:errors.load_social_list"));
    } finally {
      setSocialListLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
      </div>
    );
  }

  if (!user && profileAccess === "visible") {
    return null;
  }

  if (profileAccess === "notFound") {
    return (
      <div className="animate-fade-in">
        <section className="rounded-2xl border border-skin-border bg-skin-surface px-8 py-16 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary">
            <XMarkIcon className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {t("profile:not_found.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-skin-text">
            {t("profile:not_found.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-skin-muted">
            {t("profile:not_found.description", { username: username ?? "" })}
          </p>
        </section>
      </div>
    );
  }

  if (profileAccess === "hidden") {
    return (
      <div className="animate-fade-in">
        <section className="rounded-2xl border border-skin-border bg-skin-surface px-8 py-16 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary">
            <LockClosedIcon className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {t("profile:hidden.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-skin-text">
            {t("profile:hidden.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-skin-muted">
            {t("profile:hidden.description", { username: username ?? "" })}
          </p>
        </section>
      </div>
    );
  }

  const isRestrictedProfile = user?.canViewProfile === false;
  const isBlockedByTarget = user?.hasBlockedCurrentUser === true;
  const restrictionCopy = user
    ? getRestrictedProfileCopy(t, user)
    : null;

  if (isBlockedByTarget && user) {
    return (
      <div className="animate-fade-in">
        <section className="rounded-2xl border border-skin-border bg-skin-surface px-8 py-20 shadow-xl">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-2xl font-bold tracking-tight text-skin-text">
              @{user.username}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400">
              <LockClosedIcon className="h-3.5 w-3.5" />
              <span>{t("profile:moderation.blocked_you_title")}</span>
            </span>
            <div className="mt-10 flex h-20 w-20 items-center justify-center rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary">
              <LockClosedIcon className="h-9 w-9" />
            </div>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
              {t("profile:hidden.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-skin-text">
              {t("profile:moderation.blocked_you_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-skin-muted">
              {t("profile:moderation.blocked_you_description")}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="rounded-2xl border border-skin-border bg-skin-surface p-8 shadow-xl">
        {!user?.isCurrentUser ? (
          <div className="mb-4 flex justify-end">
            <div className="relative" ref={moderationMenuRef}>
              <button
                type="button"
                onClick={() =>
                  setIsModerationMenuOpen((current) => !current)
                }
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-skin-border bg-skin-surface text-skin-muted transition hover:border-skin-primary/30 hover:text-skin-text"
                aria-label={t("profile:moderation.menu_label")}
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>

              {isModerationMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-[210px] overflow-hidden rounded-2xl border border-skin-border bg-skin-surface p-2 shadow-2xl">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-skin-muted">
                    {t("profile:moderation.actions_label")}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleBlockToggle()}
                    disabled={blockLoading || user?.hasBlockedCurrentUser}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      user?.isBlockedByCurrentUser
                        ? "text-red-500 hover:bg-red-500/10"
                        : "text-skin-text hover:bg-skin-base"
                    }`}
                  >
                    <NoSymbolIcon className="h-4 w-4 shrink-0" />
                    <span>
                      {blockLoading
                        ? t("profile:actions.processing")
                        : user?.isBlockedByCurrentUser
                          ? t("profile:actions.unblock")
                          : t("profile:actions.block")}
                    </span>
                  </button>

                  {!user?.isBlockedByCurrentUser && !user?.hasBlockedCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => void handleMuteToggle()}
                      disabled={muteLoading}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        user?.isMutedByCurrentUser
                          ? "text-skin-secondary hover:bg-skin-secondary/10"
                          : "text-skin-text hover:bg-skin-base"
                      }`}
                    >
                      <SpeakerXMarkIcon className="h-4 w-4 shrink-0" />
                      <span>
                        {muteLoading
                          ? t("profile:actions.processing")
                          : user?.isMutedByCurrentUser
                            ? t("profile:actions.unmute")
                            : t("profile:actions.mute")}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-skin-primary to-skin-secondary p-1 text-4xl font-bold text-white shadow-lg">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-skin-surface">
                {user?.avatarUrl ? (
                  <img
                    src={getFullAvatarUrl(user.avatarUrl) || ""}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-skin-primary">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-skin-text">
              {user?.username}
            </h2>

            {user?.isFollowingCurrentUser ? (
              <span className="mt-2 inline-flex items-center rounded-full border border-skin-secondary/20 bg-skin-secondary/10 px-3 py-1 text-xs font-semibold text-skin-secondary">
                {t("profile:social.follows_you")}
              </span>
            ) : null}

            {!isRestrictedProfile && user?.location ? (
              <div className="mt-1 flex items-center gap-1 text-sm text-skin-muted">
                <MapPinIcon className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            ) : null}

            {!isRestrictedProfile && user?.bio ? (
              <p className="mt-2 max-w-xs text-sm italic text-skin-muted">
                "{user.bio}"
              </p>
            ) : null}

            {!isRestrictedProfile ? (
              <div className="mt-3 rounded-full border border-skin-primary/30 bg-skin-primary/20 px-3 py-1 text-xs font-bold text-skin-primary">
                {t("profile:stats.level", { level: user?.level ?? 0 })}
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-skin-primary/20 bg-skin-primary/10 px-3 py-1 text-xs font-semibold text-skin-primary">
                <LockClosedIcon className="h-3.5 w-3.5" />
                <span>{t("profile:hidden.eyebrow")}</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm text-skin-muted">
              <button
                type="button"
                onClick={() => void openSocialList("followers")}
                disabled={user?.isBlockedByCurrentUser || user?.hasBlockedCurrentUser}
                className="transition hover:text-skin-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-semibold text-skin-text">
                  {user?.followersCount ?? 0}
                </span>{" "}
                {t("profile:stats.followers")}
              </button>
              <button
                type="button"
                onClick={() => void openSocialList("following")}
                disabled={user?.isBlockedByCurrentUser || user?.hasBlockedCurrentUser}
                className="transition hover:text-skin-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-semibold text-skin-text">
                  {user?.followingCount ?? 0}
                </span>{" "}
                {t("profile:stats.following")}
              </button>
            </div>

            {!user?.isCurrentUser ? (
              <div className="mt-5 flex w-full max-w-sm items-center justify-center">
                {!user?.isBlockedByCurrentUser &&
                !user?.hasBlockedCurrentUser &&
                user?.followPolicy !== FollowPolicy.Disabled ? (
                  <button
                    type="button"
                    onClick={() => void handleFollowToggle()}
                    disabled={followLoading}
                    className={`group inline-flex min-w-[180px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      user?.relationStatus === FollowStatus.Accepted
                        ? "border border-skin-border bg-skin-surface text-skin-text hover:border-skin-primary/40"
                        : user?.relationStatus === FollowStatus.Pending
                          ? "border border-skin-primary/25 bg-skin-primary/10 text-skin-primary hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400"
                          : "bg-skin-primary text-skin-base hover:bg-skin-primary/90"
                    }`}
                  >
                    {followLoading
                      ? t("profile:actions.processing")
                      : user?.relationStatus === FollowStatus.Accepted
                        ? t("profile:actions.following")
                        : user?.relationStatus === FollowStatus.Pending
                          ? (
                            <>
                              <span className="group-hover:hidden">
                                {t("profile:actions.requested")}
                              </span>
                              <span className="hidden group-hover:inline">
                                {t("profile:actions.cancel_request")}
                              </span>
                            </>
                          )
                          : user?.followPolicy === FollowPolicy.RequestOnly
                            ? t("profile:actions.follow_request")
                            : t("profile:actions.follow")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {isRestrictedProfile ? (
            <div className="w-full flex-1 space-y-4">
              <div className="rounded-2xl border border-skin-border/60 bg-skin-base/20 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
                  {t("profile:hidden.eyebrow")}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-skin-text">
                  {restrictionCopy?.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-skin-muted">
                  {restrictionCopy?.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70">
                <div className="mb-1 text-sm text-skin-muted">
                  {t("profile:stats.wallet")}
                </div>
                <div className="text-2xl font-bold text-skin-secondary">
                  {user?.money}{" "}
                  <span className="text-xs text-skin-muted">
                    {t("profile:stats.coin")}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70">
                <div className="mb-1 text-sm text-skin-muted">
                  {t("profile:stats.streak")}
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold text-skin-primary">
                  <span>{user?.currentStreak}</span>
                  <span className="text-sm text-skin-muted">
                    {t("profile:stats.days")}
                  </span>
                </div>
              </div>

              <div className="col-span-1 rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70 sm:col-span-2">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-skin-muted">
                    {t("profile:stats.xp_progress")}
                  </span>
                  <span className="font-bold text-skin-primary">
                    {user?.xp} / 100 XP
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-skin-base">
                  <div
                    className="h-2.5 rounded-full bg-skin-primary transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(user?.xp || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-right text-xs text-skin-muted">
                  {t("profile:stats.total_xp", { totalXp: user?.totalXp ?? 0 })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-skin-border bg-skin-surface shadow-xl">
        <div className="space-y-2 px-6 pb-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {isRestrictedProfile
              ? t("profile:hidden.content_eyebrow")
              : t("profile:eyebrow")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-skin-text">
            {isRestrictedProfile
              ? t("profile:hidden.content_title")
              : t("profile:title")}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-skin-muted">
            {isRestrictedProfile
              ? restrictionCopy?.contentDescription
              : t("profile:subtitle")}
          </p>
        </div>

        {!isRestrictedProfile ? (
          <div className="border-b border-skin-border bg-skin-surface/80 px-3 sm:px-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-skin-border/70" />
              <div
                className="pointer-events-none absolute bottom-0 h-0.5 bg-skin-primary transition-transform duration-300 ease-out"
                style={{
                  width: `${100 / profileTabs.length}%`,
                  transform: `translateX(${activeTabIndex * 100}%)`,
                }}
              />

              <div className="grid grid-cols-4">
                {profileTabs.map((tab) => {
                  const isActive = tab.key === activeTab;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setNextCursor(null);
                        setPosts([]);
                        setSearchParams((current) => {
                          const next = new URLSearchParams(current);
                          next.set("tab", tab.key);
                          return next;
                        });
                      }}
                      className={`relative z-10 whitespace-nowrap px-3 py-5 text-center text-sm font-medium transition-colors duration-300 sm:px-6 ${
                        isActive
                          ? "text-skin-primary"
                          : "text-skin-muted hover:text-skin-text"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-skin-base/20 px-4 py-5 sm:px-6 sm:py-6">
          {isRestrictedProfile ? (
            <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface px-8 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary">
                <LockClosedIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-skin-text">
                {t("profile:hidden.content_locked_title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-skin-muted">
                {restrictionCopy?.contentDescription}
              </p>
            </div>
          ) : postsLoading ? (
            <div className="flex h-40 items-center justify-center text-skin-text">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface px-8 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary">
                <SparklesIcon className="h-7 w-7" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.26em] text-skin-primary/80">
                {t(`profile:empty_states.${activeTab}.eyebrow`)}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-skin-text">
                {t(`profile:empty_states.${activeTab}.title`)}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-skin-muted">
                {t(`profile:empty_states.${activeTab}.description`, {
                  username: user?.username ?? "",
                })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((item) => (
                <PostCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {nextCursor && user && !isRestrictedProfile ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void loadPosts(user.username, activeTab, nextCursor)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-skin-border/60 bg-skin-surface px-5 py-3 text-sm font-medium text-skin-text transition hover:border-skin-primary/40 hover:bg-skin-surface/80 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${loadingMore ? "animate-spin" : ""}`}
                />
                {loadingMore
                  ? t("feed:buttons.loading_more")
                  : t("feed:buttons.load_more")}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {socialListOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSocialListOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-skin-border bg-skin-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-skin-border px-5 py-4">
              <h3 className="text-lg font-semibold text-skin-text">
                {socialListMode === "followers"
                  ? t("profile:social.followers_title")
                  : t("profile:social.following_title")}
              </h3>
              <button
                type="button"
                onClick={() => setSocialListOpen(false)}
                className="rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {socialListLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
                </div>
              ) : socialUsers.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-skin-muted">
                  {socialListMode === "followers"
                    ? t("profile:social.empty_followers")
                    : t("profile:social.empty_following")}
                </div>
              ) : (
                <div className="space-y-1">
                  {socialUsers.map((socialUser) => (
                    <button
                      key={socialUser.id}
                      type="button"
                      onClick={() => {
                        setSocialListOpen(false);
                        navigate(`/${socialUser.username}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-skin-base"
                    >
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-skin-base">
                        {socialUser.avatarUrl ? (
                          <img
                            src={getFullAvatarUrl(socialUser.avatarUrl) || ""}
                            alt={socialUser.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-skin-primary">
                            {socialUser.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-skin-text">
                          {socialUser.username}
                        </p>
                        {socialUser.isFollowingCurrentUser &&
                        socialUser.id !== currentUser?.id ? (
                          <p className="mt-1 text-xs font-medium text-skin-secondary">
                            {t("profile:social.follows_you")}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ProfileTab = "posts" | "content" | "replies" | "media";

function getValidProfileTab(value: string | null): ProfileTab {
  return value === "content" || value === "replies" || value === "media"
    ? value
    : "posts";
}

function matchesProfileTab(item: FeedItemDto, tab: ProfileTab): boolean {
  switch (tab) {
    case "content":
      return !item.parentPostId && !!item.activity;
    case "replies":
      return !!item.parentPostId;
    case "media":
      return item.attachments.length > 0;
    default:
      return !item.parentPostId && !item.activity;
  }
}

function getAxiosStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number } }).response;
    return response?.status ?? null;
  }

  return null;
}

function getRestrictedProfileCopy(
  t: Translator,
  user: UserProfileDto,
) {
  if (user.isBlockedByCurrentUser) {
    return {
      title: t("profile:moderation.blocked_by_you_title"),
      description: t("profile:moderation.blocked_by_you_description"),
      contentDescription: t("profile:moderation.blocked_by_you_description"),
    };
  }

  if (user.hasBlockedCurrentUser) {
    return {
      title: t("profile:moderation.blocked_you_title"),
      description: t("profile:moderation.blocked_you_description"),
      contentDescription: t("profile:moderation.blocked_you_description"),
    };
  }

  const visibility = user.profileVisibility;
  const relationStatus = user.relationStatus;
  const followPolicy = user.followPolicy;

  if (visibility === 1) {
    if (relationStatus === FollowStatus.Pending) {
      return {
        title: t("profile:hidden.followers_only_pending_title"),
        description: t("profile:hidden.followers_only_pending_description"),
        contentDescription: t("profile:hidden.followers_only_pending_content"),
      };
    }

    if (followPolicy === FollowPolicy.RequestOnly) {
      return {
        title: t("profile:hidden.followers_only_request_title"),
        description: t("profile:hidden.followers_only_request_description"),
        contentDescription: t("profile:hidden.followers_only_request_content"),
      };
    }

    if (followPolicy === FollowPolicy.Disabled) {
      return {
        title: t("profile:hidden.followers_only_disabled_title"),
        description: t("profile:hidden.followers_only_disabled_description"),
        contentDescription: t("profile:hidden.followers_only_disabled_content"),
      };
    }

    return {
      title: t("profile:hidden.followers_only_title"),
      description: t("profile:hidden.followers_only_description"),
      contentDescription: t("profile:hidden.followers_only_content"),
    };
  }

  if (followPolicy === FollowPolicy.RequestOnly) {
    return {
      title: t("profile:hidden.private_request_title"),
      description: t("profile:hidden.private_request_description"),
      contentDescription: t("profile:hidden.private_request_content"),
    };
  }

  if (followPolicy === FollowPolicy.Disabled) {
    return {
      title: t("profile:hidden.private_disabled_title"),
      description: t("profile:hidden.private_disabled_description"),
      contentDescription: t("profile:hidden.private_disabled_content"),
    };
  }

  return {
    title: t("profile:hidden.title"),
    description: t("profile:hidden.description", { username: user.username }),
    contentDescription: t("profile:hidden.private_content"),
  };
}

type Translator = (...args: any[]) => string;
