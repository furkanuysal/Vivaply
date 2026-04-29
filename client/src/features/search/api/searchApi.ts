import api from "@/shared/lib/api";
import type { SearchResponseDto } from "@/features/search/types";
import type { SearchUserDto } from "@/features/search/types";

export const searchApi = {
  async search(query: string, take = 10): Promise<SearchResponseDto> {
    const response = await api.get<SearchResponseDto>("/search", {
      params: { q: query, take },
    });

    return response.data;
  },

  async searchUsers(query: string, take = 5): Promise<SearchUserDto[]> {
    const response = await api.get<{
      items?: SearchUserDto[];
      users?: SearchUserDto[];
    }>("/search/users", {
      params: { q: query, take },
    });

    return response.data.items ?? response.data.users ?? [];
  },
};
