import api from "@/lib/api";
import type { TmdbContentDto } from "@/features/entertainment/types";

export interface RecommendationResponse {
  tv: TmdbContentDto[];
  movies: TmdbContentDto[];
}

export const recommendationService = {
  getRecommendations: async (language: string = "en-US") => {
    const response = await api.get<RecommendationResponse>("/Recommendation", {
      params: { language },
    });
    return response.data;
  },
};
