import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { gamesApi } from "@/features/entertainment/api/gamesApi";
import { mediaApi } from "@/features/entertainment/api/mediaApi";
import { WatchStatus, PlayStatus } from "@/features/entertainment/types";

export function useEntertainmentDetail(
  type: string | undefined,
  id: string | undefined
) {
  const { t } = useTranslation(["common", "entertainment"]);
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const loadDetail = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        let result;
        if (type === "tv") {
          result = await mediaApi.getTvDetail(Number(id));
        } else if (type === "movie") {
          result = await mediaApi.getMovieDetail(Number(id));
        } else {
          const gameResult = await gamesApi.getGameDetail(Number(id));
          result = {
            ...gameResult,
            user_status: gameResult.userStatus,
            user_rating: gameResult.userRating,
            user_review: gameResult.userReview,
            display_name: gameResult.title,
            poster_path: gameResult.coverUrl,
            display_date: gameResult.releaseDate,
            vote_average: gameResult.voteAverage,
            viva_rating: gameResult.vivaRating,
            viva_rating_count: gameResult.vivaRatingCount,
          };
        }
        setData(result);
      } catch (error) {
        toast.error(t("common:messages.content_not_found"));
        navigate("/entertainment");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [type, id, navigate, t]);

  // Actions
  const handleRate = async (rating: number) => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesApi.rateGame(data.id, rating);
      } else {
        await mediaApi.rateItem(data.id, type as "tv" | "movie", rating);
      }
      if (rating > 0) {
        toast.success(t("common:messages.rate_success", { rating }));
      } else {
        toast.success(t("common:messages.save_success"));
      }

      // Update UI
      setData((prev: any) => ({
        ...prev,
        user_rating: rating > 0 ? rating : undefined,
      }));

      // If not added yet, automatically added
      if (rating > 0 && !data.user_status) {
        const newStatus =
          type === "tv" ? WatchStatus.Watching : WatchStatus.Completed;
        setData((prev: any) => ({
          ...prev,
          user_rating: rating,
          user_status: newStatus,
        }));
      }
    } catch (error: any) {
      toast.error(t("common:messages.rate_error"));
    }
  };

  const handleStatusChange = async (newStatus: WatchStatus | PlayStatus) => {
    if (!data) return;
    if (data.user_status === newStatus) return;

    try {
      if (!data.user_status) {
        if (type === "game") {
          await gamesApi.trackGame({
            igdbId: data.id,
            title: data.title,
            coverUrl: data.coverUrl,
            releaseDate: data.releaseDate,
            status: newStatus as PlayStatus,
          });
        } else {
          const statusToTrack =
            newStatus === WatchStatus.Completed
              ? WatchStatus.PlanToWatch
              : newStatus;

          await mediaApi.trackItem({
            tmdbId: data.id,
            type: type as "tv" | "movie",
            title: data.display_name,
            posterPath: data.poster_path,
            date: data.display_date,
            status: statusToTrack as WatchStatus,
          });

          if (newStatus === WatchStatus.Completed) {
            await mediaApi.updateStatus(
              data.id,
              type as "tv" | "movie",
              WatchStatus.Completed
            );
          }
        }
        toast.success(t("common:messages.track_success"));
      } else {
        if (type === "game") {
          await gamesApi.updateStatus(data.id, newStatus as PlayStatus);
        } else {
          await mediaApi.updateStatus(
            data.id,
            type as "tv" | "movie",
            newStatus as WatchStatus
          );
        }
        toast.info(t("common:messages.status_update_success"));
      }

      setData((prev: any) => ({ ...prev, user_status: newStatus }));
      return true; // Success signal
    } catch (error: any) {
      const errorMsg =
        typeof error.response?.data === "string"
          ? error.response.data
          : t("common:messages.content_update_error");

      console.error("Update Error:", error);
      toast.error(errorMsg);
      return false;
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesApi.removeGame(data.id);
      } else {
        await mediaApi.removeFromLibrary(data.id, type as "tv" | "movie");
      }
      toast.info(t("common:messages.remove_from_library_success"));
      setData((prev: any) => ({ ...prev, user_status: undefined }));
      return true;
    } catch (error: any) {
      toast.error(t("common:messages.remove_error"));
      return false;
    }
  };

  const handleSaveReview = async (reviewText: string) => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesApi.addReview(data.id, reviewText);
      } else {
        await mediaApi.addReview(
          data.id,
          type as "tv" | "movie",
          reviewText
        );
      }
      toast.success(t("common:messages.review_success"));
      setData((prev: any) => ({ ...prev, user_review: reviewText }));
    } catch (error: any) {
      toast.error(t("common:messages.review_error"));
    }
  };

  return {
    data,
    loading,
    handleRate,
    handleStatusChange,
    handleRemoveFromLibrary,
    handleSaveReview,
  };
}
