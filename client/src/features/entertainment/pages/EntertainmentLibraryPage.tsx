import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EntertainmentLibraryDialogs from "@/features/entertainment/components/library/EntertainmentLibraryDialogs";
import EntertainmentLibraryGrid from "@/features/entertainment/components/library/EntertainmentLibraryGrid";
import EntertainmentLibraryTable from "@/features/entertainment/components/library/EntertainmentLibraryTable";
import EntertainmentLibraryToolbar from "@/features/entertainment/components/library/EntertainmentLibraryToolbar";
import { useEntertainmentLibrary } from "@/features/entertainment/hooks/useEntertainmentLibrary";
import { usePlayStatusConfig } from "@/features/entertainment/hooks/usePlayStatusConfig";
import { useWatchStatusConfig } from "@/features/entertainment/hooks/useWatchStatusConfig";
import { GameCompletionType, type TmdbContentDto } from "@/features/entertainment/types";

export default function EntertainmentLibraryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["entertainment", "common"]);
  const {
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
  } = useEntertainmentLibrary(t);

  const removeDialogTitle = itemToRemove
    ? "display_name" in itemToRemove
      ? itemToRemove.display_name || itemToRemove.title || ""
      : itemToRemove.title || ""
    : "";

  const {
    STATUS_CONFIG: WATCH_STATUS_CONFIG,
    FILTER_OPTIONS: WATCH_FILTER_OPTIONS,
  } = useWatchStatusConfig(activeTab !== "game" ? activeTab : "tv");
  const {
    STATUS_CONFIG: PLAY_STATUS_CONFIG,
    FILTER_OPTIONS: PLAY_FILTER_OPTIONS,
  } = usePlayStatusConfig();

  const STATUS_CONFIG: any =
    activeTab === "game" ? PLAY_STATUS_CONFIG : WATCH_STATUS_CONFIG;
  const FILTER_OPTIONS =
    activeTab === "game" ? PLAY_FILTER_OPTIONS : WATCH_FILTER_OPTIONS;

  const formatLatestEpisode = (latestEpisode?: string, isShort = false) => {
    if (!latestEpisode) return "-";

    const match = latestEpisode.match(/S\s*(\d+)\s*E\s*(\d+)/i);
    if (!match) return latestEpisode;

    return t(
      isShort
        ? "entertainment:format.season_episode_short"
        : "entertainment:format.season_episode",
      {
        season: Number(match[1]),
        episode: Number(match[2]),
      },
    );
  };

  const formatLastWatched = (item: TmdbContentDto, isShort = false) => {
    if (item.last_watched_season == null || item.last_watched_episode == null) {
      return "-";
    }

    return t(
      isShort
        ? "entertainment:format.season_episode_short"
        : "entertainment:format.season_episode",
      {
        season: item.last_watched_season,
        episode: item.last_watched_episode,
      },
    );
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
      <EntertainmentLibraryToolbar
        title={t("entertainment:library.title")}
        activeTab={activeTab}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showUnwatchedOnly={showUnwatchedOnly}
        libraryCounts={{
          tv: libraryData.tv.length,
          movie: libraryData.movie.length,
          game: libraryData.game.length,
        }}
        labels={{
          searchPlaceholder: t("common:buttons.search") || "Search...",
          showAll: t("entertainment:library.show_all"),
          unwatchedEpisodes: t("entertainment:library.unwatched_episodes"),
          gridView: t("common:buttons.grid_view"),
          tableView: t("common:buttons.table_view"),
          tvShows: t("entertainment:common.tv_shows"),
          movies: t("entertainment:common.movies"),
          games: t("entertainment:common.games"),
        }}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        onToggleUnwatchedOnly={() => setShowUnwatchedOnly((prev) => !prev)}
        onViewModeChange={setViewMode}
        onActiveTabChange={setActiveTab}
      />

      <div className="flex flex-wrap gap-2 pb-2">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as any)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
              filterStatus === filter.value
                ? "border-skin-primary bg-skin-surface text-skin-primary"
                : "border-skin-border bg-transparent text-skin-muted hover:border-skin-text"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        viewMode === "grid" ? (
          <EntertainmentLibraryGrid activeTab={activeTab} items={filteredItems} />
        ) : (
          <EntertainmentLibraryTable
            activeTab={activeTab}
            items={filteredItems}
            sortConfig={sortConfig}
            statusConfig={STATUS_CONFIG}
            loadingItems={loadingItems}
            labels={{
              poster: t("entertainment:library.table.poster"),
              title: t("entertainment:library.table.title"),
              averageRating: t("entertainment:library.table.average_rating"),
              personalRating: t("entertainment:library.table.personal_rating"),
              lastWatched: t("entertainment:library.table.last_watched"),
              latestEpisode: t("entertainment:library.table.latest_episode"),
              prodStatus: t("entertainment:library.table.prod_status"),
              platform: t("entertainment:games.platform"),
              playtime: t("entertainment:games.playtime"),
              completion: t("entertainment:games.completion"),
              userStatus: t("entertainment:library.table.user_status"),
              watchDate: t("entertainment:library.table.watch_date"),
              releaseDate: t("entertainment:library.table.release_date"),
              actions: t("entertainment:library.table.actions") || "Actions",
              update: t("common:buttons.update"),
              removeFromLibrary: t("common:buttons.remove_from_library"),
              watchNext: t("entertainment:library.table.watch_next"),
              watchedUpToDate: t(
                "entertainment:library.table.watched_up_to_date",
              ),
              hoursShort: t("entertainment:games.hours_short"),
            }}
            onSort={handleSort}
            onEditGame={handleEditClick}
            onEditEntertainment={handleStatusEditClick}
            onRemove={handleRemoveClick}
            onWatchNext={handleWatchNext}
            onIsUpToDate={isUpToDate}
            formatLatestEpisode={formatLatestEpisode}
            formatLastWatched={formatLastWatched}
            getCompletionLabel={getCompletionLabel}
          />
        )
      ) : (
        <div className="rounded-2xl border border-skin-border/50 bg-skin-surface/30 py-20 text-center">
          <p className="text-lg text-skin-muted">
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

      <EntertainmentLibraryDialogs
        isConfirmOpen={isConfirmOpen}
        isEditOpen={isEditOpen}
        isStatusDialogOpen={isStatusDialogOpen}
        removeDialogTitle={`${t("common:dialogs.remove_from_library_title")}: ${removeDialogTitle}`}
        confirmMessage={t("common:dialogs.remove_from_library_message")}
        gameToEdit={gameToEdit}
        contentToEdit={contentToEdit}
        contentTypeToEdit={contentTypeToEdit}
        onCloseConfirm={() => setIsConfirmOpen(false)}
        onConfirmRemove={handleConfirmRemove}
        onCloseEdit={() => setIsEditOpen(false)}
        onCloseStatus={() => setIsStatusDialogOpen(false)}
        onSaveProgress={handleSaveProgress}
        onSaveStatus={handleSaveEntertainmentStatus}
      />
    </div>
  );
}
