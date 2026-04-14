import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WatchStatus } from "@/features/entertainment/types";
import { useWatchStatusConfig } from "@/features/entertainment/hooks/useWatchStatusConfig";
import { usePlayStatusConfig } from "@/features/entertainment/hooks/usePlayStatusConfig";
import { useEntertainmentDetail } from "@/features/entertainment/hooks/useEntertainmentDetail";
import { useTvProgress } from "@/features/entertainment/hooks/useTvProgress";
import {
  EntertainmentGraph,
  EntertainmentHeader,
  EntertainmentReview,
  EntertainmentSeasons,
} from "@/features/entertainment/components/detail";

export default function EntertainmentDetailPage() {
  const { type, id } = useParams();
  const { t } = useTranslation(["common", "entertainment"]);

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

  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (data?.user_review) {
      setReviewText(data.user_review);
    }
  }, [data?.user_review]);

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
  }, [data?.seasons, type]);

  const onStatusChangeWrapper = async (newStatus: number) => {
    const success = await handleStatusChange(newStatus as WatchStatus);
    if (success && type === "tv" && newStatus === WatchStatus.Completed) {
      setAllSeasonsEpisodes({});
      await handleSeasonClick(selectedSeason, { forceReload: true });
    }
  };

  const onRemoveWrapper = async () => {
    const success = await handleRemoveFromLibrary();
    if (success && type === "tv") {
      setAllSeasonsEpisodes({});
      await handleSeasonClick(selectedSeason, { forceReload: true });
    }
  };

  if (loading) {
    return (
      <div className="mt-20 text-center text-white">{t("common:loading")}</div>
    );
  }

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
    <div className="pb-20 text-skin-text">
      {bgImage && (
        <div
          className="fixed inset-0 -z-10 h-full w-full bg-cover bg-center opacity-20 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="glass relative mx-auto mt-6 max-w-6xl rounded-2xl p-8">
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

        {type === "tv" && data.seasons && Array.isArray(data.seasons) && (
          <div className="mt-12 animate-fade-in">
            <div className="mb-6 flex flex-col items-end justify-between gap-4 md:flex-row md:items-center">
              <h3 className="text-2xl font-bold text-skin-primary">
                {t("entertainment:detail.seasons_and_episodes")}
              </h3>

              <div className="relative flex rounded-lg border border-skin-border bg-skin-surface p-1">
                <div className="pointer-events-none absolute inset-0 p-1">
                  <div
                    className="h-full w-1/2 rounded-md bg-skin-primary transition-transform duration-300 ease-out"
                    style={{
                      transform:
                        viewMode === "list"
                          ? "translateX(0%)"
                          : "translateX(100%)",
                    }}
                  />
                </div>
                <button
                  onClick={() => handleDisplayModeChange("list")}
                  title={t("common:buttons.list_view")}
                  className={`relative z-10 flex flex-1 items-center justify-center rounded-md p-2 transition ${
                    viewMode === "list"
                      ? "text-skin-base"
                      : "text-skin-muted hover:text-skin-text"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  className={`relative z-10 flex flex-1 items-center justify-center rounded-md p-2 transition ${
                    viewMode === "graph"
                      ? "text-skin-base"
                      : "text-skin-muted hover:text-skin-text"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                onToggleEpisode={(ep) => handleToggleEpisode(selectedSeason, ep)}
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
