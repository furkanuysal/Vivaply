import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getActorAvatarUrl } from "@/features/feed/api/feedApi";
import type { SearchUserDto } from "@/features/search/types";

interface SearchUserCardProps {
  user: SearchUserDto;
}

export default function SearchUserCard({ user }: SearchUserCardProps) {
  const { t } = useTranslation(["search", "profile"]);
  const avatarUrl = getActorAvatarUrl(user.avatarUrl ?? undefined);

  return (
    <Link
      to={`/${user.username}`}
      className="block rounded-2xl border border-skin-border/50 bg-skin-surface/80 p-4 transition hover:border-skin-primary/30 hover:bg-skin-surface"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-skin-base">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-skin-primary">
              {user.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-skin-text">{user.username}</p>
            {user.isCurrentUser ? (
              <span className="rounded-full border border-skin-border/60 px-2 py-0.5 text-[11px] font-medium text-skin-muted">
                {t("search:labels.you")}
              </span>
            ) : null}
            {user.isFollowingCurrentUser ? (
              <span className="rounded-full border border-skin-secondary/20 bg-skin-secondary/10 px-2 py-0.5 text-[11px] font-medium text-skin-secondary">
                {t("profile:social.follows_you")}
              </span>
            ) : null}
          </div>

          {user.bio ? (
            <p className="line-clamp-2 text-sm leading-6 text-skin-muted">{user.bio}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 text-xs text-skin-muted">
            <span>
              <strong className="font-semibold text-skin-text">{user.followersCount}</strong>{" "}
              {t("search:stats.followers")}
            </span>
            <span>
              <strong className="font-semibold text-skin-text">{user.followingCount}</strong>{" "}
              {t("search:stats.following")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
