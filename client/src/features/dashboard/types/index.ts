export interface DashboardStatsDto {
  totalMovies: number;
  totalEpisodes: number;
  totalBooks: number;
  totalGames: number;
  currentStreak: number;
}

export interface DashboardItemDto {
  id: string;
  type: "tv" | "movie" | "book" | "game";
  title: string;
  imageUrl?: string;
  season?: number;
  episode?: number;
  currentValue?: number;
  maxValue?: number;
  progressPercent?: number;
  userStatus: number;
  lastUpdated: string;
  routePath: string;
}

export interface DashboardSummaryDto {
  continueWatching: DashboardItemDto[];
  continueReading: DashboardItemDto[];
  continuePlaying: DashboardItemDto[];
  stats: DashboardStatsDto;
}
