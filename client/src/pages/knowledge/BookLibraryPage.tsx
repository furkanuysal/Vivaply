import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { bookService } from "@/features/knowledge/services/bookService";
import BookCard from "@/features/knowledge/components/BookCard";
import { type BookContentDto, ReadStatus } from "@/features/knowledge/types";
import { useTranslation } from "react-i18next";
import { useReadStatusConfig } from "@/features/knowledge/hooks/useReadStatusConfig";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";

export default function BookLibraryPage() {
  const navigate = useNavigate();

  // Book data
  const [books, setBooks] = useState<BookContentDto[]>([]);
  const { t } = useTranslation(["common", "knowledge"]);

  const [filterStatus, setFilterStatus] = useState<ReadStatus | 0>(
    ReadStatus.Reading
  ); // Default: Reading
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { STATUS_CONFIG, FILTER_OPTIONS } = useReadStatusConfig();

  // Load Library
  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await bookService.getLibrary();
      setBooks(data);
    } catch (error) {
      toast.error(t("common:messages.library_couldnt_load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  // Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await bookService.getLibrary();
      setBooks(data);
      toast.success(t("common:messages.library_content_refreshed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter Logic
  const filteredItems = (
    filterStatus === 0
      ? books
      : books.filter((item) => item.userStatus === filterStatus)
  ).filter((item) => {
    if (!searchQuery) return true;
    return item.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in text-skin-text">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            {t("knowledge:books.library.title")}
          </h1>
          <span className="bg-skin-surface text-skin-muted px-3 py-1 rounded-full text-sm font-mono border border-skin-border">
            {books.length} {t("knowledge:books.library.book")}
          </span>
        </div>

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

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full bg-skin-surface hover:bg-skin-surface/80 border border-skin-border transition ${
              isRefreshing
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-skin-border">
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
              // GRID VIEW (BookCard Component)
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredItems.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              // TABLE VIEW
              <div className="w-full overflow-x-auto rounded-xl border border-skin-border shadow-xl">
                <table className="w-full table-fixed text-left text-sm text-skin-muted">
                  <thead className="bg-skin-surface text-skin-text uppercase font-bold text-xs">
                    <tr>
                      <th className="px-4 py-4 w-24">
                        {t("knowledge:books.library.cover")}
                      </th>
                      <th className="px-4 py-4 w-1/3">
                        {t("knowledge:books.library.book")}
                      </th>
                      <th className="px-4 py-4 hidden md:table-cell">
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
                          className="hover:bg-skin-base/50 transition cursor-pointer group"
                          onClick={() => navigate(`/knowledge/book/${book.id}`)}
                        >
                          {/* Cover */}
                          <td className="px-4 py-3">
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl.replace("http:", "https:")}
                                alt={book.title}
                                className="w-12 h-18 rounded shadow-md object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-12 aspect-[2/3] rounded shadow-md overflow-hidden group-hover:scale-105 transition">
                                <UniversalCoverFallback
                                  title={book.title}
                                  type="book"
                                  variant="compact"
                                />
                              </div>
                            )}
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3 font-medium text-skin-text">
                            <div className="line-clamp-2 text-base">
                              {book.title}
                            </div>
                            {book.publishedDate && (
                              <span className="text-xs text-skin-muted">
                                {book.publishedDate.split("-")[0]}
                              </span>
                            )}
                          </td>

                          {/* Author */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            {book.authors.slice(0, 2).join(", ")}
                          </td>

                          {/* Rating */}
                          <td className="px-4 py-3">
                            {book.userRating ? (
                              <span className="text-skin-primary font-bold">
                                ★ {book.userRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-skin-muted">-</span>
                            )}
                          </td>

                          {/* Progress Bar and Page */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 min-w-[100px]">
                              <div className="flex justify-between text-xs">
                                <span className="text-skin-text">
                                  {book.currentPage} / {book.pageCount}
                                </span>
                                <span className="text-skin-muted">
                                  {progress}%
                                </span>
                              </div>
                              <div className="w-full bg-skin-base rounded-full h-1.5">
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

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                STATUS_CONFIG[book.userStatus]?.badge ??
                                "text-skin-muted bg-skin-base/10 border-skin-border/20"
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
            <div className="text-center py-20 bg-skin-surface/30 rounded-2xl border border-skin-border/50">
              <p className="text-skin-muted text-lg">
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
        </>
      )}
    </div>
  );
}
