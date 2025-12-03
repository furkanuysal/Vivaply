import api from "../../../lib/api";
import type {
  TmdbContentDto,
  AddToLibraryDto,
  TmdbSeasonDetailDto,
  WatchStatus,
  LibraryResponse,
  MarkSeasonWatchedDto,
} from "../../entertainment/types";

export const entertainmentService = {
  // Dizi Arama
  searchTv: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/Entertainment/tv/search?query=${query}&language=${language}`
    );
    return response.data;
  },

  // Film Arama
  searchMovie: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/Entertainment/movie/search?query=${query}&language=${language}`
    );
    return response.data;
  },

  // Trend Diziler
  getTrendingTv: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/Entertainment/tv/trending?language=${language}`
    );
    return response.data;
  },

  // Trend Filmler
  getTrendingMovie: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/Entertainment/movie/trending?language=${language}`
    );
    return response.data;
  },

  // Tv show detail by ID
  getTvDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get<any>(
      `/Entertainment/tv/${id}?language=${language}`
    );
    return response.data;
  },

  // Movie detail by ID
  getMovieDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto>(
      `/Entertainment/movie/${id}?language=${language}`
    );
    return response.data;
  },

  // Track item
  trackItem: async (data: AddToLibraryDto & { status: WatchStatus }) => {
    const response = await api.post("/Entertainment/track", data);
    return response.data;
  },

  getTvSeasonDetail: async (
    id: number,
    seasonNumber: number,
    language: string = "en-US"
  ) => {
    const response = await api.get<TmdbSeasonDetailDto>(
      `/Entertainment/tv/${id}/season/${seasonNumber}?language=${language}`
    );
    return response.data;
  },

  // Episode toggle (watched/unwatched)
  toggleEpisode: async (
    tmdbShowId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    const response = await api.post("/Entertainment/episode/toggle", {
      tmdbShowId,
      seasonNumber,
      episodeNumber,
    });
    return response.data;
  },

  // Mark season as watched
  markSeasonWatched: async (data: MarkSeasonWatchedDto) => {
    const response = await api.post("/Entertainment/episode/mark-season", data);
    return response.data;
  },

  // Watch next episode
  watchNextEpisode: async (tmdbShowId: number) => {
    const response = await api.post("/Entertainment/episode/watch-next", {
      tmdbShowId,
    });
    return response.data;
  },

  // Update watch status
  updateStatus: async (
    tmdbId: number,
    type: "tv" | "movie",
    status: WatchStatus
  ) => {
    const response = await api.put("/Entertainment/status", {
      tmdbId,
      type,
      status,
    });
    return response.data;
  },

  // Get user's library
  getLibrary: async () => {
    const response = await api.get<LibraryResponse>("/Entertainment/library");
    return response.data;
  },

  // Remove item from library
  removeFromLibrary: async (tmdbId: number, type: "tv" | "movie") => {
    const response = await api.delete(
      `/Entertainment/remove?tmdbId=${tmdbId}&type=${type}`
    );
    return response.data;
  },

  // Rate item
  rateItem: async (tmdbId: number, type: "tv" | "movie", rating: number) => {
    const response = await api.put("/Entertainment/rating", {
      tmdbId,
      type,
      rating,
    });
    return response.data;
  },

  // Add review
  addReview: async (tmdbId: number, type: "tv" | "movie", review: string) => {
    const response = await api.put("/Entertainment/review", {
      tmdbId,
      type,
      review,
    });
    return response.data;
  },

  // Sync library
  syncLibrary: async () => {
    const response = await api.post("/Entertainment/library/sync");
    return response.data;
  },
};
