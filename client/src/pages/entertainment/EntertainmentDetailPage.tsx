import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WatchStatus } from "../../features/entertainment/types";
import { useWatchStatusConfig } from "../../features/entertainment/hooks/useWatchStatusConfig";
import { usePlayStatusConfig } from "../../features/entertainment/hooks/usePlayStatusConfig";
import { useEntertainmentDetail } from "../../features/entertainment/hooks/useEntertainmentDetail";
import { useTvProgress } from "../../features/entertainment/hooks/useTvProgress";
import {
  EntertainmentHeader,
  EntertainmentGraph,
  EntertainmentReview,
  EntertainmentSeasons,
} from "@/features/entertainment/components/detail";

export default function EntertainmentDetailPage() {
  const { type, id } = useParams();
  const { t } = useTranslation(["common", "entertainment"]);

  // Configs
  const {
    STATUS_CONFIG: WATCH_STATUS_CONFIG,
    STATUS_OPTIONS: WATCH_STATUS_OPTIONS,
  } = useWatchStatusConfig(type as "tv" | "movie");
  const {
    STATUS_CONFIG: PLAY_STATUS_CONFIG,
    STATUS_OPTIONS: PLAY_STATUS_OPTIONS,
  } = usePlayStatusConfig();

  const STATUS_CONFIG =
    type === "game" ? PLAY_STATUS_CONFIG : WATCH_STATUS_CONFIG;
  const STATUS_OPTIONS =
    type === "game" ? PLAY_STATUS_OPTIONS : WATCH_STATUS_OPTIONS;

  // Hooks
  const {
    data,
    loading,
    handleRate,
    handleStatusChange,
    handleRemoveFromLibrary,
    handleSaveReview,
  } = useEntertainmentDetail(type, id);

  const {
    seasonEpisodes,
    loadingSeason,
    selectedSeason,
    handleSeasonClick,
    viewMode,
    handleDisplayModeChange,
    allSeasonsEpisodes,
    setAllSeasonsEpisodes,
    loadingAllSeasons,
    handleToggleEpisode,
    handleMarkSeasonWatched,
  } = useTvProgress(Number(id), data?.seasons);

  // Local state for review text form
  const [reviewText, setReviewText] = useState("");

  // Sync review text when data loads
  useEffect(() => {
    if (data?.user_review) {
      setReviewText(data.user_review);
    }
  }, [data?.user_review]);

  // Special Effect for TV Shows: Load first season initially
  useEffect(() => {
    if (
      type === "tv" &&
      data?.seasons?.length > 0 &&
      seasonEpisodes.length === 0 &&
      !loadingSeason
    ) {
      const firstSeason =
        data.seasons.find((s: any) => s.season_number === 1) || data.seasons[0];
      if (firstSeason) {
        handleSeasonClick(firstSeason.season_number);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.seasons, type]);

  const onStatusChangeWrapper = async (newStatus: number) => {
    const success = await handleStatusChange(newStatus as WatchStatus);
    if (success && type === "tv" && newStatus === WatchStatus.Completed) {
      setAllSeasonsEpisodes({});
      // Re-fetch current season to update checks
      await handleSeasonClick(selectedSeason, { forceReload: true });
    }
  };

  const onRemoveWrapper = async () => {
    const success = await handleRemoveFromLibrary();
    if (success && type === "tv") {
      setAllSeasonsEpisodes({});
      // Re-fetch current season
      await handleSeasonClick(selectedSeason, { forceReload: true });
    }
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20">{t("common:loading")}</div>
    );
  if (!data) return null;

  const bgImage = data.poster_path
    ? data.poster_path.startsWith("http")
      ? data.poster_path
      : `https://image.tmdb.org/t/p/original${data.poster_path}`
    : null;

  const currentStatusConfig = STATUS_CONFIG[data.user_status] ?? {
    label: t("entertainment:status.add_to_library"),
    button: "bg-skin-primary hover:bg-skin-primary/90 text-skin-base",
  };

  return (
    <div className="text-skin-text pb-20">
      {bgImage && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-6xl mx-auto bg-skin-surface/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-skin-border mt-6">
        <EntertainmentHeader
          data={data}
          type={type as string}
          statusConfig={currentStatusConfig}
          statusOptions={STATUS_OPTIONS}
          allStatusConfigs={STATUS_CONFIG}
          onStatusChange={onStatusChangeWrapper}
          onRate={handleRate}
          onRemove={onRemoveWrapper}
        >
          <EntertainmentReview
            reviewText={reviewText}
            originalReview={data.user_review}
            onSave={() => handleSaveReview(reviewText)}
            onChange={setReviewText}
          />
        </EntertainmentHeader>

        {/* Seasons & Episodes Section */}
        {type === "tv" && data.seasons && Array.isArray(data.seasons) && (
          <div className="mt-12 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
              <h3 className="text-2xl font-bold text-skin-primary">
                {t("entertainment:detail.seasons_and_episodes")}
              </h3>

              {/* View Toggle Buttons */}
              <div className="bg-skin-surface border border-skin-border rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => handleDisplayModeChange("list")}
                  title={t("common:buttons.list_view")}
                  className={`p-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
                    viewMode === "list"
                      ? "bg-skin-primary text-skin-base shadow-md"
                      : "text-skin-muted hover:text-skin-text hover:bg-skin-base/50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                <button
                  onClick={() => handleDisplayModeChange("graph")}
                  title={t("common:buttons.grid_view")}
                  className={`p-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
                    viewMode === "graph"
                      ? "bg-skin-primary text-skin-base shadow-md"
                      : "text-skin-muted hover:text-skin-text hover:bg-skin-base/50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
              </div>
            </div>

            {viewMode === "list" && (
              <EntertainmentSeasons
                seasons={data.seasons}
                selectedSeason={selectedSeason}
                loadingSeason={loadingSeason}
                seasonEpisodes={seasonEpisodes}
                onSeasonSelect={handleSeasonClick}
                onToggleEpisode={(ep) =>
                  handleToggleEpisode(selectedSeason, ep)
                } // Pass seasonNum
                onMarkSeasonWatched={handleMarkSeasonWatched}
              />
            )}

            {viewMode === "graph" && (
              <EntertainmentGraph
                seasons={data.seasons}
                allSeasonsEpisodes={allSeasonsEpisodes}
                loadingAllSeasons={loadingAllSeasons}
                onToggleGraphEpisode={handleToggleEpisode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
