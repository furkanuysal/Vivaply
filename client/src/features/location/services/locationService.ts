import api from "@/lib/api";
import type { LocationDto } from "@/features/location/types";

export const locationService = {
  search: async (query: string) => {
    const response = await api.get<LocationDto[]>(
      `/Location/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },
};
