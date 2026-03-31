import api from "@/lib/api";
import type {
  TmdbContentDto,
  AddToLibraryDto,
  TmdbSeasonDetailDto,
  WatchStatus,
  LibraryResponse,
  MarkSeasonWatchedDto,
  UpdateEntertainmentStatusDto,
} from "@/features/entertainment/types";

export const mediaService = {
  // Series Search
  searchTv: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/tv/search?query=${query}&language=${language}`,
    );
    return response.data;
  },

  // Movie Search
  searchMovie: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/movies/search?query=${query}&language=${language}`,
    );
    return response.data;
  },

  // Trend Series
  getTrendingTv: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/tv/trending?language=${language}`,
    );
    return response.data;
  },

  // Trend Movies
  getTrendingMovie: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/movies/trending?language=${language}`,
    );
    return response.data;
  },

  // Tv show detail by ID
  getTvDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get<any>(`/media/tv/${id}?language=${language}`);
    return response.data;
  },

  // Movie detail by ID
  getMovieDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto>(
      `/media/movies/${id}?language=${language}`,
    );
    return response.data;
  },

  // Track item
  trackItem: async (data: AddToLibraryDto & { status: WatchStatus }) => {
    const response = await api.post("/media", data);
    return response.data;
  },

  getTvSeasonDetail: async (
    id: number,
    seasonNumber: number,
    language: string = "en-US",
  ) => {
    const response = await api.get<TmdbSeasonDetailDto>(
      `/media/tv/${id}/seasons/${seasonNumber}?language=${language}`,
    );
    return response.data;
  },

  // Episode toggle (watched/unwatched)
  toggleEpisode: async (
    tmdbShowId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) => {
    const response = await api.post("/media/episodes/toggle", {
      tmdbShowId,
      seasonNumber,
      episodeNumber,
    });
    return response.data;
  },

  // Mark season as watched
  markSeasonWatched: async (data: MarkSeasonWatchedDto) => {
    const response = await api.post("/media/episodes/mark-season", data);
    return response.data;
  },

  // Watch next episode
  watchNextEpisode: async (tmdbShowId: number) => {
    const response = await api.post("/media/episodes/watch-next", {
      tmdbShowId,
    });
    return response.data;
  },

  // Update watch status
  updateStatus: async (
    tmdbId: number,
    type: "tv" | "movie",
    status: WatchStatus,
  ) => {
    const response = await api.put("/media/status", {
      tmdbId,
      type,
      status,
    });
    return response.data;
  },

  // Get user's library
  getLibrary: async () => {
    const response = await api.get<LibraryResponse>("/media/library");
    return response.data;
  },

  // Remove item from library
  removeFromLibrary: async (tmdbId: number, type: "tv" | "movie") => {
    const response = await api.delete(`/media/${type}/${tmdbId}`);
    return response.data;
  },

  // Rate item
  rateItem: async (tmdbId: number, type: "tv" | "movie", rating: number) => {
    const response = await api.put("/media/rating", {
      tmdbId,
      type,
      rating,
    });
    return response.data;
  },

  // Add review
  addReview: async (tmdbId: number, type: "tv" | "movie", review: string) => {
    const response = await api.put("/media/review", {
      tmdbId,
      type,
      review,
    });
    return response.data;
  },

  // Update progress (status, rating, review combined)
  updateProgress: async (data: UpdateEntertainmentStatusDto) => {
    const response = await api.put("/media/progress", data);
    return response.data;
  },
};
