import api from "@/shared/lib/api";
import type { TmdbContentDto } from "@/features/entertainment/types";

export interface RecommendationResponse {
  tv: TmdbContentDto[];
  movies: TmdbContentDto[];
}

export const recommendationApi = {
  getRecommendations: async (language: string = "en-US") => {
    const response = await api.get<RecommendationResponse>("/recommendations", {
      params: { language },
    });
    return response.data;
  },
};
