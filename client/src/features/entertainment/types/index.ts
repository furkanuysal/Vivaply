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
  last_watched?: string;
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
  PlanToWatch: 1, // Listemde / İzleyeceğim
  Watching: 2, // İzliyorum
  Completed: 3, // Bitirdim
  OnHold: 4, // Ara verdim
  Dropped: 5, // Bıraktım
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
