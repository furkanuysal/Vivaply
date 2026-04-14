import api from "@/shared/lib/api";
import type {
  GameContentDto,
  PlayStatus,
  TrackGameDto,
  UpdateGameProgressDto,
} from "@/features/entertainment/types";

export const gamesApi = {
  searchGames: async (query: string) => {
    const response = await api.get<GameContentDto[]>(
      `/discovery/games/search?query=${query}`,
    );
    return response.data;
  },

  getTrendingGames: async () => {
    const response = await api.get<GameContentDto[]>(
      "/discovery/games/trending",
    );
    return response.data;
  },

  getGameDetail: async (id: number) => {
    const response = await api.get<GameContentDto>(`/games/${id}`);
    return response.data;
  },

  getLibrary: async () => {
    const response = await api.get<GameContentDto[]>("/games/library");
    return response.data;
  },

  trackGame: async (data: TrackGameDto) => {
    const response = await api.post("/games", data);
    return response.data;
  },

  updateStatus: async (igdbId: number, status: PlayStatus) => {
    const response = await api.put("/games/status", {
      igdbId,
      status,
    });
    return response.data;
  },

  rateGame: async (igdbId: number, rating: number) => {
    const response = await api.put("/games/rating", {
      igdbId,
      rating,
    });
    return response.data;
  },

  addReview: async (igdbId: number, review: string) => {
    const response = await api.put("/games/review", {
      igdbId,
      review,
    });
    return response.data;
  },

  updateProgress: async (data: UpdateGameProgressDto) => {
    const response = await api.put("/games/progress", data);
    return response.data;
  },

  removeGame: async (id: number) => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};
