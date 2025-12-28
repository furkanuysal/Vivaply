import api from "../../../lib/api";
import type { DashboardSummaryDto } from "../types";

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get<DashboardSummaryDto>("/Dashboard");
    return response.data;
  },
};
