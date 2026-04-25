import api from "@/shared/lib/api";
import type { SearchResponseDto } from "@/features/search/types";

export const searchApi = {
  async search(query: string, take = 10): Promise<SearchResponseDto> {
    const response = await api.get<SearchResponseDto>("/search", {
      params: { q: query, take },
    });

    return response.data;
  },
};
