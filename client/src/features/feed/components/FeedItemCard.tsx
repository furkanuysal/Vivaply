import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
import { FeedActivityType, type FeedItemDto } from "@/features/feed/types";

interface FeedItemCardProps {
  item: FeedItemDto;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { t, i18n } = useTranslation("feed");
  const avatarUrl = getActorAvatarUrl(item.actor.avatarUrl);
  const imageUrl = getFeedImageUrl(item);
  const title = getFeedTitle(item);
  const description = getFeedDescription(item, t);
  const reviewSnippet = getReviewSnippet(item);
  const targetPath = getFeedTargetPath(item);
  const activityType = getFeedActivityType(item);
  const hasActivity = isActivityPost(item);
  const contentClassName =
    "block rounded-2xl transition hover:text-skin-primary focus:outline-none focus:ring-2 focus:ring-skin-primary/40";

  return (
    <article className="rounded-3xl border border-skin-border/50 bg-skin-surface/90 p-5 shadow-sm backdrop-blur-sm transition hover:border-skin-primary/30 hover:shadow-lg hover:shadow-skin-primary/10">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-skin-base">
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
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold text-skin-text">
              {item.actor.username}
            </span>
            <span className="text-xs uppercase tracking-[0.24em] text-skin-muted/80">
              {getActivityLabel(activityType, hasActivity, t)}
            </span>
            <span className="text-xs text-skin-muted">
              {getRelativeTime(getFeedTimestamp(item), i18n.resolvedLanguage)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-skin-text/90">
            {renderDescription(description, title, targetPath)}
          </p>

          {reviewSnippet ? (
            <blockquote className="mt-4 rounded-2xl border border-skin-border/50 bg-skin-base/70 px-4 py-3 text-sm italic text-skin-muted">
              "{reviewSnippet}"
            </blockquote>
          ) : null}

          {targetPath ? (
            <Link
              to={targetPath}
              className={`${contentClassName} mt-4 flex items-center gap-4 rounded-2xl bg-skin-base/60 p-3`}
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-skin-border/40 bg-skin-surface">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UniversalCoverFallback
                    title={title}
                    type={getFallbackType(activityType)}
                    variant="compact"
                  />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-skin-text">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-skin-muted">
                  {getSecondaryMeta(item, t)}
                </p>
              </div>
            </Link>
          ) : (
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-skin-base/60 p-3">
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-skin-border/40 bg-skin-surface">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UniversalCoverFallback
                    title={title}
                    type={getFallbackType(activityType)}
                    variant="compact"
                  />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-skin-text">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-skin-muted">
                  {getSecondaryMeta(item, t)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
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
      >
        {title}
      </Link>
      {after}
    </>
  );
}

function getActivityLabel(
  type: FeedActivityType | null,
  hasActivity: boolean,
  t: ReturnType<typeof useTranslation<"feed">>["t"],
): string {
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
