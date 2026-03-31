import api from "@/lib/api";
import type {
  GameContentDto,
  TrackGameDto,
  PlayStatus,
  UpdateGameProgressDto,
} from "@/features/entertainment/types";

export const gamesService = {
  // Search
  searchGames: async (query: string) => {
    // Backend URL: /api/discovery/games/search
    const response = await api.get<GameContentDto[]>(
      `/discovery/games/search?query=${query}`,
    );
    return response.data;
  },

  // Trending
  getTrendingGames: async () => {
    const response = await api.get<GameContentDto[]>(
      "/discovery/games/trending",
    );
    return response.data;
  },

  // Detail
  getGameDetail: async (id: number) => {
    const response = await api.get<GameContentDto>(`/games/${id}`);
    return response.data;
  },

  // Library
  getLibrary: async () => {
    const response = await api.get<GameContentDto[]>("/games/library");
    return response.data;
  },

  // Track
  trackGame: async (data: TrackGameDto) => {
    const response = await api.post("/games", data);
    return response.data;
  },

  // Update Status
  updateStatus: async (igdbId: number, status: PlayStatus) => {
    const response = await api.put("/games/status", {
      igdbId,
      status,
    });
    return response.data;
  },

  // Rate
  rateGame: async (igdbId: number, rating: number) => {
    const response = await api.put("/games/rating", {
      igdbId,
      rating,
    });
    return response.data;
  },

  // Review
  addReview: async (igdbId: number, review: string) => {
    const response = await api.put("/games/review", {
      igdbId,
      review,
    });
    return response.data;
  },

  // Update Progress
  updateProgress: async (data: UpdateGameProgressDto) => {
    const response = await api.put("/games/progress", data);
    return response.data;
  },

  // Remove
  removeGame: async (id: number) => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};
