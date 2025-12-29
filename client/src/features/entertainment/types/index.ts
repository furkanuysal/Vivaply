export interface TmdbContentDto {
  id: number;
  name?: string;
  title?: string;
  display_name: string;
  poster_path?: string;
  overview?: string;
  status?: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  display_date: string;
  user_status: WatchStatus;
  user_rating?: number;
  user_review?: string;
  tagline?: string;
  last_watched_season?: number;
  last_watched_episode?: number;
  last_watched_at?: string;
  latest_episode?: string;
}

export interface AddToLibraryDto {
  tmdbId: number;
  type: "tv" | "movie";
  title: string;
  posterPath?: string;
  date?: string;
}

// Episode details
export interface TmdbEpisodeDto {
  id: number;
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string;
  vote_average: number;
  air_date?: string;
  is_watched: boolean;
}

// Season details with episodes
export interface TmdbSeasonDetailDto {
  _id: string;
  season_number: number;
  episodes: TmdbEpisodeDto[];
}

export const WatchStatus = {
  None: 0,
  PlanToWatch: 1,
  Watching: 2,
  Completed: 3,
  OnHold: 4,
  Dropped: 5,
} as const;
export type WatchStatus = (typeof WatchStatus)[keyof typeof WatchStatus];

export interface LibraryResponse {
  tv: TmdbContentDto[];
  movie: TmdbContentDto[];
}

export interface MarkSeasonWatchedDto {
  tmdbShowId: number;
  seasonNumber: number;
}

// GAMES

// Play Status
export const PlayStatus = {
  None: 0,
  PlanToPlay: 1,
  Playing: 2,
  Completed: 3,
  OnHold: 4,
  Dropped: 5,
} as const;
export type PlayStatus = (typeof PlayStatus)[keyof typeof PlayStatus];

// Game Completion Type
export const GameCompletionType = {
  None: 0,
  MainStory: 1, // Main Story
  MainPlusExtras: 2, // Main + Extras
  Completionist: 3, // %100 / Platinum
  Speedrun: 4, // Speedrun
} as const;
export type GameCompletionType =
  (typeof GameCompletionType)[keyof typeof GameCompletionType];

// Game Content
export interface GameContentDto {
  id: number; // IGDB ID
  title: string;
  coverUrl?: string;
  summary?: string;
  voteAverage: number;
  releaseDate?: string;
  platforms: string;
  developers: string;
  genres: string;

  // User Fields
  userStatus: PlayStatus;
  userPlatform?: string;
  completionType?: GameCompletionType;
  userPlaytime?: number;
  userRating?: number;
  userReview?: string;
}

// Track Game
export interface TrackGameDto {
  igdbId: number;
  title: string;
  coverUrl?: string;
  releaseDate?: string;
  status: PlayStatus;
  userPlatform?: string;
}

export interface UpdateGameProgressDto {
  igdbId: number;
  userPlaytime: number;
  completionType: GameCompletionType;
  userPlatform?: string;
  userRating?: number;
}

export interface UpdateEntertainmentStatusDto {
  tmdbId: number;
  type: "tv" | "movie";
  status: WatchStatus;
  rating?: number;
  review?: string;
}
