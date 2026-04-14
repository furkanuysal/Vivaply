import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { gamesApi } from "@/features/entertainment/api/gamesApi";
import { mediaApi } from "@/features/entertainment/api/mediaApi";
import {
  GameCompletionType,
  WatchStatus,
  type GameContentDto,
  type TmdbContentDto,
  type UpdateEntertainmentStatusDto,
  type UpdateGameProgressDto,
} from "@/features/entertainment/types";
import type {
  EntertainmentSortKey,
  SortDirection,
} from "@/features/entertainment/components/library/SortableHeader";

type ActiveTab = "tv" | "movie" | "game";

type LibraryData = {
  tv: TmdbContentDto[];
  movie: TmdbContentDto[];
  game: GameContentDto[];
};

const SORT_STORAGE_KEY = "entertainment_library_sort";

function getDefaultDirection(key: EntertainmentSortKey): SortDirection {
  return [
    "averageRating",
    "userRating",
    "lastWatched",
    "latestEpisode",
    "watchDate",
    "releaseDate",
    "playtime",
  ].includes(key)
    ? "desc"
    : "asc";
}

function getDateSortValue(value?: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getSortableValue(item: TmdbContentDto | GameContentDto, tab: ActiveTab, key: EntertainmentSortKey) {
  switch (key) {
    case "title":
      return tab === "game"
        ? (item as GameContentDto).title
        : (item as TmdbContentDto).display_name ||
            (item as TmdbContentDto).title ||
            (item as TmdbContentDto).name ||
            "";
    case "averageRating":
      return tab === "game"
        ? (item as GameContentDto).voteAverage ?? 0
        : (item as TmdbContentDto).vote_average ?? 0;
    case "userRating":
      return tab === "game"
        ? (item as GameContentDto).userRating ?? 0
        : (item as TmdbContentDto).user_rating ?? 0;
    case "lastWatched": {
      const content = item as TmdbContentDto;
      return getDateSortValue(content.last_watched_at);
    }
    case "latestEpisode": {
      const content = item as TmdbContentDto;
      return getDateSortValue(content.latest_episode_air_date);
    }
    case "status":
      return tab === "game"
        ? (item as GameContentDto).userStatus ?? 0
        : (item as TmdbContentDto).user_status ?? 0;
    case "watchDate":
      return tab === "game"
        ? null
        : getDateSortValue((item as TmdbContentDto).last_watched_at);
    case "releaseDate":
      return tab === "game"
        ? getDateSortValue((item as GameContentDto).releaseDate)
        : getDateSortValue(
            (item as TmdbContentDto).first_air_date ||
              (item as TmdbContentDto).release_date,
          );
    case "platform":
      return tab === "game"
        ? (item as GameContentDto).userPlatform || ""
        : (item as TmdbContentDto).status || "";
    case "playtime":
      return tab === "game" ? (item as GameContentDto).userPlaytime ?? 0 : 0;
    case "completion":
      return tab === "game"
        ? (item as GameContentDto).completionType ?? GameCompletionType.None
        : 0;
    default:
      return "";
  }
}

export function useEntertainmentLibrary(t: any) {
  const [libraryData, setLibraryData] = useState<LibraryData>({
    tv: [],
    movie: [],
    game: [],
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>("tv");
  const [filterStatus, setFilterStatus] = useState<WatchStatus | 0>(
    WatchStatus.Watching,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnwatchedOnly, setShowUnwatchedOnly] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<
    TmdbContentDto | GameContentDto | null
  >(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<GameContentDto | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<TmdbContentDto | null>(
    null,
  );
  const [contentTypeToEdit, setContentTypeToEdit] = useState<"tv" | "movie">(
    "tv",
  );
  const [sortConfig, setSortConfig] = useState<{
    key: EntertainmentSortKey;
    direction: SortDirection;
  }>(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : { key: "title" as EntertainmentSortKey, direction: "asc" as SortDirection };
    } catch {
      return { key: "title", direction: "asc" };
    }
  });

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const data = await mediaApi.getLibrary();
        const gameData = await gamesApi.getLibrary();
        setLibraryData({ ...data, game: gameData });
      } finally {
        setLoading(false);
      }
    };

    void loadLibrary();
  }, []);

  useEffect(() => {
    if (activeTab === "tv") {
      setFilterStatus(WatchStatus.Watching);
    } else {
      setFilterStatus(0);
    }
  }, [activeTab]);

  const currentItems = useMemo(
    () =>
      activeTab === "tv"
        ? libraryData.tv
        : activeTab === "movie"
          ? libraryData.movie
          : libraryData.game,
    [activeTab, libraryData],
  );

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

  const filteredItems = useMemo(() => {
    return (filterStatus === 0
      ? currentItems
      : currentItems.filter((item) =>
          activeTab === "game"
            ? (item as GameContentDto).userStatus === filterStatus
            : (item as TmdbContentDto).user_status === filterStatus,
        ))
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
        const valueA = getSortableValue(a, activeTab, sortConfig.key);
        const valueB = getSortableValue(b, activeTab, sortConfig.key);

        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;

        if (typeof valueA === "string" && typeof valueB === "string") {
          const result = valueA.localeCompare(valueB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
          return sortConfig.direction === "asc" ? result : -result;
        }

        if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [activeTab, currentItems, filterStatus, searchQuery, showUnwatchedOnly, sortConfig]);

  const handleSort = (key: EntertainmentSortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key
          ? prev.direction === "asc"
            ? "desc"
            : "asc"
          : getDefaultDirection(key),
    }));
  };

  const handleRemoveClick = (item: TmdbContentDto | GameContentDto) => {
    setItemToRemove(item);
    setIsConfirmOpen(true);
  };

  const handleEditClick = (item: GameContentDto) => {
    setGameToEdit(item);
    setIsEditOpen(true);
  };

  const handleStatusEditClick = (item: TmdbContentDto, type: "tv" | "movie") => {
    setContentToEdit(item);
    setContentTypeToEdit(type);
    setIsStatusDialogOpen(true);
  };

  const handleSaveProgress = async (data: UpdateGameProgressDto) => {
    try {
      await gamesApi.updateProgress(data);
      toast.success(t("common:messages.save_success"));

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
      await mediaApi.updateProgress(data);
      toast.success(t("common:messages.save_success"));

      setLibraryData((prev) => ({
        ...prev,
        [data.type]: prev[data.type].map((item) =>
          item.id === data.tmdbId
            ? {
                ...item,
                user_status: data.status,
                user_rating: data.rating,
                user_review: data.review,
              }
            : item,
        ),
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
        await gamesApi.removeGame(itemToRemove.id);
      } else {
        await mediaApi.removeFromLibrary(itemToRemove.id, activeTab);
      }

      toast.success(t("common:messages.remove_from_library_success"));

      setLibraryData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((item) => item.id !== itemToRemove.id),
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
      const result = await mediaApi.watchNextEpisode(item.id);
      toast.success(
        t("entertainment:messages.watch_episode_success", {
          seasonNumber: result.seasonNumber,
          episodeNumber: result.episodeNumber,
        }),
      );

      setLibraryData((prev) => ({
        ...prev,
        tv: prev.tv.map((tvItem) =>
          tvItem.id === item.id
            ? {
                ...tvItem,
                last_watched_season: result.seasonNumber,
                last_watched_episode: result.episodeNumber,
                last_watched_at: new Date().toISOString(),
                user_status: result.newStatus ?? tvItem.user_status,
              }
            : tvItem,
        ),
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

  return {
    libraryData,
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    loading,
    loadingItems,
    searchQuery,
    setSearchQuery,
    showUnwatchedOnly,
    setShowUnwatchedOnly,
    isConfirmOpen,
    setIsConfirmOpen,
    itemToRemove,
    isEditOpen,
    setIsEditOpen,
    gameToEdit,
    isStatusDialogOpen,
    setIsStatusDialogOpen,
    contentToEdit,
    contentTypeToEdit,
    sortConfig,
    filteredItems,
    isUpToDate,
    handleSort,
    handleRemoveClick,
    handleEditClick,
    handleStatusEditClick,
    handleSaveProgress,
    handleSaveEntertainmentStatus,
    handleConfirmRemove,
    handleWatchNext,
  };
}
