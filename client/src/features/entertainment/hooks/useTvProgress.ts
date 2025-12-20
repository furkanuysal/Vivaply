import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { mediaService } from "../services/mediaService";
import type { TmdbEpisodeDto } from "../types";

export function useTvProgress(tmdbId: number | undefined, seasons: any[] = []) {
  const { t } = useTranslation(["common", "entertainment"]);

  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<TmdbEpisodeDto[]>([]);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Graph View States
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [allSeasonsEpisodes, setAllSeasonsEpisodes] = useState<
    Record<number, TmdbEpisodeDto[]>
  >({});
  const [loadingAllSeasons, setLoadingAllSeasons] = useState(false);

  // Helper to update both states
  const updateEpisodeInState = useCallback(
    (
      seasonNum: number,
      episodeId: number,
      changes: Partial<TmdbEpisodeDto>
    ) => {
      // Update current list if applicable
      setSeasonEpisodes((prev) => {
        if (selectedSeason !== seasonNum) return prev;
        return prev.map((ep) =>
          ep.id === episodeId ? { ...ep, ...changes } : ep
        );
      });

      // Update cache
      setAllSeasonsEpisodes((prev) => {
        if (!prev[seasonNum]) return prev;
        return {
          ...prev,
          [seasonNum]: prev[seasonNum].map((ep) =>
            ep.id === episodeId ? { ...ep, ...changes } : ep
          ),
        };
      });
    },
    [selectedSeason]
  );

  const handleSeasonClick = async (
    seasonNum: number,
    options?: { forceReload?: boolean }
  ) => {
    if (!tmdbId) return;

    // Cache hit
    if (allSeasonsEpisodes[seasonNum] && !options?.forceReload) {
      setSelectedSeason(seasonNum);
      setSeasonEpisodes(allSeasonsEpisodes[seasonNum]);
      return;
    }

    setSelectedSeason(seasonNum);
    setSeasonEpisodes([]);
    setLoadingSeason(true);

    try {
      const seasonData = await mediaService.getTvSeasonDetail(
        tmdbId,
        seasonNum
      );

      setSeasonEpisodes(seasonData.episodes);

      setAllSeasonsEpisodes((prev) => ({
        ...prev,
        [seasonNum]: seasonData.episodes,
      }));
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(t("common:messages.general_error"));
    } finally {
      setLoadingSeason(false);
    }
  };

  const handleDisplayModeChange = async (mode: "list" | "graph") => {
    setViewMode(mode);

    if (mode === "graph" && tmdbId) {
      // Find which seasons we are missing
      const seasonsToFetch = seasons.filter(
        (s: any) => s.season_number > 0 && !allSeasonsEpisodes[s.season_number]
      );

      if (seasonsToFetch.length === 0) return;

      setLoadingAllSeasons(true);
      try {
        const promises = seasonsToFetch.map((s: any) =>
          mediaService.getTvSeasonDetail(tmdbId, s.season_number)
        );

        const results = await Promise.all(promises);

        setAllSeasonsEpisodes((prev) => {
          const newState = { ...prev };
          results.forEach((res: any) => {
            if (res && res.season_number) {
              newState[res.season_number] = res.episodes;
            }
          });
          return newState;
        });
      } catch (error) {
        toast.error(t("common:messages.general_error"));
      } finally {
        setLoadingAllSeasons(false);
      }
    }
  };

  const handleToggleEpisode = async (
    seasonNum: number,
    episode: TmdbEpisodeDto
  ) => {
    if (!tmdbId) return;
    const newStatus = !episode.is_watched;

    // Optimistic Update
    updateEpisodeInState(seasonNum, episode.id, { is_watched: newStatus });

    try {
      await mediaService.toggleEpisode(
        tmdbId,
        seasonNum,
        episode.episode_number
      );

      if (newStatus) {
        toast.success(
          t("entertainment:messages.watch_episode_success", {
            episodeNumber: episode.episode_number,
          })
        );
      }
    } catch (error) {
      // Revert
      updateEpisodeInState(seasonNum, episode.id, { is_watched: !newStatus });
      toast.error(t("common:messages.general_error"));
    }
  };

  const handleMarkSeasonWatched = async () => {
    if (!tmdbId) return;
    try {
      await mediaService.markSeasonWatched({
        tmdbShowId: tmdbId,
        seasonNumber: selectedSeason,
      });
      toast.success(
        t("entertainment:messages.mark_season_as_completed_success", {
          seasonNumber: selectedSeason,
        })
      );

      // Update all episodes in this season to watched
      setSeasonEpisodes((prev) =>
        prev.map((ep) => ({ ...ep, is_watched: true }))
      );

      setAllSeasonsEpisodes((prev) => {
        if (!prev[selectedSeason]) return prev;
        return {
          ...prev,
          [selectedSeason]: prev[selectedSeason].map((ep) => ({
            ...ep,
            is_watched: true,
          })),
        };
      });
      return true;
    } catch (error) {
      toast.error(t("common:messages.general_error"));
      return false;
    }
  };

  // Set initial episodes for the selected season if retrieved elsewhere (e.g. initial load)
  // This might be tricky. The original code does `if (firstSeason) handleSeasonClick(firstSeason)` in `useEffect`.
  // We can return `handleSeasonClick` and let the consumer call it once data is loaded.

  return {
    selectedSeason,
    seasonEpisodes,
    loadingSeason,
    viewMode,
    allSeasonsEpisodes,
    loadingAllSeasons,
    setAllSeasonsEpisodes,
    handleSeasonClick,
    handleDisplayModeChange,
    handleToggleEpisode,
    handleMarkSeasonWatched,
    setSeasonEpisodes, // expose for edge cases like 'remove from library' re-fetch
  };
}
