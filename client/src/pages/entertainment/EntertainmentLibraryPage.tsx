import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { mediaService } from "../../features/entertainment/services/mediaService";
import MediaCard from "../../features/entertainment/components/shared/MediaCard";
import ProdStatusBadge from "../../features/entertainment/components/shared/ProdStatusBadge";
import type {
  TmdbContentDto,
  GameContentDto,
  UpdateGameProgressDto,
} from "../../features/entertainment/types";
import {
  WatchStatus,
  PlayStatus,
  GameCompletionType,
  type UpdateEntertainmentStatusDto,
} from "../../features/entertainment/types";
import { useWatchStatusConfig } from "../../features/entertainment/hooks/useWatchStatusConfig";
import { gamesService } from "../../features/entertainment/services/gameService";
import { usePlayStatusConfig } from "../../features/entertainment/hooks/usePlayStatusConfig";
import GameCard from "../../features/entertainment/components/shared/GameCard";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import GameProgressDialog from "../../features/entertainment/components/library/GameProgressDialog";
import EntertainmentStatusDialog from "../../features/entertainment/components/library/EntertainmentStatusDialog";
import { useTranslation } from "react-i18next";

export default function EntertainmentLibraryPage() {
  const navigate = useNavigate();
  const [libraryData, setLibraryData] = useState<{
    tv: TmdbContentDto[];
    movie: TmdbContentDto[];
    game: GameContentDto[];
  }>({ tv: [], movie: [], game: [] });
  const [activeTab, setActiveTab] = useState<"tv" | "movie" | "game">("tv");
  const { t } = useTranslation(["entertainment", "common"]);

  const [filterStatus, setFilterStatus] = useState<WatchStatus | 0>(
    WatchStatus.Watching
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

  // Confirm Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<any | null>(null);

  const handleRemoveClick = (item: any) => {
    setItemToRemove(item);
    setIsConfirmOpen(true);
  };

  // Quick Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<GameContentDto | null>(null);

  const handleEditClick = (item: GameContentDto) => {
    setGameToEdit(item);
    setIsEditOpen(true);
  };

  // Entertainment Status Dialog State (TV/Movie)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<TmdbContentDto | null>(
    null
  );
  const [contentTypeToEdit, setContentTypeToEdit] = useState<"tv" | "movie">(
    "tv"
  );

  const handleStatusEditClick = (
    item: TmdbContentDto,
    type: "tv" | "movie"
  ) => {
    setContentToEdit(item);
    setContentTypeToEdit(type);
    setIsStatusDialogOpen(true);
  };

  const isUpToDate = (item: TmdbContentDto) => {
    if (
      !item.latest_episode ||
      item.last_watched_season == null ||
      item.last_watched_episode == null
    ) {
      return false;
    }

    return (
      item.latest_episode ===
      `S${item.last_watched_season} E${item.last_watched_episode}`
    );
  };

  const handleSaveProgress = async (data: UpdateGameProgressDto) => {
    try {
      await gamesService.updateProgress(data);
      toast.success(t("common:messages.save_success"));

      // Update local state
      setLibraryData((prev) => ({
        ...prev,
        game: prev.game.map((g) =>
          g.id === data.igdbId
            ? {
                ...g,
                userPlatform: data.userPlatform,
                completionType: data.completionType,
                userPlaytime: data.userPlaytime,
                userRating: data.userRating,
              }
            : g
        ),
      }));
    } catch (error) {
      console.error(error);
      toast.error(t("common:messages.save_error"));
    }
  };

  const handleSaveEntertainmentStatus = async (
    data: UpdateEntertainmentStatusDto
  ) => {
    try {
      await mediaService.updateProgress(data);
      toast.success(t("common:messages.save_success"));

      // Update local state
      setLibraryData((prev) => ({
        ...prev,
        [data.type]: prev[data.type].map((item) => {
          if (item.id === data.tmdbId) {
            return {
              ...item,
              user_status: data.status,
              user_rating: data.rating,
              user_review: data.review,
            };
          }
          return item;
        }),
      }));
    } catch (error) {
      console.error(error);
      toast.error(t("common:messages.save_error"));
    }
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;

    try {
      if (activeTab === "game") {
        await gamesService.removeGame(itemToRemove.id); // igdbId or id depending on tracking? Library usually returns id or object with id.
      } else {
        await mediaService.removeFromLibrary(
          itemToRemove.id,
          activeTab as "tv" | "movie"
        );
      }

      toast.success(t("common:messages.remove_from_library_success"));

      // Update local state by filtering out the removed item
      setLibraryData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(
          (i: any) => i.id !== itemToRemove.id
        ),
      }));
    } catch (error) {
      console.error(error);
      toast.error(t("common:messages.remove_error"));
    } finally {
      setItemToRemove(null);
    }
  };

  const handleWatchNext = async (item: TmdbContentDto) => {
    setLoadingItems((prev) => new Set(prev).add(item.id));
    try {
      const result = await mediaService.watchNextEpisode(item.id);
      toast.success(result.message);

      // Update local state
      setLibraryData((prev) => ({
        ...prev,
        tv: prev.tv.map((tvItem) => {
          if (tvItem.id === item.id) {
            return {
              ...tvItem,
              last_watched_season: result.seasonNumber,
              last_watched_episode: result.episodeNumber,
              last_watched_at: new Date().toISOString(),
              user_status: result.newStatus ?? tvItem.user_status,
            };
          }
          return tvItem;
        }),
      }));
    } catch (error: any) {
      toast.error(error.response?.data || t("common:messages.general_error"));
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await mediaService.syncLibrary();
      toast.success(t("common:messages.library_content_refreshed"));

      // Fetch updated library data
      const data = await mediaService.getLibrary();
      const gameData = await gamesService.getLibrary();
      setLibraryData({ ...data, game: gameData });
    } catch (error) {
      toast.error(t("common:messages.library_content_couldnt_refresh"));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const data = await mediaService.getLibrary();
        const gameData = await gamesService.getLibrary();
        setLibraryData({ ...data, game: gameData });
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, []);

  // Tab change, set filter to Watching for TV, reset for Movie
  useEffect(() => {
    if (activeTab === "tv") {
      setFilterStatus(WatchStatus.Watching);
    } else {
      setFilterStatus(0);
    }
  }, [activeTab]);

  const currentItems =
    activeTab === "tv"
      ? libraryData.tv
      : activeTab === "movie"
      ? libraryData.movie
      : libraryData.game;

  // Watch Status Config (TV/Movie)
  const {
    STATUS_CONFIG: WATCH_STATUS_CONFIG,
    FILTER_OPTIONS: WATCH_FILTER_OPTIONS,
    STATUS_ORDER: WATCH_STATUS_ORDER,
  } = useWatchStatusConfig(activeTab !== "game" ? activeTab : "tv");

  // Play Status Config (Game)
  const {
    STATUS_CONFIG: PLAY_STATUS_CONFIG,
    FILTER_OPTIONS: PLAY_FILTER_OPTIONS,
  } = usePlayStatusConfig();

  // Determine which config to use
  const STATUS_CONFIG: any =
    activeTab === "game" ? PLAY_STATUS_CONFIG : WATCH_STATUS_CONFIG;
  const FILTER_OPTIONS =
    activeTab === "game" ? PLAY_FILTER_OPTIONS : WATCH_FILTER_OPTIONS;

  // Status Order for games (custom or reuse)
  const STATUS_ORDER: any =
    activeTab === "game"
      ? {
          [PlayStatus.Playing]: 1,
          [PlayStatus.PlanToPlay]: 2,
          [PlayStatus.OnHold]: 3,
          [PlayStatus.Completed]: 4,
          [PlayStatus.Dropped]: 5,
        }
      : WATCH_STATUS_ORDER;

  const filteredItems = (
    filterStatus === 0
      ? currentItems
      : (currentItems as any[]).filter((item) => {
          if (activeTab === "game") {
            return item.userStatus === filterStatus;
          }
          return item.user_status === filterStatus;
        })
  ).sort((a, b) => {
    const statusA = activeTab === "game" ? a.userStatus : a.user_status;
    const statusB = activeTab === "game" ? b.userStatus : b.user_status;
    const orderA = STATUS_ORDER[statusA] || 99;
    const orderB = STATUS_ORDER[statusB] || 99;
    return orderA - orderB;
  });

  const formatLatestEpisode = (latestEpisode?: string, isShort = false) => {
    if (!latestEpisode) return "-";

    const match = latestEpisode.match(/S\s*(\d+)\s*E\s*(\d+)/i);
    if (!match) return latestEpisode;

    const key = isShort
      ? "entertainment:format.season_episode_short"
      : "entertainment:format.season_episode";

    return t(key, {
      season: Number(match[1]),
      episode: Number(match[2]),
    });
  };

  const formatLastWatched = (item: TmdbContentDto, isShort = false) => {
    if (item.last_watched_season == null || item.last_watched_episode == null) {
      return "-";
    }

    const key = isShort
      ? "entertainment:format.season_episode_short"
      : "entertainment:format.season_episode";

    return t(key, {
      season: item.last_watched_season,
      episode: item.last_watched_episode,
    });
  };

  const getCompletionLabel = (type?: GameCompletionType) => {
    switch (type) {
      case GameCompletionType.MainStory:
        return "Main Story";
      case GameCompletionType.MainPlusExtras:
        return "Main + Extras";
      case GameCompletionType.Completionist:
        return "100% / Platinum";
      case GameCompletionType.Speedrun:
        return "Speedrun";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-skin-text">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold">
          {t("entertainment:library.title")}
        </h1>

        <div className="flex items-center gap-4">
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2 rounded-full bg-skin-surface hover:bg-skin-surface/90 border border-skin-border transition ${
              isSyncing
                ? "animate-spin cursor-not-allowed opacity-50"
                : "hover:text-skin-primary"
            }`}
            title={t("common:buttons.refresh_library")}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          {/* View Toggle Buttons */}
          <div className="bg-skin-surface p-1 rounded-lg flex gap-1 border border-skin-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition ${
                viewMode === "grid"
                  ? "bg-skin-primary text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
              title={t("common:buttons.grid_view")}
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
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition ${
                viewMode === "table"
                  ? "bg-skin-primary text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
              title={t("common:buttons.table_view")}
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
          </div>

          <div className="bg-skin-surface p-1 rounded-lg flex gap-1 border border-skin-border">
            <button
              onClick={() => setActiveTab("tv")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "tv"
                  ? "bg-skin-primary text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.tv_shows")}{" "}
              <span className="ml-2 bg-skin-text/20 px-2 rounded-full text-xs">
                {libraryData.tv.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("movie")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "movie"
                  ? "bg-skin-primary text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.movies")}{" "}
              <span className="ml-2 bg-skin-text/20 px-2 rounded-full text-xs">
                {libraryData.movie.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("game")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "game"
                  ? "bg-skin-primary text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.games")}{" "}
              <span className="ml-2 bg-skin-text/20 px-2 rounded-full text-xs">
                {libraryData.game.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 pb-2">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as any)}
            className={`px-4 py-2 rounded-full text-sm border transition whitespace-nowrap
                    ${
                      filterStatus === filter.value
                        ? "bg-skin-surface border-skin-primary text-skin-primary"
                        : "bg-transparent border-skin-border text-skin-muted hover:border-skin-text"
                    }
                `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
        </div>
      ) : (
        <>
          {filteredItems.length > 0 ? (
            viewMode === "grid" ? (
              // Grid View
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredItems.map((item) =>
                  activeTab === "game" ? (
                    <GameCard key={item.id} game={item as GameContentDto} />
                  ) : (
                    <MediaCard
                      key={item.id}
                      content={item as TmdbContentDto}
                      type={activeTab as "tv" | "movie"}
                    />
                  )
                )}
              </div>
            ) : (
              // Table View
              <div className="w-full overflow-x-auto rounded-xl border border-skin-border shadow-xl">
                <table className="w-full table-fixed text-left text-sm text-skin-muted">
                  <thead className="bg-skin-surface text-skin-text uppercase font-bold text-xs">
                    <tr>
                      <th className="px-4 py-4">
                        {t("entertainment:library.table.poster")}
                      </th>
                      <th className="px-4 py-4">
                        {t("entertainment:library.table.title")}
                      </th>
                      <th className="px-4 py-4 hidden md:table-cell">
                        {t("entertainment:library.table.average_rating")}
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" || activeTab === "game"
                            ? ""
                            : "hidden md:table-cell"
                        }`}
                      >
                        {t("entertainment:library.table.personal_rating")}
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" || activeTab === "game"
                            ? "hidden"
                            : ""
                        }`}
                      >
                        {t("entertainment:library.table.last_watched")}
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" || activeTab === "game"
                            ? "hidden"
                            : ""
                        }`}
                      >
                        {t("entertainment:library.table.latest_episode")}
                      </th>
                      <th className="px-4 py-4 hidden md:table-cell">
                        {activeTab === "game"
                          ? t("entertainment:games.platform")
                          : t("entertainment:library.table.prod_status")}
                      </th>
                      {activeTab === "game" && (
                        <>
                          <th className="px-4 py-4 hidden md:table-cell">
                            {t("entertainment:games.playtime")}
                          </th>
                          <th className="px-4 py-4 hidden md:table-cell">
                            {t("entertainment:games.completion")}
                          </th>
                        </>
                      )}
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" || activeTab === "game"
                            ? ""
                            : "hidden md:table-cell"
                        }`}
                      >
                        {t("entertainment:library.table.user_status")}
                      </th>
                      {activeTab !== "game" && (
                        <th className="px-4 py-4 hidden md:table-cell">
                          {t("entertainment:library.table.date")}
                        </th>
                      )}
                      <th className="px-4 py-4 text-right">
                        {t("entertainment:library.table.actions") || "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-skin-border bg-skin-base/50">
                    {filteredItems.map((item: any) => {
                      // Normalize accessors
                      const posterPath =
                        activeTab === "game" ? item.coverUrl : item.poster_path;
                      const title =
                        activeTab === "game" ? item.title : item.display_name;
                      const voteAverage =
                        activeTab === "game"
                          ? item.voteAverage
                          : item.vote_average;
                      const userRating =
                        activeTab === "game"
                          ? item.userRating
                          : item.user_rating;
                      const userStatus =
                        activeTab === "game"
                          ? item.userStatus
                          : item.user_status;
                      const dateStr =
                        activeTab === "game"
                          ? item.releaseDate
                          : item.display_date;
                      const tagline =
                        activeTab === "game"
                          ? null // User requested to remove tagline/platforms for games
                          : item.tagline;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-skin-surface/50 transition cursor-pointer group"
                          onClick={() =>
                            navigate(`/entertainment/${activeTab}/${item.id}`)
                          }
                        >
                          <td className="px-4 py-3 w-20">
                            <img
                              src={
                                posterPath
                                  ? posterPath.startsWith("http")
                                    ? posterPath
                                    : `https://image.tmdb.org/t/p/w92${posterPath}`
                                  : "https://via.placeholder.com/92x138"
                              }
                              alt={title}
                              className="w-12 h-18 rounded-md shadow-md object-cover group-hover:scale-105 transition"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-skin-text text-base">
                            {title}
                            {tagline && (
                              <p className="text-xs text-skin-muted font-normal mt-1 line-clamp-1">
                                {tagline}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-skin-accent font-bold">
                              ★ {(voteAverage || 0).toFixed(1)}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 ${
                              activeTab === "movie" || activeTab === "game"
                                ? ""
                                : "hidden md:table-cell"
                            }`}
                          >
                            {userRating ? (
                              <span className="text-skin-primary font-bold">
                                ★ {Number(userRating).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-skin-muted">-</span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-skin-text ${
                              activeTab === "movie" || activeTab === "game"
                                ? "hidden"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                <span className="md:hidden">
                                  {formatLastWatched(item, true) || "-"}
                                </span>
                                <span className="hidden md:inline">
                                  {formatLastWatched(item, false)}
                                </span>
                              </span>
                              {isUpToDate(item) ? (
                                <CheckCircleIcon
                                  className="w-6 h-6 text-skin-secondary flex-shrink-0"
                                  title={t(
                                    "entertainment:library.table.watched_up_to_date"
                                  )}
                                />
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWatchNext(item);
                                  }}
                                  disabled={loadingItems.has(item.id)}
                                  className="text-skin-primary hover:text-skin-primary/80 transition disabled:opacity-50"
                                  title={t(
                                    "entertainment:library.table.watch_next"
                                  )}
                                >
                                  {loadingItems.has(item.id) ? (
                                    <div className="w-5 h-5 border-2 border-skin-primary border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <PlusCircleIcon className="w-6 h-6" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-skin-muted ${
                              activeTab === "movie" || activeTab === "game"
                                ? "hidden"
                                : ""
                            }`}
                          >
                            <span className="md:hidden">
                              {formatLatestEpisode(item.latest_episode, true) ||
                                "-"}
                            </span>
                            <span className="hidden md:inline">
                              {formatLatestEpisode(
                                item.latest_episode,
                                false
                              ) || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {activeTab === "game" ? (
                              <span>{item.userPlatform || "-"}</span>
                            ) : (
                              <ProdStatusBadge status={item.status} />
                            )}
                          </td>
                          {activeTab === "game" && (
                            <>
                              <td className="px-4 py-3 hidden md:table-cell">
                                {item.userPlaytime
                                  ? `${item.userPlaytime} ${t(
                                      "entertainment:games.hours_short"
                                    )}`
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                {getCompletionLabel(item.completionType)}
                              </td>
                            </>
                          )}
                          <td
                            className={`px-4 py-3 ${
                              activeTab === "movie" || activeTab === "game"
                                ? ""
                                : "hidden md:table-cell"
                            }`}
                          >
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                STATUS_CONFIG[userStatus]?.badge ?? ""
                              }`}
                            >
                              {STATUS_CONFIG[userStatus]?.label}
                            </span>
                          </td>
                          {activeTab !== "game" && (
                            <td className="px-4 py-3 hidden md:table-cell">
                              {dateStr?.split("-")[0] || "-"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            {activeTab === "game" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(item as GameContentDto);
                                }}
                                className="p-2 text-skin-muted hover:text-skin-primary hover:bg-skin-surface rounded-full transition"
                                title={t("common:buttons.update")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                            )}
                            {activeTab !== "game" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusEditClick(
                                    item as TmdbContentDto,
                                    activeTab as "tv" | "movie"
                                  );
                                }}
                                className="p-2 text-skin-muted hover:text-skin-primary hover:bg-skin-surface rounded-full transition"
                                title={t("common:buttons.update")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClick(item);
                              }}
                              className="p-2 text-skin-muted hover:text-red-500 hover:bg-skin-surface rounded-full transition"
                              title={t("common:buttons.remove_from_library")}
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-skin-surface/30 rounded-2xl border border-skin-border/50">
              <p className="text-skin-muted text-lg">
                {t("entertainment:library.no_content_in_this_list")}
              </p>
              <button
                onClick={() => navigate("/entertainment")}
                className="mt-4 text-skin-primary hover:underline"
              >
                {t("entertainment:library.discover_new_content")}
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title={`${t("common:dialogs.remove_from_library_title")}: ${
          itemToRemove?.display_name || itemToRemove?.title || ""
        }`}
        message={t("common:dialogs.remove_from_library_message")}
      />
      <GameProgressDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        game={gameToEdit}
        onSave={handleSaveProgress}
      />
      <EntertainmentStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        content={contentToEdit}
        type={contentTypeToEdit}
        onSave={handleSaveEntertainmentStatus}
      />
    </div>
  );
}
