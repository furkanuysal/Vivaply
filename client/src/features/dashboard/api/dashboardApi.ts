import api from "@/shared/lib/api";
import type { DashboardSummaryDto } from "@/features/dashboard/types";

export const dashboardApi = {
  getDashboard: async () => {
    const response = await api.get<DashboardSummaryDto>("/dashboard");
    return response.data;
  },
};
