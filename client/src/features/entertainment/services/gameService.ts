import api from "../../../lib/api";
import type {
  GameContentDto,
  TrackGameDto,
  PlayStatus,
  UpdateGameProgressDto,
} from "../types";

export const gamesService = {
  // Search
  searchGames: async (query: string) => {
    // Backend URL: /api/entertainment/game/search
    const response = await api.get<GameContentDto[]>(
      `/Entertainment/Game/search?query=${query}`
    );
    return response.data;
  },

  // Trending
  getTrendingGames: async () => {
    const response = await api.get<GameContentDto[]>(
      "/Entertainment/Game/trending"
    );
    return response.data;
  },

  // Detail
  getGameDetail: async (id: number) => {
    const response = await api.get<GameContentDto>(`/Entertainment/Game/${id}`);
    return response.data;
  },

  // Library
  getLibrary: async () => {
    const response = await api.get<GameContentDto[]>(
      "/Entertainment/Game/library"
    );
    return response.data;
  },

  // Track
  trackGame: async (data: TrackGameDto) => {
    const response = await api.post("/Entertainment/Game/track", data);
    return response.data;
  },

  // Update Status
  updateStatus: async (igdbId: number, status: PlayStatus) => {
    const response = await api.put("/Entertainment/Game/status", {
      igdbId,
      status,
    });
    return response.data;
  },

  // Rate
  rateGame: async (igdbId: number, rating: number) => {
    const response = await api.put("/Entertainment/Game/rating", {
      igdbId,
      rating,
    });
    return response.data;
  },

  // Review
  addReview: async (igdbId: number, review: string) => {
    const response = await api.put("/Entertainment/Game/review", {
      igdbId,
      review,
    });
    return response.data;
  },

  // Update Progress
  updateProgress: async (data: UpdateGameProgressDto) => {
    const response = await api.put("/Entertainment/Game/progress", data);
    return response.data;
  },

  // Remove
  removeGame: async (id: number) => {
    const response = await api.delete(`/Entertainment/Game/remove/${id}`);
    return response.data;
  },
};
