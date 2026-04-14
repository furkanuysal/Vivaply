import api from "@/shared/lib/api";
import type {
  AddToLibraryDto,
  LibraryResponse,
  MarkSeasonWatchedDto,
  TmdbContentDto,
  TmdbSeasonDetailDto,
  UpdateEntertainmentStatusDto,
  WatchStatus,
} from "@/features/entertainment/types";

export const mediaApi = {
  searchTv: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/tv/search?query=${query}&language=${language}`,
    );
    return response.data;
  },

  searchMovie: async (query: string, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/movies/search?query=${query}&language=${language}`,
    );
    return response.data;
  },

  getTrendingTv: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/tv/trending?language=${language}`,
    );
    return response.data;
  },

  getTrendingMovie: async (language: string = "en-US") => {
    const response = await api.get<TmdbContentDto[]>(
      `/discovery/movies/trending?language=${language}`,
    );
    return response.data;
  },

  getTvDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get(`/media/tv/${id}?language=${language}`);
    return response.data;
  },

  getMovieDetail: async (id: number, language: string = "en-US") => {
    const response = await api.get<TmdbContentDto>(
      `/media/movies/${id}?language=${language}`,
    );
    return response.data;
  },

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

  markSeasonWatched: async (data: MarkSeasonWatchedDto) => {
    const response = await api.post("/media/episodes/mark-season", data);
    return response.data;
  },

  watchNextEpisode: async (tmdbShowId: number) => {
    const response = await api.post("/media/episodes/watch-next", {
      tmdbShowId,
    });
    return response.data;
  },

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

  getLibrary: async () => {
    const response = await api.get<LibraryResponse>("/media/library");
    return response.data;
  },

  removeFromLibrary: async (tmdbId: number, type: "tv" | "movie") => {
    const response = await api.delete(`/media/${type}/${tmdbId}`);
    return response.data;
  },

  rateItem: async (tmdbId: number, type: "tv" | "movie", rating: number) => {
    const response = await api.put("/media/rating", {
      tmdbId,
      type,
      rating,
    });
    return response.data;
  },

  addReview: async (tmdbId: number, type: "tv" | "movie", review: string) => {
    const response = await api.put("/media/review", {
      tmdbId,
      type,
      review,
    });
    return response.data;
  },

  updateProgress: async (data: UpdateEntertainmentStatusDto) => {
    const response = await api.put("/media/progress", data);
    return response.data;
  },
};
