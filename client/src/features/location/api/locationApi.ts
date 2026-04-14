import api from "@/shared/lib/api";
import type { LocationDto } from "@/features/location/types";

export const locationApi = {
  search: async (query: string) => {
    const response = await api.get<LocationDto[]>(
      `/Location/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },
};
