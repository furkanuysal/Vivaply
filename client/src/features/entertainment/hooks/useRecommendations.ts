import { useQuery } from "@tanstack/react-query";
import { recommendationApi } from "@/features/entertainment/api/recommendationApi";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";

export const useRecommendations = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendations", user?.id, i18n.language],
    queryFn: () => recommendationApi.getRecommendations(i18n.language),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
};
