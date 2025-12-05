import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { booksService } from "../features/knowledge/services/booksService";
import BookCard from "../features/knowledge/components/BookCard";
import { type BookContentDto, ReadStatus } from "../features/knowledge/types";

export default function BookLibraryPage() {
  const navigate = useNavigate();

  // Kitap Verisi (Tek liste, TV/Movie ayrımı yok)
  const [books, setBooks] = useState<BookContentDto[]>([]);

  const [filterStatus, setFilterStatus] = useState<ReadStatus | 0>(
    ReadStatus.Reading
  ); // Varsayılan: Okuduklarım
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Kütüphaneyi Çek
  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await booksService.getLibrary();
      setBooks(data);
    } catch (error) {
      toast.error("Kütüphane yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  // Manuel Yenileme (Refresh)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await booksService.getLibrary();
      setBooks(data);
      toast.success("Liste yenilendi.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtreleme Mantığı
  const filteredItems =
    filterStatus === 0
      ? books
      : books.filter((item) => item.userStatus === filterStatus);

  // Filtre Seçenekleri
  const FILTERS = [
    { label: "Hepsi", value: 0 },
    { label: "Okuyorum", value: ReadStatus.Reading },
    { label: "Okuyacağım", value: ReadStatus.PlanToRead },
    { label: "Bitti", value: ReadStatus.Completed },
    { label: "Yarım Bıraktım", value: ReadStatus.Dropped },
    { label: "Ara Verdim", value: ReadStatus.OnHold },
  ];

  // Helper: Status Metni
  const getStatusLabel = (status: number) => {
    switch (status) {
      case ReadStatus.PlanToRead:
        return "Listemde";
      case ReadStatus.Reading:
        return "Okuyorum";
      case ReadStatus.Completed:
        return "Bitti";
      case ReadStatus.OnHold:
        return "Ara Verdim";
      case ReadStatus.Dropped:
        return "Bıraktım";
      default:
        return "-";
    }
  };

  // Helper: Status Rengi
  const getStatusColor = (status: number) => {
    switch (status) {
      case ReadStatus.Reading:
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case ReadStatus.PlanToRead:
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case ReadStatus.Completed:
        return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case ReadStatus.Dropped:
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case ReadStatus.OnHold:
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Kitaplığım</h1>
          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-sm font-mono border border-gray-700">
            {books.length} Kitap
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
            title="Listeyi Yenile"
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
              title="Izgara Görünümü"
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
              title="Tablo Görünümü"
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

      {/* Filtreler */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
        {FILTERS.map((filter) => (
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
              // GRID GÖRÜNÜMÜ (BookCard Kullanır)
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredItems.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              // TABLO GÖRÜNÜMÜ
              <div className="w-full overflow-x-auto rounded-xl border border-gray-700 shadow-xl">
                <table className="w-full table-fixed text-left text-sm text-gray-400">
                  <thead className="bg-gray-800 text-gray-200 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-4 py-4 w-24">Kapak</th>
                      <th className="px-4 py-4 w-1/3">Kitap</th>
                      <th className="px-4 py-4 hidden md:table-cell">Yazar</th>
                      <th className="px-4 py-4">Puanım</th>
                      <th className="px-4 py-4">İlerleme</th>
                      <th className="px-4 py-4">Durum</th>
                      <th className="px-4 py-4 text-right">İşlem</th>
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
                          onClick={() => navigate(`/books/${book.id}`)}
                        >
                          {/* Kapak */}
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

                          {/* Başlık */}
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

                          {/* Yazar */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            {book.authors.slice(0, 2).join(", ")}
                          </td>

                          {/* Puan */}
                          <td className="px-4 py-3">
                            {book.userRating ? (
                              <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">
                                ★ {book.userRating}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>

                          {/* İlerleme Barı ve Sayfa */}
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

                          {/* Durum */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                                book.userStatus
                              )}`}
                            >
                              {getStatusLabel(book.userStatus)}
                            </span>
                          </td>

                          {/* İşlem */}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/books/${book.id}`);
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              Detay
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
            <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
              <p className="text-gray-400 text-lg">
                Kütüphanende henüz hiç kitap yok.
              </p>
              <button
                onClick={() => navigate("/books")}
                className="mt-4 text-blue-400 hover:underline"
              >
                Kitap Keşfet
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
