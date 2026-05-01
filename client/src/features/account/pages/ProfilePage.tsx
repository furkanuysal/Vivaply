import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  MapPinIcon,
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
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [socialListOpen, setSocialListOpen] = useState(false);
  const [socialListLoading, setSocialListLoading] = useState(false);
  const [socialListMode, setSocialListMode] = useState<"followers" | "following">(
    "followers",
  );
  const [socialUsers, setSocialUsers] = useState<FollowUserDto[]>([]);
  const activeTab = getValidProfileTab(searchParams.get("tab"));

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        if (currentUser?.username) {
          navigate(`/${currentUser.username}`, { replace: true });
        }
        return;
      }

      try {
        const data = await accountApi.getProfileByUsername(username);
        setUser(data);
        await loadPosts(username, activeTab);
      } catch (error) {
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

  const profileTabs: Array<{ key: ProfileTab; label: string }> = [
    { key: "posts", label: t("profile:tabs.posts") },
    { key: "content", label: t("profile:tabs.content") },
    { key: "replies", label: t("profile:tabs.replies") },
    { key: "media", label: t("profile:tabs.media") },
  ];
  const activeTabIndex = profileTabs.findIndex((tab) => tab.key === activeTab);

  const openSocialList = async (mode: "followers" | "following") => {
    if (!user) return;

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

  return (
    <div className="animate-fade-in space-y-8">
      <div className="rounded-2xl border border-skin-border bg-skin-surface p-8 shadow-xl">
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

            {user?.location ? (
              <div className="mt-1 flex items-center gap-1 text-sm text-skin-muted">
                <MapPinIcon className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            ) : null}

            {user?.bio ? (
              <p className="mt-2 max-w-xs text-sm italic text-skin-muted">
                "{user.bio}"
              </p>
            ) : null}

            <div className="mt-3 rounded-full border border-skin-primary/30 bg-skin-primary/20 px-3 py-1 text-xs font-bold text-skin-primary">
              {t("profile:stats.level", { level: user?.level ?? 0 })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-skin-muted">
              <button
                type="button"
                onClick={() => void openSocialList("followers")}
                className="transition hover:text-skin-text"
              >
                <span className="font-semibold text-skin-text">
                  {user?.followersCount ?? 0}
                </span>{" "}
                {t("profile:stats.followers")}
              </button>
              <button
                type="button"
                onClick={() => void openSocialList("following")}
                className="transition hover:text-skin-text"
              >
                <span className="font-semibold text-skin-text">
                  {user?.followingCount ?? 0}
                </span>{" "}
                {t("profile:stats.following")}
              </button>
            </div>

            {!user?.isCurrentUser && user?.followPolicy !== FollowPolicy.Disabled ? (
              <button
                type="button"
                onClick={() => void handleFollowToggle()}
                disabled={followLoading}
                className={`group mt-4 inline-flex min-w-[132px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
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
                      : t("profile:actions.follow")}
              </button>
            ) : null}
          </div>

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
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-skin-border bg-skin-surface shadow-xl">
        <div className="space-y-2 px-6 pb-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {t("profile:eyebrow")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-skin-text">
            {t("profile:title")}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-skin-muted">
            {t("profile:subtitle")}
          </p>
        </div>

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

        <div className="bg-skin-base/20 px-4 py-5 sm:px-6 sm:py-6">
          {postsLoading ? (
            <div className="flex h-40 items-center justify-center text-skin-text">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface px-8 py-14 text-center">
              <h3 className="text-xl font-semibold text-skin-text">
                {t("profile:empty_title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-skin-muted">
                {t("profile:empty_subtitle")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((item) => (
                <PostCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {nextCursor && user ? (
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
