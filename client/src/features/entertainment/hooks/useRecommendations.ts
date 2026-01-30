import { useQuery } from "@tanstack/react-query";
import { recommendationService } from "@/features/entertainment/services/recommendationService";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";

export const useRecommendations = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendations", user?.id, i18n.language],
    queryFn: () => recommendationService.getRecommendations(i18n.language),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
};
