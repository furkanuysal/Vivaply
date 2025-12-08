import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { booksService } from "../features/knowledge/services/booksService";
import BookCard from "../features/knowledge/components/BookCard";
import { type BookContentDto, ReadStatus } from "../features/knowledge/types";
import { useTranslation } from "react-i18next";
import { useReadStatusConfig } from "../features/knowledge/hooks/useReadStatusConfig";

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

  const { STATUS_CONFIG, FILTER_OPTIONS } = useReadStatusConfig();

  // Load Library
  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await booksService.getLibrary();
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
      const data = await booksService.getLibrary();
      setBooks(data);
      toast.success(t("common:messages.library_content_refreshed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter Logic
  const filteredItems =
    filterStatus === 0
      ? books
      : books.filter((item) => item.userStatus === filterStatus);

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            {t("knowledge:books.library.title")}
          </h1>
          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-sm font-mono border border-gray-700">
            {books.length} {t("knowledge:books.library.book")}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition ${
              isRefreshing
                ? "animate-spin cursor-not-allowed opacity-50"
                : "hover:text-blue-400"
            }`}
            title={t("common:buttons.refresh_library")}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>

          {/* View Toggle Buttons */}
          <div className="bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
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
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
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
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as any)}
            className={`px-4 py-2 rounded-full text-sm border transition whitespace-nowrap
                ${
                  filterStatus === filter.value
                    ? "bg-gray-700 border-gray-500 text-white"
                    : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500"
                }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
              <div className="w-full overflow-x-auto rounded-xl border border-gray-700 shadow-xl">
                <table className="w-full table-fixed text-left text-sm text-gray-400">
                  <thead className="bg-gray-800 text-gray-200 uppercase font-bold text-xs">
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
                  <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                    {filteredItems.map((book) => {
                      const progress =
                        book.pageCount > 0
                          ? Math.round(
                              (book.currentPage / book.pageCount) * 100
                            )
                          : 0;

                      return (
                        <tr
                          key={book.id}
                          className="hover:bg-gray-800/50 transition cursor-pointer group"
                          onClick={() =>
                            navigate(`/knowledge/books/${book.id}`)
                          }
                        >
                          {/* Cover */}
                          <td className="px-4 py-3">
                            <img
                              src={
                                book.coverUrl?.replace("http:", "https:") ||
                                "https://via.placeholder.com/128x192"
                              }
                              alt={book.title}
                              className="w-12 h-18 rounded shadow-md object-cover group-hover:scale-105 transition"
                            />
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3 font-medium text-white">
                            <div className="line-clamp-2 text-base">
                              {book.title}
                            </div>
                            {book.publishedDate && (
                              <span className="text-xs text-gray-500">
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
                              <span className="text-blue-400 font-bold">
                                ★ {book.userRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>

                          {/* Progress Bar and Page */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 min-w-[100px]">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-300">
                                  {book.currentPage} / {book.pageCount}
                                </span>
                                <span className="text-gray-500">
                                  {progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    book.userStatus === ReadStatus.Completed
                                      ? "bg-purple-500"
                                      : "bg-green-500"
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
                                "text-gray-400 bg-gray-400/10 border-gray-400/20"
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
            <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
              <p className="text-gray-400 text-lg">
                {t("knowledge:books.library.no_content")}
              </p>
              <button
                onClick={() => navigate("/books")}
                className="mt-4 text-blue-400 hover:underline"
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
