import {
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface EntertainmentLibraryToolbarProps {
  title: string;
  activeTab: "tv" | "movie" | "game";
  viewMode: "grid" | "table";
  searchQuery: string;
  showUnwatchedOnly: boolean;
  libraryCounts: { tv: number; movie: number; game: number };
  labels: {
    searchPlaceholder: string;
    showAll: string;
    unwatchedEpisodes: string;
    gridView: string;
    tableView: string;
    tvShows: string;
    movies: string;
    games: string;
  };
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleUnwatchedOnly: () => void;
  onViewModeChange: (mode: "grid" | "table") => void;
  onActiveTabChange: (tab: "tv" | "movie" | "game") => void;
}

export default function EntertainmentLibraryToolbar({
  title,
  activeTab,
  viewMode,
  searchQuery,
  showUnwatchedOnly,
  libraryCounts,
  labels,
  onSearchChange,
  onClearSearch,
  onToggleUnwatchedOnly,
  onViewModeChange,
  onActiveTabChange,
}: EntertainmentLibraryToolbarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
      <h1 className="text-3xl font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="group relative">
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`peer rounded-full border border-skin-border bg-skin-surface py-2 text-sm transition-all duration-300 hover:bg-skin-surface/90 focus:border-skin-primary focus:outline-none ${
              searchQuery
                ? "w-64 pl-9 pr-4"
                : "w-9 cursor-pointer px-0 text-center placeholder-transparent focus:w-64 focus:pl-9 focus:pr-4 focus:text-left focus:placeholder-skin-muted"
            }`}
          />
          <MagnifyingGlassIcon
            className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-skin-text transition-all duration-300 group-hover:text-skin-primary ${
              searchQuery
                ? "left-3"
                : "left-1/2 -translate-x-1/2 peer-focus:left-3 peer-focus:translate-x-0"
            }`}
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-skin-muted hover:text-skin-text"
            >
              <span className="sr-only">Clear</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {activeTab === "tv" && (
          <button
            onClick={onToggleUnwatchedOnly}
            className={`rounded-full border p-2 transition ${
              showUnwatchedOnly
                ? "border-skin-primary bg-skin-primary text-white"
                : "border-skin-border bg-skin-surface hover:bg-skin-surface/90 hover:text-skin-primary"
            }`}
            title={showUnwatchedOnly ? labels.showAll : labels.unwatchedEpisodes}
          >
            {showUnwatchedOnly ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}

        <div className="relative flex rounded-lg border border-skin-border bg-skin-surface p-1">
          <div className="pointer-events-none absolute inset-0 p-1" aria-hidden>
            <div
              className="h-full w-1/2 rounded-md bg-skin-primary transition-transform duration-300 ease-out"
              style={{
                transform:
                  viewMode === "grid" ? "translateX(0%)" : "translateX(100%)",
              }}
            />
          </div>

          <button
            onClick={() => onViewModeChange("grid")}
            className={`relative z-10 flex-1 rounded-md p-2 transition ${
              viewMode === "grid"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
            title={labels.gridView}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>

          <button
            onClick={() => onViewModeChange("table")}
            className={`relative z-10 flex-1 rounded-md p-2 transition ${
              viewMode === "table"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
            title={labels.tableView}
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
        </div>

        <div className="relative flex rounded-lg border border-skin-border bg-skin-surface p-1">
          <div className="pointer-events-none absolute inset-0 p-1">
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
            onClick={() => onActiveTabChange("tv")}
            className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "tv"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {labels.tvShows}
            <span className="ml-2 rounded-full bg-skin-text/20 px-2 text-xs">
              {libraryCounts.tv}
            </span>
          </button>

          <button
            onClick={() => onActiveTabChange("movie")}
            className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "movie"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {labels.movies}
            <span className="ml-2 rounded-full bg-skin-text/20 px-2 text-xs">
              {libraryCounts.movie}
            </span>
          </button>

          <button
            onClick={() => onActiveTabChange("game")}
            className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "game"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {labels.games}
            <span className="ml-2 rounded-full bg-skin-text/20 px-2 text-xs">
              {libraryCounts.game}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
