import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { entertainmentService } from "../features/entertainment/services/entertainmentService";
import MediaCard from "../features/entertainment/components/MediaCard";
import ProdStatusBadge from "../features/entertainment/components/ProdStatusBadge";
import type { TmdbContentDto } from "../features/entertainment/types";
import { WatchStatus } from "../features/entertainment/types";
import { useWatchStatusConfig } from "../features/entertainment/hooks/useWatchStatusConfig";

export default function EntertainmentLibraryPage() {
  const navigate = useNavigate();
  const [libraryData, setLibraryData] = useState<{
    tv: TmdbContentDto[];
    movie: TmdbContentDto[];
  }>({ tv: [], movie: [] });
  const [activeTab, setActiveTab] = useState<"tv" | "movie">("tv");

  const [filterStatus, setFilterStatus] = useState<WatchStatus | 0>(
    WatchStatus.Watching
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

  const handleWatchNext = async (item: TmdbContentDto) => {
    setLoadingItems((prev) => new Set(prev).add(item.id));
    try {
      const result = await entertainmentService.watchNextEpisode(item.id);
      toast.success(result.message);

      // Update local state
      setLibraryData((prev) => ({
        ...prev,
        tv: prev.tv.map((tvItem) => {
          if (tvItem.id === item.id) {
            return {
              ...tvItem,
              last_watched: `S${result.season} E${result.episode}`,
              user_status: result.newStatus
                ? result.newStatus
                : tvItem.user_status,
            };
          }
          return tvItem;
        }),
      }));
    } catch (error: any) {
      toast.error(error.response?.data || "İşlem başarısız.");
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
      await entertainmentService.syncLibrary();
      toast.success("Kütüphane güncellendi! 🔄");

      // Verileri tekrar çekip ekrana yansıt
      const data = await entertainmentService.getLibrary();
      setLibraryData(data);
    } catch (error) {
      toast.error("Güncelleme başarısız.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const data = await entertainmentService.getLibrary();
        setLibraryData(data);
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, []);

  // Sekme değişince filtreyi ayarla
  useEffect(() => {
    if (activeTab === "tv") {
      setFilterStatus(WatchStatus.Watching);
    } else {
      setFilterStatus(0);
    }
  }, [activeTab]);

  const currentItems = activeTab === "tv" ? libraryData.tv : libraryData.movie;

  const { STATUS_CONFIG, FILTER_OPTIONS, STATUS_ORDER } =
    useWatchStatusConfig(activeTab);

  const filteredItems = (
    filterStatus === 0
      ? currentItems
      : currentItems.filter((item) => item.user_status === filterStatus)
  ).sort((a, b) => {
    const orderA = STATUS_ORDER[a.user_status] || 99;
    const orderB = STATUS_ORDER[b.user_status] || 99;
    return orderA - orderB;
  });

  // Helper: Episode String Formatter (S4 E23 -> 4. Sezon 23. Bölüm)
  const formatEpisodeString = (epString?: string) => {
    if (!epString) return "-";
    // Regex ile S ve E harflerinden sonraki sayıları yakala
    const match = epString.match(/S(\d+)\s*E(\d+)/i);
    if (match) {
      return `${match[1]}. Sezon ${match[2]}. Bölüm`;
    }
    return epString; // Format uymazsa olduğu gibi döndür
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold">Kütüphanem</h1>

        <div className="flex items-center gap-4">
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition ${
              isSyncing
                ? "animate-spin cursor-not-allowed opacity-50"
                : "hover:text-blue-400"
            }`}
            title="Kütüphaneyi Güncelle"
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

          <div className="bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-700">
            <button
              onClick={() => setActiveTab("tv")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "tv"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Dizilerim{" "}
              <span className="ml-2 bg-black/20 px-2 rounded-full text-xs">
                {libraryData.tv.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("movie")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "movie"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Filmlerim{" "}
              <span className="ml-2 bg-black/20 px-2 rounded-full text-xs">
                {libraryData.movie.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 👇 BURADA statusFilters KULLANIYORUZ */}
      <div className="flex flex-wrap gap-2 pb-2">
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
              // GRID VIEW
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredItems.map((item) => (
                  <MediaCard key={item.id} content={item} type={activeTab} />
                ))}
              </div>
            ) : (
              // TABLE VIEW
              <div className="w-full overflow-x-auto rounded-xl border border-gray-700 shadow-xl">
                <table className="w-full table-fixed text-left text-sm text-gray-400">
                  <thead className="bg-gray-800 text-gray-200 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-4 py-4">Afiş</th>
                      <th className="px-4 py-4">Başlık</th>
                      <th className="px-4 py-4 hidden md:table-cell">
                        Genel Puan
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" ? "" : "hidden md:table-cell"
                        }`}
                      >
                        Puanım
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" ? "hidden" : ""
                        }`}
                      >
                        Son İzlenen
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" ? "hidden" : ""
                        }`}
                      >
                        Son Çıkan
                      </th>
                      <th className="px-4 py-4 hidden md:table-cell">
                        Yapım Durumu
                      </th>
                      <th
                        className={`px-4 py-4 ${
                          activeTab === "movie" ? "" : "hidden md:table-cell"
                        }`}
                      >
                        Durum
                      </th>
                      <th className="px-4 py-4 hidden md:table-cell">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-800/50 transition cursor-pointer group"
                        onClick={() =>
                          navigate(`/entertainment/${activeTab}/${item.id}`)
                        }
                      >
                        <td className="px-4 py-3 w-20">
                          <img
                            src={
                              item.poster_path
                                ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                                : "https://via.placeholder.com/92x138"
                            }
                            alt={item.display_name}
                            className="w-12 h-18 rounded-md shadow-md object-cover group-hover:scale-105 transition"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-white text-base">
                          {item.display_name}
                          {item.tagline && (
                            <p className="text-xs text-gray-500 font-normal mt-1 line-clamp-1">
                              {item.tagline}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-yellow-400 font-bold">
                            ★ {(item.vote_average || 0).toFixed(1)}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 ${
                            activeTab === "movie" ? "" : "hidden md:table-cell"
                          }`}
                        >
                          {item.user_rating ? (
                            <span className="text-blue-400 font-bold">
                              ★ {Number(item.user_rating).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-gray-300 ${
                            activeTab === "movie" ? "hidden" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              <span className="md:hidden">
                                {item.last_watched || "-"}
                              </span>
                              <span className="hidden md:inline">
                                {formatEpisodeString(item.last_watched)}
                              </span>
                            </span>
                            {item.latest_episode &&
                            item.last_watched &&
                            item.latest_episode === item.last_watched ? (
                              <CheckCircleIcon
                                className="w-6 h-6 text-green-400 flex-shrink-0"
                                title="Güncel bölümler izlendi"
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWatchNext(item);
                                }}
                                disabled={loadingItems.has(item.id)}
                                className="text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
                                title="Sıradaki Bölümü İşaretle"
                              >
                                {loadingItems.has(item.id) ? (
                                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <PlusCircleIcon className="w-6 h-6" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-gray-300 ${
                            activeTab === "movie" ? "hidden" : ""
                          }`}
                        >
                          <span className="md:hidden">
                            {item.latest_episode || "-"}
                          </span>
                          <span className="hidden md:inline">
                            {formatEpisodeString(item.latest_episode)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <ProdStatusBadge status={item.status} />
                        </td>
                        <td
                          className={`px-4 py-3 ${
                            activeTab === "movie" ? "" : "hidden md:table-cell"
                          }`}
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              STATUS_CONFIG[item.user_status].badge
                            }`}
                          >
                            {STATUS_CONFIG[item.user_status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {item.display_date?.split("-")[0] || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
              <p className="text-gray-400 text-lg">
                Bu listede henüz içerik yok.
              </p>
              <button
                onClick={() => navigate("/entertainment")}
                className="mt-4 text-blue-400 hover:underline"
              >
                Keşfetmeye Başla
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
