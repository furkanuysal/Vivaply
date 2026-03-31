import { DashboardItemType } from "@/features/dashboard/types";

export const TYPE_LABEL: Record<
  DashboardItemType,
  "tv" | "movie" | "book" | "game"
> = {
  [DashboardItemType.Tv]: "tv",
  [DashboardItemType.Movie]: "movie",
  [DashboardItemType.Book]: "book",
  [DashboardItemType.Game]: "game",
};

export function getRoutePath(type: DashboardItemType, id: string): string {
  switch (type) {
    case DashboardItemType.Book:
      return `/knowledge/book/${id}`;
    case DashboardItemType.Tv:
      return `/entertainment/tv/${id}`;
    case DashboardItemType.Movie:
      return `/entertainment/movie/${id}`;
    case DashboardItemType.Game:
      return `/entertainment/game/${id}`;
  }
}
