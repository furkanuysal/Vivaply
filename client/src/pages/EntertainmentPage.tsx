import { useState, useEffect } from "react";
import { entertainmentService } from "../features/entertainment/services/entertainmentService";
import MediaCard from "../features/entertainment/components/MediaCard";
import type { TmdbContentDto } from "../features/entertainment/types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export default function EntertainmentPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbContentDto[]>([]);
  const [activeTab, setActiveTab] = useState<"tv" | "movie">("tv");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(["common", "entertainment"]);

  // Fetch trending on load
  useEffect(() => {
    // If search query is not empty, search, otherwise fetch trending
    if (query.trim()) {
      handleSearch(new Event("submit") as any); // Simple hack to trigger search function
    } else {
      loadTrending();
    }
  }, [activeTab]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === "tv") {
        data = await entertainmentService.getTrendingTv();
      } else {
        data = await entertainmentService.getTrendingMovie();
      }
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      loadTrending();
      return;
    }

    setLoading(true);
    try {
      let data;
      if (activeTab === "tv") {
        data = await entertainmentService.searchTv(query);
      } else {
        data = await entertainmentService.searchMovie(query);
      }
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search and Filter Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold text-skin-text">
          {t("entertainment:discovery.discover")}
        </h1>

        {/* Tab Switcher */}
        <div className="bg-skin-surface p-1 rounded-lg flex gap-1 border border-skin-border">
          <button
            onClick={() => setActiveTab("tv")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "tv"
                ? "bg-skin-primary text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.tv_shows")}
          </button>
          <button
            onClick={() => setActiveTab("movie")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "movie"
                ? "bg-skin-primary text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.movies")}
          </button>
        </div>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder={`${
            activeTab === "tv"
              ? t("entertainment:discovery.search_tv_shows")
              : t("entertainment:discovery.search_movies")
          }`}
          className="w-full bg-skin-surface border border-skin-border text-skin-text px-5 py-4 rounded-xl pl-12 focus:outline-none focus:border-skin-primary focus:ring-1 focus:ring-skin-primary transition placeholder:text-skin-muted"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <MagnifyingGlassIcon className="w-6 h-6 text-skin-muted absolute left-4 top-4" />
        <button
          type="submit"
          className="absolute right-3 top-2.5 bg-skin-primary hover:bg-skin-primary/90 text-skin-base px-4 py-1.5 rounded-lg font-medium transition"
        >
          {t("common:buttons.search")}
        </button>
      </form>

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.map((item) => (
            <MediaCard key={item.id} content={item} type={activeTab} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center text-skin-muted py-10">
          {t("common:messages.search_no_results")}
        </div>
      )}
    </div>
  );
}
