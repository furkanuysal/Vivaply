export interface DashboardStatsDto {
  totalMovies: number;
  totalEpisodes: number;
  totalBooks: number;
  totalGames: number;
  currentStreak: number;
}

export interface DashboardItemDto {
  id: string;
  type: DashboardItemType;
  title: string;
  imageUrl?: string;
  season?: number;
  episode?: number;
  currentValue?: number;
  maxValue?: number;
  progressPercent?: number;
  userStatus: number;
  lastUpdated: string;
}

export interface DashboardSummaryDto {
  continueWatching: DashboardItemDto[];
  continueReading: DashboardItemDto[];
  continuePlaying: DashboardItemDto[];
  stats: DashboardStatsDto;
}

// Dashboard Item Type
export const DashboardItemType = {
  Tv: 0,
  Movie: 1,
  Book: 2,
  Game: 3,
} as const;
export type DashboardItemType =
  (typeof DashboardItemType)[keyof typeof DashboardItemType];
