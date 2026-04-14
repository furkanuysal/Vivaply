import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { UniversalCoverFallback } from "@/shared/ui";
import { BookCard } from "@/features/knowledge/components/cards";
import { useBookLibrary } from "@/features/knowledge/hooks/useBookLibrary";
import { useReadStatusConfig } from "@/features/knowledge/hooks/useReadStatusConfig";
import { ReadStatus } from "@/features/knowledge/types";

export default function BookLibraryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "knowledge"]);
  const { STATUS_CONFIG, FILTER_OPTIONS } = useReadStatusConfig();
  const {
    books,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    loading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    filteredItems,
    handleRefresh,
  } = useBookLibrary({
    onLoadError: () => t("common:messages.library_couldnt_load"),
    onRefreshSuccess: () => t("common:messages.library_content_refreshed"),
  });

  return (
    <div className="space-y-8 animate-fade-in text-skin-text">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            {t("knowledge:books.library.title")}
          </h1>
          <span className="rounded-full border border-skin-border bg-skin-surface px-3 py-1 font-mono text-sm text-skin-muted">
            {books.length} {t("knowledge:books.library.book")}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="group relative">
            <input
              type="text"
              placeholder={t("common:buttons.search") || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`rounded-full border border-skin-border bg-skin-surface py-2 text-sm transition-all duration-300 hover:bg-skin-surface/90 focus:border-skin-primary focus:outline-none ${
                searchQuery
                  ? "w-64 pl-9 pr-4"
                  : "w-9 cursor-pointer px-0 text-center placeholder-transparent focus:w-64 focus:pl-9 focus:pr-4 focus:text-left focus:placeholder-skin-muted"
              }`}
            />
            <MagnifyingGlassIcon
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-skin-text transition-all duration-300 group-hover:text-skin-primary ${
                searchQuery ? "left-3" : "left-1/2 -translate-x-1/2"
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
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`rounded-full border border-skin-border bg-skin-surface p-2 transition hover:bg-skin-surface/80 ${
              isRefreshing
                ? "cursor-not-allowed animate-spin opacity-50"
                : "hover:text-skin-primary"
            }`}
            title={t("common:buttons.refresh_library")}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <div className="flex gap-1 rounded-lg border border-skin-border bg-skin-surface p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition ${
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
              className={`rounded-md p-2 transition ${
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
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-skin-border">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as ReadStatus | 0)}
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6">
            {filteredItems.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-skin-border shadow-xl">
            <table className="w-full table-fixed text-left text-sm text-skin-muted">
              <thead className="bg-skin-surface text-xs font-bold uppercase text-skin-text">
                <tr>
                  <th className="w-24 px-4 py-4">
                    {t("knowledge:books.library.cover")}
                  </th>
                  <th className="w-1/3 px-4 py-4">
                    {t("knowledge:books.library.book")}
                  </th>
                  <th className="hidden px-4 py-4 md:table-cell">
                    {t("knowledge:books.library.author")}
                  </th>
                  <th className="px-4 py-4">
                    {t("knowledge:books.library.personal_rating")}
                  </th>
                  <th className="px-4 py-4">
                    {t("knowledge:books.library.progress")}
                  </th>
                  <th className="px-4 py-4">
                    {t("knowledge:books.library.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-skin-border/50 bg-skin-surface/50">
                {filteredItems.map((book) => {
                  const pageCount = book.pageCount ?? 0;
                  const progress =
                    pageCount > 0
                      ? Math.round((book.currentPage / pageCount) * 100)
                      : 0;

                  return (
                    <tr
                      key={book.id}
                      className="group cursor-pointer transition hover:bg-skin-base/50"
                      onClick={() => navigate(`/knowledge/book/${book.id}`)}
                    >
                      <td className="px-4 py-3">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl.replace("http:", "https:")}
                            alt={book.title}
                            className="h-18 w-12 rounded object-cover shadow-md transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="aspect-[2/3] w-12 overflow-hidden rounded shadow-md transition group-hover:scale-105">
                            <UniversalCoverFallback
                              title={book.title}
                              type="book"
                              variant="compact"
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium text-skin-text">
                        <div className="line-clamp-2 text-base">{book.title}</div>
                        {book.publishedDate && (
                          <span className="text-xs text-skin-muted">
                            {book.publishedDate.split("-")[0]}
                          </span>
                        )}
                      </td>

                      <td className="hidden px-4 py-3 md:table-cell">
                        {book.authors.slice(0, 2).join(", ")}
                      </td>

                      <td className="px-4 py-3">
                        {book.userRating ? (
                          <span className="font-bold text-skin-primary">
                            {"\u2605"} {book.userRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-skin-muted">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex min-w-[100px] flex-col gap-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-skin-text">
                              {book.currentPage} / {book.pageCount}
                            </span>
                            <span className="text-skin-muted">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-skin-base">
                            <div
                              className={`h-1.5 rounded-full ${
                                book.userStatus === ReadStatus.Completed
                                  ? "bg-skin-secondary"
                                  : "bg-skin-primary"
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            STATUS_CONFIG[book.userStatus]?.badge ??
                            "border-skin-border/20 bg-skin-base/10 text-skin-muted"
                          }`}
                        >
                          {STATUS_CONFIG[book.userStatus]?.label ?? "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-skin-border/50 bg-skin-surface/30 py-20 text-center">
          <p className="text-lg text-skin-muted">
            {t("knowledge:books.library.no_content")}
          </p>
          <button
            onClick={() => navigate("/knowledge")}
            className="mt-4 text-skin-primary hover:underline"
          >
            {t("knowledge:books.discover_books")}
          </button>
        </div>
      )}
    </div>
  );
}
