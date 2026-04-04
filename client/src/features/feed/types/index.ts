export const FeedActivityType = {
  LibraryItemAdded: 1,
  EpisodeWatched: 10,
  EpisodesWatchedBatch: 11,
  SeasonCompleted: 12,
  ShowCompleted: 13,
  MovieWatched: 14,
  MediaRated: 20,
  MediaReviewAdded: 21,
  GameStarted: 30,
  GameCompleted: 31,
  GameRated: 32,
  GameReviewAdded: 33,
  BookStarted: 40,
  BookFinished: 41,
  BookRated: 42,
  BookReviewAdded: 43,
} as const;

export const FeedPostType = {
  Standard: 1,
  Activity: 2,
  Reply: 3,
  Quote: 4,
} as const;

export type FeedActivityType =
  (typeof FeedActivityType)[keyof typeof FeedActivityType];
export type FeedPostType = (typeof FeedPostType)[keyof typeof FeedPostType];

export interface FeedActorDto {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface FeedActivityDto {
  id: string;
  actor: FeedActorDto;
  type: FeedActivityType;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface FeedAttachmentDto {
  id: string;
  type: number;
  url: string;
  thumbnailUrl?: string | null;
  sortOrder: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface FeedStatsDto {
  replyCount: number;
  likeCount: number;
  viewCount: number;
}

export interface FeedItemDto {
  id: string;
  actor: FeedActorDto;
  type: FeedPostType;
  publishedAt: string;
  updatedAt?: string | null;
  textContent?: string | null;
  parentPostId?: string | null;
  quotedPostId?: string | null;
  activity?: FeedActivityDto | null;
  attachments: FeedAttachmentDto[];
  stats: FeedStatsDto;
}

export interface FeedResponseDto {
  items: FeedItemDto[];
  nextCursor: string | null;
}
