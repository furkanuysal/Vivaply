import { useNavigate } from "react-router-dom";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { UniversalCoverFallback } from "@/shared/ui";
import SortableHeader, {
  type EntertainmentSortKey,
  type SortDirection,
} from "@/features/entertainment/components/library/SortableHeader";
import ProdStatusBadge from "@/features/entertainment/components/shared/ProdStatusBadge";
import type { GameContentDto, TmdbContentDto } from "@/features/entertainment/types";

interface EntertainmentLibraryTableProps {
  activeTab: "tv" | "movie" | "game";
  items: Array<TmdbContentDto | GameContentDto>;
  sortConfig: { key: EntertainmentSortKey; direction: SortDirection };
  statusConfig: Record<number, { label: string; badge: string }>;
  loadingItems: Set<number>;
  labels: {
    poster: string;
    title: string;
    averageRating: string;
    personalRating: string;
    lastWatched: string;
    latestEpisode: string;
    prodStatus: string;
    platform: string;
    playtime: string;
    completion: string;
    userStatus: string;
    watchDate: string;
    releaseDate: string;
    actions: string;
    update: string;
    removeFromLibrary: string;
    watchNext: string;
    watchedUpToDate: string;
    hoursShort: string;
  };
  onSort: (key: EntertainmentSortKey) => void;
  onEditGame: (item: GameContentDto) => void;
  onEditEntertainment: (item: TmdbContentDto, type: "tv" | "movie") => void;
  onRemove: (item: TmdbContentDto | GameContentDto) => void;
  onWatchNext: (item: TmdbContentDto) => void | Promise<void>;
  onIsUpToDate: (item: TmdbContentDto) => boolean;
  formatLatestEpisode: (latestEpisode?: string, isShort?: boolean) => string;
  formatLastWatched: (item: TmdbContentDto, isShort?: boolean) => string;
  getCompletionLabel: (completion?: GameContentDto["completionType"]) => string;
}

export default function EntertainmentLibraryTable({
  activeTab,
  items,
  sortConfig,
  statusConfig,
  loadingItems,
  labels,
  onSort,
  onEditGame,
  onEditEntertainment,
  onRemove,
  onWatchNext,
  onIsUpToDate,
  formatLatestEpisode,
  formatLastWatched,
  getCompletionLabel,
}: EntertainmentLibraryTableProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-skin-border shadow-xl">
      <table className="w-full table-fixed text-left text-sm text-skin-muted">
        <thead className="bg-skin-surface text-xs font-bold uppercase text-skin-text">
          <tr>
            <SortableHeader
              label={labels.poster}
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className="px-4 py-4"
            />
            <SortableHeader
              label={labels.title}
              sortKey="title"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className="px-4 py-4"
            />
            <SortableHeader
              label={labels.averageRating}
              sortKey="averageRating"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className="hidden px-4 py-4 md:table-cell"
            />
            <SortableHeader
              label={labels.personalRating}
              sortKey="userRating"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className={`px-4 py-4 ${
                activeTab === "movie" || activeTab === "game"
                  ? ""
                  : "hidden md:table-cell"
              }`}
            />
            <SortableHeader
              label={labels.lastWatched}
              sortKey="lastWatched"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className={`px-4 py-4 ${
                activeTab === "movie" || activeTab === "game" ? "hidden" : ""
              }`}
            />
            <SortableHeader
              label={labels.latestEpisode}
              sortKey="latestEpisode"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className={`px-4 py-4 ${
                activeTab === "movie" || activeTab === "game" ? "hidden" : ""
              }`}
            />
            <SortableHeader
              label={activeTab === "game" ? labels.platform : labels.prodStatus}
              sortKey="platform"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className="hidden px-4 py-4 md:table-cell"
            />
            {activeTab === "game" && (
              <>
                <SortableHeader
                  label={labels.playtime}
                  sortKey="playtime"
                  activeSortKey={sortConfig.key}
                  direction={sortConfig.direction}
                  onSort={onSort}
                  className="hidden px-4 py-4 md:table-cell"
                />
                <SortableHeader
                  label={labels.completion}
                  sortKey="completion"
                  activeSortKey={sortConfig.key}
                  direction={sortConfig.direction}
                  onSort={onSort}
                  className="hidden px-4 py-4 md:table-cell"
                />
              </>
            )}
            <SortableHeader
              label={labels.userStatus}
              sortKey="status"
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className={`px-4 py-4 ${
                activeTab === "movie" || activeTab === "game"
                  ? ""
                  : "hidden md:table-cell"
              }`}
            />
            {activeTab === "movie" && (
              <SortableHeader
                label={labels.watchDate}
                sortKey="watchDate"
                activeSortKey={sortConfig.key}
                direction={sortConfig.direction}
                onSort={onSort}
                className="hidden px-4 py-4 md:table-cell"
              />
            )}
            {activeTab !== "game" && (
              <SortableHeader
                label={labels.releaseDate}
                sortKey="releaseDate"
                activeSortKey={sortConfig.key}
                direction={sortConfig.direction}
                onSort={onSort}
                className="hidden px-4 py-4 md:table-cell"
              />
            )}
            <SortableHeader
              label={labels.actions}
              activeSortKey={sortConfig.key}
              direction={sortConfig.direction}
              onSort={onSort}
              className="px-4 py-4 text-right"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-skin-border bg-skin-base/50">
          {items.map((item: any) => {
            const posterPath =
              activeTab === "game" ? item.coverUrl : item.poster_path;
            const title =
              activeTab === "game" ? item.title : item.display_name;
            const voteAverage =
              activeTab === "game" ? item.voteAverage : item.vote_average;
            const userRating =
              activeTab === "game" ? item.userRating : item.user_rating;
            const userStatus =
              activeTab === "game" ? item.userStatus : item.user_status;
            const dateStr =
              activeTab === "game" ? item.releaseDate : item.display_date;
            const tagline = activeTab === "game" ? null : item.tagline;

            return (
              <tr
                key={item.id}
                className="group cursor-pointer transition hover:bg-skin-surface/50"
                onClick={() => navigate(`/entertainment/${activeTab}/${item.id}`)}
              >
                <td className="w-20 px-4 py-3">
                  {posterPath ? (
                    <img
                      src={
                        posterPath.startsWith("http")
                          ? posterPath
                          : `https://image.tmdb.org/t/p/w92${posterPath}`
                      }
                      alt={title}
                      className="h-18 w-12 rounded-md object-cover shadow-md transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-12 overflow-hidden rounded-md shadow-md transition group-hover:scale-105">
                      <UniversalCoverFallback
                        title={title}
                        type={activeTab}
                        variant="compact"
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-base font-medium text-skin-text">
                  {title}
                  {tagline && (
                    <p className="mt-1 line-clamp-1 text-xs font-normal text-skin-muted">
                      {tagline}
                    </p>
                  )}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="font-bold text-skin-accent">
                    {"\u2605"} {(voteAverage || 0).toFixed(1)}
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
                    <span className="font-bold text-skin-primary">
                      {"\u2605"} {Number(userRating).toFixed(1)}
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
                        {formatLastWatched(item, true)}
                      </span>
                      <span className="hidden md:inline">
                        {formatLastWatched(item, false)}
                      </span>
                    </span>
                    {onIsUpToDate(item) ? (
                      <CheckCircleIcon
                        className="h-6 w-6 flex-shrink-0 text-skin-secondary"
                        title={labels.watchedUpToDate}
                      />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void onWatchNext(item);
                        }}
                        disabled={loadingItems.has(item.id)}
                        className="text-skin-accent transition hover:text-skin-accent/80 disabled:opacity-50"
                        title={labels.watchNext}
                      >
                        {loadingItems.has(item.id) ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-skin-accent border-t-transparent"></div>
                        ) : (
                          <PlusCircleIcon className="h-6 w-6 hover:scale-105" />
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
                    {formatLatestEpisode(item.latest_episode, true)}
                  </span>
                  <span className="hidden md:inline">
                    {formatLatestEpisode(item.latest_episode, false)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {activeTab === "game" ? (
                    <span>{item.userPlatform || "-"}</span>
                  ) : (
                    <ProdStatusBadge status={item.status} />
                  )}
                </td>
                {activeTab === "game" && (
                  <>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {item.userPlaytime
                        ? `${item.userPlaytime} ${labels.hoursShort}`
                        : "-"}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
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
                    className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${
                      statusConfig[userStatus]?.badge ?? ""
                    }`}
                  >
                    {statusConfig[userStatus]?.label}
                  </span>
                </td>
                {activeTab === "movie" && (
                  <td className="hidden px-4 py-3 md:table-cell">
                    {item.last_watched_at
                      ? new Date(item.last_watched_at).toLocaleDateString()
                      : "-"}
                  </td>
                )}
                {activeTab !== "game" && (
                  <td className="hidden px-4 py-3 md:table-cell">
                    {dateStr?.split("-")[0] || "-"}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  {activeTab === "game" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGame(item as GameContentDto);
                      }}
                      className="rounded-full p-2 text-skin-muted transition hover:bg-skin-surface hover:text-skin-primary"
                      title={labels.update}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntertainment(
                          item as TmdbContentDto,
                          activeTab as "tv" | "movie",
                        );
                      }}
                      className="rounded-full p-2 text-skin-muted transition hover:bg-skin-surface hover:text-skin-primary"
                      title={labels.update}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item);
                    }}
                    className="rounded-full p-2 text-skin-muted transition hover:bg-skin-surface hover:text-red-500"
                    title={labels.removeFromLibrary}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
