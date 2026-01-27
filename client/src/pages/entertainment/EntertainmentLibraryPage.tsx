import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  EyeSlashIcon,
  EyeIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { mediaService } from "@/features/entertainment/services/mediaService";
import MediaCard from "@/features/entertainment/components/shared/MediaCard";
import ProdStatusBadge from "@/features/entertainment/components/shared/ProdStatusBadge";
import type {
  TmdbContentDto,
  GameContentDto,
  UpdateGameProgressDto,
} from "@/features/entertainment/types";
import {
  WatchStatus,
  GameCompletionType,
  type UpdateEntertainmentStatusDto,
} from "@/features/entertainment/types";
import { useWatchStatusConfig } from "@/features/entertainment/hooks/useWatchStatusConfig";
import { gamesService } from "@/features/entertainment/services/gameService";
import { usePlayStatusConfig } from "@/features/entertainment/hooks/usePlayStatusConfig";
import GameCard from "@/features/entertainment/components/shared/GameCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import GameProgressDialog from "@/features/entertainment/components/library/GameProgressDialog";
import EntertainmentStatusDialog from "@/features/entertainment/components/library/EntertainmentStatusDialog";
import { useTranslation } from "react-i18next";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";

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
    WatchStatus.Watching,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnwatchedOnly, setShowUnwatchedOnly] = useState(false);

  // Confirm Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<any | null>(null);

  // Sort Dropdown State
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

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
    null,
  );
  const [contentTypeToEdit, setContentTypeToEdit] = useState<"tv" | "movie">(
    "tv",
  );

  // Sorting State
  type SortOption = "title" | "date" | "rating";
  type SortDirection = "asc" | "desc";

  const [sortConfig, setSortConfig] = useState<{
    key: SortOption;
    direction: SortDirection;
  }>(() => {
    try {
      const saved = localStorage.getItem("entertainment_library_sort");
      return saved ? JSON.parse(saved) : { key: "title", direction: "asc" };
    } catch {
      return { key: "title", direction: "asc" };
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "entertainment_library_sort",
      JSON.stringify(sortConfig),
    );
  }, [sortConfig]);

  const toggleSortDirection = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSortChange = (key: SortOption) => {
    setSortConfig((prev) => ({
      ...prev,
      key,
      // If clicking same key, toggle direction. If new key, default to asc (or desc for date/rating? usually desc for date/rating)
      // User request said remembering the selection.
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusEditClick = (
    item: TmdbContentDto,
    type: "tv" | "movie",
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
            : g,
        ),
      }));
    } catch (error) {
      console.error(error);
      toast.error(t("common:messages.save_error"));
    }
  };

  const handleSaveEntertainmentStatus = async (
    data: UpdateEntertainmentStatusDto,
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
          activeTab as "tv" | "movie",
        );
      }

      toast.success(t("common:messages.remove_from_library_success"));

      // Update local state by filtering out the removed item
      setLibraryData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(
          (i: any) => i.id !== itemToRemove.id,
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

  const filteredItems = (
    filterStatus === 0
      ? currentItems
      : (currentItems as any[]).filter((item) => {
          if (activeTab === "game") {
            return item.userStatus === filterStatus;
          }
          return item.user_status === filterStatus;
        })
  )
    .filter((item) => {
      if (!searchQuery) return true;
      const title =
        activeTab === "game"
          ? (item as GameContentDto).title
          : (item as TmdbContentDto).display_name ||
            (item as TmdbContentDto).title ||
            (item as TmdbContentDto).name;
      return title?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter((item) => {
      if (activeTab === "tv" && showUnwatchedOnly) {
        return !isUpToDate(item as TmdbContentDto);
      }
      return true;
    })
    .sort((a, b) => {
      // Helper to get value
      const getValue = (item: any, key: SortOption) => {
        if (key === "title") {
          return activeTab === "game"
            ? item.title
            : item.display_name || item.title || item.name;
        }
        if (key === "rating") {
          return activeTab === "game" ? item.userRating : item.user_rating;
        }
        if (key === "date") {
          return activeTab === "game"
            ? item.releaseDate
            : item.first_air_date || item.release_date;
        }
        return "";
      };

      const valA = getValue(a, sortConfig.key);
      const valB = getValue(b, sortConfig.key);

      if (!valA && !valB) return 0;
      if (!valA) return 1;
      if (!valB) return -1;

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
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
        return t("entertainment:games.completionType.mainStory");
      case GameCompletionType.MainPlusExtras:
        return t("entertainment:games.completionType.mainPlusExtras");
      case GameCompletionType.Completionist:
        return t("entertainment:games.completionType.completionist");
      case GameCompletionType.Speedrun:
        return t("entertainment:games.completionType.speedrun");
      default:
        return t("entertainment:games.completionType.none");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-skin-text">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold">
          {t("entertainment:library.title")}
        </h1>

        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative group">
            <input
              type="text"
              placeholder={t("common:buttons.search") || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`py-2 rounded-full bg-skin-surface border border-skin-border focus:border-skin-primary focus:outline-none text-sm transition-all duration-300 peer hover:bg-skin-surface/90 ${
                searchQuery
                  ? "w-64 pl-9 pr-4"
                  : "w-9 px-0 focus:w-64 focus:pl-9 focus:pr-4 placeholder-transparent focus:placeholder-skin-muted cursor-pointer text-center focus:text-left"
              }`}
            />
            <MagnifyingGlassIcon
              className={`w-5 h-5 text-skin-text absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 group-hover:text-skin-primary ${
                searchQuery
                  ? "left-3"
                  : "left-1/2 -translate-x-1/2 peer-focus:left-3 peer-focus:translate-x-0"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-skin-muted hover:text-skin-text"
              >
                <span className="sr-only">Clear</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>

          {/* Unwatched Filter Button (TV Only) */}
          {activeTab === "tv" && (
            <button
              onClick={() => setShowUnwatchedOnly(!showUnwatchedOnly)}
              className={`p-2 rounded-full border transition ${
                showUnwatchedOnly
                  ? "bg-skin-primary text-white border-skin-primary"
                  : "bg-skin-surface border-skin-border hover:bg-skin-surface/90 hover:text-skin-primary"
              }`}
              title={
                showUnwatchedOnly
                  ? t("entertainment:library.show_all")
                  : t("entertainment:library.unwatched_episodes")
              }
            >
              {showUnwatchedOnly ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}

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

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="p-2 rounded-full bg-skin-surface hover:bg-skin-surface/90 border border-skin-border transition hover:text-skin-primary flex items-center gap-2"
              title={t("entertainment:sort.sort_by")}
            >
              {sortConfig.direction === "asc" ? (
                <BarsArrowUpIcon className="w-5 h-5" />
              ) : (
                <BarsArrowDownIcon className="w-5 h-5" />
              )}
            </button>

            {isSortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSortDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-skin-surface border border-skin-border rounded-lg shadow-xl z-30 py-1 animate-fade-in">
                  <div className="px-3 py-2 border-b border-skin-border flex items-center justify-between">
                    <span className="text-xs font-bold text-skin-muted uppercase">
                      {t("entertainment:sort.sort_by")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSortDirection();
                      }}
                      className="text-xs text-skin-primary hover:text-skin-text transition"
                    >
                      {sortConfig.direction === "asc"
                        ? t("entertainment:sort.ascending")
                        : t("entertainment:sort.descending")}
                    </button>
                  </div>
                  {(["title", "date", "rating"] as SortOption[]).map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => {
                          handleSortChange(option);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition ${
                          sortConfig.key === option
                            ? "bg-skin-primary/10 text-skin-primary"
                            : "text-skin-text hover:bg-skin-base/50"
                        }`}
                      >
                        {option === "title" && t("entertainment:sort.title")}
                        {option === "date" &&
                          t("entertainment:sort.release_date")}
                        {option === "rating" &&
                          t("entertainment:sort.user_rating")}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
          {/* View Toggle Buttons */}
          <div className="relative bg-skin-surface p-1 rounded-lg flex border border-skin-border">
            {/* Sliding Indicator */}
            <div
              className="absolute inset-0 p-1 pointer-events-none"
              aria-hidden
            >
              <div
                className="h-full w-1/2 rounded-md bg-skin-primary transition-transform duration-300 ease-out"
                style={{
                  transform:
                    viewMode === "grid" ? "translateX(0%)" : "translateX(100%)",
                }}
              />
            </div>

            <button
              onClick={() => setViewMode("grid")}
              className={`relative z-10 flex-1 p-2 rounded-md transition ${
                viewMode === "grid"
                  ? "text-skin-base"
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
              className={`relative z-10 flex-1 p-2 rounded-md transition ${
                viewMode === "table"
                  ? "text-skin-base"
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

          <div className="relative bg-skin-surface p-1 rounded-lg flex border border-skin-border">
            {/* Sliding Indicator */}
            <div className="absolute inset-0 p-1 pointer-events-none">
              <div
                className="h-full w-1/3 rounded-md bg-skin-primary transition-transform duration-300 ease-out"
                style={{
                  transform:
                    activeTab === "tv"
                      ? "translateX(0%)"
                      : activeTab === "movie"
                        ? "translateX(100%)"
                        : "translateX(200%)",
                }}
              />
            </div>

            <button
              onClick={() => setActiveTab("tv")}
              className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "tv"
                  ? "text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.tv_shows")}
              <span className="ml-2 bg-skin-text/20 px-2 rounded-full text-xs">
                {libraryData.tv.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("movie")}
              className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "movie"
                  ? "text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.movies")}
              <span className="ml-2 bg-skin-text/20 px-2 rounded-full text-xs">
                {libraryData.movie.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("game")}
              className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "game"
                  ? "text-skin-base"
                  : "text-skin-muted hover:text-skin-text"
              }`}
            >
              {t("entertainment:common.games")}
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
                  ),
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
                        activeTab === "game" ? null : item.tagline;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-skin-surface/50 transition cursor-pointer group"
                          onClick={() =>
                            navigate(`/entertainment/${activeTab}/${item.id}`)
                          }
                        >
                          <td className="px-4 py-3 w-20">
                            {posterPath ? (
                              <img
                                src={
                                  posterPath.startsWith("http")
                                    ? posterPath
                                    : `https://image.tmdb.org/t/p/w92${posterPath}`
                                }
                                alt={title}
                                className="w-12 h-18 rounded-md shadow-md object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-12 aspect-[2/3] rounded-md shadow-md overflow-hidden group-hover:scale-105 transition">
                                <UniversalCoverFallback
                                  title={title}
                                  type={activeTab}
                                  variant="compact"
                                />
                              </div>
                            )}
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
                                    "entertainment:library.table.watched_up_to_date",
                                  )}
                                />
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWatchNext(item);
                                  }}
                                  disabled={loadingItems.has(item.id)}
                                  className="text-skin-accent hover:text-skin-accent/80 transition disabled:opacity-50"
                                  title={t(
                                    "entertainment:library.table.watch_next",
                                  )}
                                >
                                  {loadingItems.has(item.id) ? (
                                    <div className="w-5 h-5 border-2 border-skin-accent border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <PlusCircleIcon className="w-6 h-6 hover:scale-105" />
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
                                false,
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
                                      "entertainment:games.hours_short",
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
                              className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center whitespace-nowrap ${
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
                                    activeTab as "tv" | "movie",
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
