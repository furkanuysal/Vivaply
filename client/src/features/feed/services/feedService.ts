import api, { SERVER_URL } from "@/lib/api";
import type { TFunction } from "i18next";
import {
  FeedActivityType,
  FeedPostType,
  type FeedItemDto,
  type FeedResponseDto,
} from "@/features/feed/types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export const feedService = {
  async getFeed(cursor?: string | null): Promise<FeedResponseDto> {
    const response = await api.get<FeedResponseDto>("/feed", {
      params: cursor ? { cursor } : undefined,
    });

    return response.data;
  },

  async getProfileFeed(
    username: string,
    cursor?: string | null,
  ): Promise<FeedResponseDto> {
    const response = await api.get<FeedResponseDto>(`/users/${username}/posts`, {
      params: cursor ? { cursor } : undefined,
    });

    return response.data;
  },

  async getPostById(postId: string): Promise<FeedItemDto> {
    const response = await api.get<FeedItemDto>(`/posts/${postId}`);
    return response.data;
  },

  async replyToPost(postId: string, textContent: string): Promise<FeedItemDto> {
    const response = await api.post<FeedItemDto>(`/posts/${postId}/reply`, {
      textContent,
    });

    return response.data;
  },
};

export function getActorAvatarUrl(path?: string): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/uploads/")) return null;
  return `${SERVER_URL}${path}`;
}

export function getFeedImageUrl(item: FeedItemDto): string | null {
  const payload = item.activity?.payload;
  if (!payload) {
    return null;
  }
  const posterPath = getString(payload.posterPath);
  const imageUrl = getString(payload.imageUrl);

  if (posterPath) {
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  }

  if (imageUrl) {
    return resolveImageUrl(imageUrl);
  }

  return null;
}

export function getFeedTitle(item: FeedItemDto): string {
  const payload = item.activity?.payload;

  if (!payload) {
    return item.textContent?.trim() || "Untitled post";
  }

  return getString(payload.showName) ?? getString(payload.title) ?? "Unknown item";
}

export function getFeedDescription(
  item: FeedItemDto,
  t: TFunction<"feed">,
): string {
  const username = item.actor.username || "Someone";
  const title = getFeedTitle(item);
  const activity = item.activity;

  if (!activity) {
    return item.textContent?.trim() || t("activity.fallback", { username });
  }

  const payload = activity.payload;

  switch (activity.type) {
    case FeedActivityType.LibraryItemAdded:
      return t("activity.library_item_added", { username, title });
    case FeedActivityType.EpisodeWatched:
      return t("activity.episode_watched", {
        username,
        title,
        season: getNumber(payload.seasonNumber),
        episode: getNumber(payload.episodeNumber),
      });
    case FeedActivityType.EpisodesWatchedBatch:
      return t("activity.episodes_watched_batch", {
        username,
        title,
        count: getEpisodeCount(payload),
      });
    case FeedActivityType.SeasonCompleted:
      return t("activity.season_completed", {
        username,
        title,
        season: getNumber(payload.seasonNumber),
      });
    case FeedActivityType.ShowCompleted:
      return t("activity.show_completed", { username, title });
    case FeedActivityType.MovieWatched:
      return t("activity.movie_watched", { username, title });
    case FeedActivityType.MediaRated:
    case FeedActivityType.GameRated:
    case FeedActivityType.BookRated:
      return t("activity.rated", {
        username,
        title,
        rating: formatRating(getNumber(payload.rating)),
      });
    case FeedActivityType.MediaReviewAdded:
    case FeedActivityType.GameReviewAdded:
    case FeedActivityType.BookReviewAdded:
      return t("activity.review_added", { username, title });
    case FeedActivityType.GameStarted:
      return t("activity.game_started", { username, title });
    case FeedActivityType.GameCompleted:
      return t("activity.game_completed", { username, title });
    case FeedActivityType.BookStarted:
      return t("activity.book_started", { username, title });
    case FeedActivityType.BookFinished:
      return t("activity.book_finished", { username, title });
    default:
      return t("activity.fallback", { username });
  }
}

export function getReviewSnippet(item: FeedItemDto): string | null {
  const payload = item.activity?.payload;
  return payload ? getString(payload.reviewSnippet) ?? null : null;
}

export function getFeedTargetPath(item: FeedItemDto): string | null {
  const payload = item.activity?.payload;
  if (!payload) {
    return null;
  }
  const subjectType = getString(payload.subjectType);
  const subjectId = getString(payload.subjectId);
  const tmdbShowId = getIdentifier(payload.tmdbShowId);

  if (tmdbShowId) {
    return `/entertainment/tv/${tmdbShowId}`;
  }

  if (!subjectType || !subjectId) {
    return null;
  }

  switch (subjectType) {
    case "tv_show":
      return `/entertainment/tv/${subjectId}`;
    case "movie":
      return `/entertainment/movie/${subjectId}`;
    case "game":
      return `/entertainment/game/${subjectId}`;
    case "book":
      return `/knowledge/book/${subjectId}`;
    default:
      return null;
  }
}

export function getRelativeTime(value: string, locale?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffDays = Math.abs(diffSeconds) / (60 * 60 * 24);

  if (diffDays > 7) {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return "just now";
}

export function getFeedTimestamp(item: FeedItemDto): string {
  return item.updatedAt || item.publishedAt;
}

export function getFeedActivityType(item: FeedItemDto): FeedActivityType | null {
  return item.activity?.type ?? null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function getIdentifier(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function getEpisodeCount(payload: Record<string, unknown>): number {
  const episodeNumbers = payload.episodeNumbers;
  return Array.isArray(episodeNumbers) ? episodeNumbers.length : 0;
}

function formatRating(rating: number): string {
  return rating > 0 ? `${rating}/10` : "-";
}

function resolveImageUrl(value: string): string {
  if (value.startsWith("http")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return `${SERVER_URL}${value}`;
  }

  if (value.startsWith("/")) {
    return `${TMDB_IMAGE_BASE}${value}`;
  }

  return value;
}

export function isActivityPost(item: FeedItemDto): boolean {
  return item.type === FeedPostType.Activity && !!item.activity;
}
