import {
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, type Location, useLocation, useNavigate } from "react-router-dom";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";
import {
  getActorAvatarUrl,
  getFeedActivityType,
  getFeedDescription,
  getFeedImageUrl,
  getFeedTargetPath,
  getFeedTimestamp,
  getFeedTitle,
  getRelativeTime,
  getReviewSnippet,
  isActivityPost,
} from "@/features/feed/services/feedService";
import {
  FeedActivityType,
  FeedPostType,
  type FeedItemDto,
} from "@/features/feed/types";

interface PostCardProps {
  item: FeedItemDto;
  disablePostNavigation?: boolean;
  variant?: "default" | "detailMain" | "threadReply";
}

interface ModalNavigationState {
  backgroundLocation?: Location;
  modalDepth?: number;
}

export default function PostCard({
  item,
  disablePostNavigation = false,
  variant = "default",
}: PostCardProps) {
  const { t, i18n } = useTranslation("feed");
  const navigate = useNavigate();
  const location = useLocation();
  const avatarUrl = getActorAvatarUrl(item.actor.avatarUrl);
  const imageUrl = getFeedImageUrl(item);
  const title = getFeedTitle(item);
  const description = getFeedDescription(item, t);
  const reviewSnippet = getReviewSnippet(item);
  const targetPath = getFeedTargetPath(item);
  const profilePath = `/${item.actor.username}`;
  const activityType = getFeedActivityType(item);
  const hasActivity = isActivityPost(item);
  const shouldRenderContentPreview = Boolean(targetPath);
  const secondaryMeta = getSecondaryMeta(item, t);
  const contentSubtitle = getContentSubtitle(item, secondaryMeta);
  const postPath = `/feed/${item.id}`;
  const isDetailMain = variant === "detailMain";
  const isThreadReply = variant === "threadReply";
  const isFlat = isDetailMain || isThreadReply;
  const interactionProps = {
    onClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
  };

  const openPost = () => {
    if (disablePostNavigation) {
      return;
    }

    const state = location.state as ModalNavigationState | null;
    const backgroundLocation = state?.backgroundLocation ?? location;
    const modalDepth = (state?.modalDepth ?? 0) + 1;

    navigate(postPath, {
      state: {
        backgroundLocation,
        modalDepth,
      },
    });
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disablePostNavigation) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPost();
    }
  };

  return (
    <article
      className={`${
        isFlat
          ? "p-0"
          : "rounded-3xl border border-skin-border/50 bg-skin-surface/90 p-5 shadow-sm backdrop-blur-sm transition hover:border-skin-primary/30 hover:shadow-lg hover:shadow-skin-primary/10"
      } ${disablePostNavigation ? "" : "cursor-pointer"}`}
      onClick={openPost}
      onKeyDown={handleCardKeyDown}
      role={disablePostNavigation ? undefined : "button"}
      tabIndex={disablePostNavigation ? undefined : 0}
    >
      <div className="flex items-start gap-4">
        <Link
          to={profilePath}
          state={{ backgroundLocation: location }}
          className={`block shrink-0 overflow-hidden bg-skin-base transition hover:ring-2 hover:ring-skin-primary/30 focus:outline-none focus:ring-2 focus:ring-skin-primary/40 ${
            isFlat ? "h-11 w-11 rounded-full" : "h-12 w-12 rounded-2xl"
          }`}
          {...interactionProps}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={item.actor.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-skin-primary/20 to-skin-secondary/20 text-lg font-bold text-skin-primary">
              {item.actor.username.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              to={profilePath}
              state={{ backgroundLocation: location }}
              className="text-[15px] font-semibold text-skin-text transition hover:text-skin-primary focus:outline-none focus:ring-2 focus:ring-skin-primary/40"
              {...interactionProps}
            >
              {item.actor.username}
            </Link>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isFlat
                  ? "rounded-full bg-skin-base px-2 py-1 text-skin-muted"
                  : "text-skin-muted/80"
              }`}
            >
              {getActivityLabel(item, activityType, hasActivity, t)}
            </span>
            <span className="text-xs text-skin-muted">
              {getRelativeTime(getFeedTimestamp(item), i18n.resolvedLanguage)}
            </span>
          </div>

          <p
            className={`${shouldRenderContentPreview ? "mb-3" : ""} mt-2 text-skin-text/90 ${
              isFlat ? "text-base leading-8" : "text-sm leading-6"
            }`}
          >
            {renderDescription(description, title, targetPath)}
          </p>

          {reviewSnippet ? (
            <blockquote
              className={`mt-4 border-l-2 border-skin-border/70 pl-4 italic text-skin-muted ${
                isFlat ? "text-base leading-8" : "text-sm"
              }`}
            >
              "{reviewSnippet}"
            </blockquote>
          ) : null}

          {shouldRenderContentPreview ? (
            <Link
              to={targetPath!}
              {...interactionProps}
              className={`mt-4 block overflow-hidden border border-skin-border/40 ${
                isFlat
                  ? "rounded-xl hover:border-skin-border/70"
                  : "rounded-xl bg-skin-surface px-3 py-3 transition hover:bg-skin-border/10"
              }`}
            >
              {isFlat ? (
                <FlatContentPreview
                  imageUrl={imageUrl}
                  title={title}
                  secondaryMeta={contentSubtitle}
                  fallbackType={getFallbackType(activityType)}
                />
              ) : (
                <CardContentPreview
                  imageUrl={imageUrl}
                  title={title}
                  secondaryMeta={contentSubtitle}
                  fallbackType={getFallbackType(activityType)}
                />
              )}
            </Link>
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-skin-muted">
              <PostAction
                icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                label={t("actions.reply")}
                count={item.stats?.replyCount ?? 0}
              />
              <PostAction
                icon={<HeartIcon className="h-4 w-4" />}
                label={t("actions.like")}
                count={item.stats?.likeCount ?? 0}
              />
              <PostAction
                icon={<EyeIcon className="h-4 w-4" />}
                label={t("actions.view")}
                count={item.stats?.viewCount ?? 0}
              />
            </div>

            <div className="flex items-center gap-3 text-skin-muted">
              <PostAction
                icon={<BookmarkIcon className="h-4 w-4" />}
                label={t("actions.save")}
              />
              <PostAction
                icon={<ShareIcon className="h-4 w-4" />}
                label={t("actions.share")}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CardContentPreview({
  imageUrl,
  title,
  secondaryMeta,
  fallbackType,
}: {
  imageUrl: string | null;
  title: string;
  secondaryMeta: string;
  fallbackType: "movie" | "tv" | "game" | "book" | "other";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-skin-base">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <UniversalCoverFallback
            title={title}
            type={fallbackType}
            variant="compact"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="truncate text-sm font-medium text-skin-text">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-skin-muted">
          {secondaryMeta}
        </p>
      </div>
    </div>
  );
}

function FlatContentPreview({
  imageUrl,
  title,
  secondaryMeta,
  fallbackType,
}: {
  imageUrl: string | null;
  title: string;
  secondaryMeta: string;
  fallbackType: "movie" | "tv" | "game" | "book" | "other";
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-skin-surface px-3 py-3">
      <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-skin-base">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <UniversalCoverFallback
            title={title}
            type={fallbackType}
            variant="compact"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 text-base font-semibold text-skin-text">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-skin-muted">
          {secondaryMeta}
        </p>
      </div>
    </div>
  );
}

function PostAction({
  icon,
  label,
  count,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-skin-muted transition hover:text-skin-text"
      aria-label={label}
    >
      {icon}
      {typeof count === "number" ? <span>{count}</span> : null}
    </button>
  );
}

function renderDescription(
  description: string,
  title: string,
  targetPath: string | null,
) {
  if (!targetPath || !title || !description.includes(title)) {
    return description;
  }

  const [before, ...afterParts] = description.split(title);
  const after = afterParts.join(title);

  return (
    <>
      {before}
      <Link
        to={targetPath}
        className="font-medium text-skin-primary transition hover:text-skin-secondary"
        onClick={(event) => event.stopPropagation()}
      >
        {title}
      </Link>
      {after}
    </>
  );
}

function getActivityLabel(
  item: FeedItemDto,
  type: FeedActivityType | null,
  hasActivity: boolean,
  t: ReturnType<typeof useTranslation<"feed">>["t"],
): string {
  if (item.type === FeedPostType.Reply) {
    return t("labels.reply");
  }

  if (item.type === FeedPostType.Quote) {
    return t("labels.quote");
  }

  if (!hasActivity || type === null) {
    return t("labels.shared_in_feed");
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
    case FeedActivityType.EpisodesWatchedBatch:
    case FeedActivityType.SeasonCompleted:
    case FeedActivityType.ShowCompleted:
      return t("labels.watching");
    case FeedActivityType.MovieWatched:
      return t("labels.movie");
    case FeedActivityType.MediaRated:
    case FeedActivityType.GameRated:
    case FeedActivityType.BookRated:
      return t("labels.rating");
    case FeedActivityType.MediaReviewAdded:
    case FeedActivityType.GameReviewAdded:
    case FeedActivityType.BookReviewAdded:
      return t("labels.review");
    case FeedActivityType.GameStarted:
    case FeedActivityType.GameCompleted:
      return t("labels.gaming");
    case FeedActivityType.BookStarted:
    case FeedActivityType.BookFinished:
      return t("labels.reading");
    default:
      return t("labels.library");
  }
}

function getSecondaryMeta(
  item: FeedItemDto,
  t: ReturnType<typeof useTranslation<"feed">>["t"],
): string {
  const payload = item.activity?.payload;
  const type = item.activity?.type;

  if (!payload || type == null) {
    return t("labels.shared_in_feed");
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
      return t("meta.season_episode", {
        season: getNumber(payload.seasonNumber),
        episode: getNumber(payload.episodeNumber),
      });
    case FeedActivityType.EpisodesWatchedBatch:
      return t("meta.season_count", {
        season: getNumber(payload.seasonNumber),
        count: getEpisodeCount(payload),
      });
    case FeedActivityType.SeasonCompleted:
      return t("meta.season_completed", {
        season: getNumber(payload.seasonNumber),
      });
    case FeedActivityType.MediaRated:
    case FeedActivityType.GameRated:
    case FeedActivityType.BookRated:
      return t("meta.rating", { rating: getNumber(payload.rating) });
    case FeedActivityType.MediaReviewAdded:
    case FeedActivityType.GameReviewAdded:
    case FeedActivityType.BookReviewAdded:
      return t("meta.review");
    default:
      return t("labels.shared_in_feed");
  }
}

function getContentSubtitle(item: FeedItemDto, fallback: string): string {
  const payload = item.activity?.payload;

  if (!payload) {
    return fallback;
  }

  const subjectType = getString(payload.subjectType);

  const primary =
    getString(payload.studio) ??
    getString(payload.productionCompany) ??
    getString(payload.publisher) ??
    getString(payload.developer) ??
    getString(payload.developers) ??
    getString(payload.author) ??
    getString(payload.authors);

  const secondary =
    getString(payload.genre) ??
    getString(payload.genres) ??
    getString(payload.category);

  if (primary && secondary) {
    return `${primary} • ${secondary}`;
  }

  if (primary) {
    return primary;
  }

  if (secondary) {
    return secondary;
  }

  if (subjectType === "game") {
    return fallback;
  }

  if (subjectType === "movie") {
    return fallback;
  }

  if (subjectType === "book") {
    return fallback;
  }

  return fallback;
}

function getString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return items.length > 0 ? items.join(", ") : undefined;
  }

  return undefined;
}

function getFallbackType(
  type: FeedActivityType | null,
): "movie" | "tv" | "game" | "book" | "other" {
  if (type == null) {
    return "other";
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
    case FeedActivityType.EpisodesWatchedBatch:
    case FeedActivityType.SeasonCompleted:
    case FeedActivityType.ShowCompleted:
      return "tv";
    case FeedActivityType.MovieWatched:
    case FeedActivityType.MediaRated:
    case FeedActivityType.MediaReviewAdded:
      return "movie";
    case FeedActivityType.GameStarted:
    case FeedActivityType.GameCompleted:
    case FeedActivityType.GameRated:
    case FeedActivityType.GameReviewAdded:
      return "game";
    case FeedActivityType.BookStarted:
    case FeedActivityType.BookFinished:
    case FeedActivityType.BookRated:
    case FeedActivityType.BookReviewAdded:
      return "book";
    default:
      return "other";
  }
}

function getNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function getEpisodeCount(payload: Record<string, unknown>): number {
  const episodeNumbers = payload.episodeNumbers;
  return Array.isArray(episodeNumbers) ? episodeNumbers.length : 0;
}
