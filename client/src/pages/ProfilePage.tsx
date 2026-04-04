import { useEffect, useState } from "react";
import { ArrowPathIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { accountService } from "@/features/account/services/accountService";
import type { UserProfileDto } from "@/features/account/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import FeedItemCard from "@/features/feed/components/FeedItemCard";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedItemDto } from "@/features/feed/types";
import { SERVER_URL } from "@/lib/api";

export default function ProfilePage() {
  const { t } = useTranslation("feed");
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [posts, setPosts] = useState<FeedItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        if (currentUser?.username) {
          navigate(`/${currentUser.username}`, { replace: true });
        }
        return;
      }

      try {
        const data = await accountService.getProfileByUsername(username);
        setUser(data);
        await loadPosts(username);
      } catch (error) {
        toast.error(t("profile.errors.load_profile"));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [username, currentUser?.username, navigate, t]);

  const loadPosts = async (username: string, cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setPostsLoading(true);
      }

      const response = await feedService.getProfileFeed(username, cursor);
      setPosts((prev) =>
        cursor ? [...prev, ...response.items] : response.items,
      );
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("Profile posts could not be loaded", error);
      toast.error(t("profile.empty_title"));
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
              {t("profile.stats.level", { level: user?.level ?? 0 })}
            </div>
          </div>

          <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70">
              <div className="mb-1 text-sm text-skin-muted">
                {t("profile.stats.wallet")}
              </div>
              <div className="text-2xl font-bold text-skin-secondary">
                {user?.money}{" "}
                <span className="text-xs text-skin-muted">
                  {t("profile.stats.coin")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70">
              <div className="mb-1 text-sm text-skin-muted">
                {t("profile.stats.streak")}
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-skin-primary">
                <span>{user?.currentStreak}</span>
                <span className="text-sm text-skin-muted">
                  {t("profile.stats.days")}
                </span>
              </div>
            </div>

            <div className="col-span-1 rounded-xl border border-skin-border/50 bg-skin-surface/50 p-5 transition hover:bg-skin-surface/70 sm:col-span-2">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-skin-muted">
                  {t("profile.stats.xp_progress")}
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
                {t("profile.stats.total_xp", { totalXp: user?.totalXp ?? 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-skin-border bg-skin-surface p-6 shadow-xl">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {t("profile.eyebrow")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-skin-text">
            {t("profile.title")}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-skin-muted">
            {t("profile.subtitle")}
          </p>
        </div>

        {postsLoading ? (
          <div className="flex h-40 items-center justify-center text-skin-text">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-skin-border/60 bg-skin-base/40 px-8 py-14 text-center">
            <h3 className="text-xl font-semibold text-skin-text">
              {t("profile.empty_title")}
            </h3>
            <p className="mt-3 text-sm leading-6 text-skin-muted">
              {t("profile.empty_subtitle")}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {posts.map((item) => (
              <FeedItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {nextCursor && user ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => void loadPosts(user.username, nextCursor)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-skin-border/60 bg-skin-surface px-5 py-3 text-sm font-medium text-skin-text transition hover:border-skin-primary/40 hover:bg-skin-surface/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${loadingMore ? "animate-spin" : ""}`}
              />
              {loadingMore ? t("buttons.loading_more") : t("buttons.load_more")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
