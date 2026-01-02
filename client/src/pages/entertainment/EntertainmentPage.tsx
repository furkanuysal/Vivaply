import { useState, useEffect } from "react";
import { mediaService } from "@/features/entertainment/services/mediaService";
import MediaCard from "@/features/entertainment/components/shared/MediaCard";
import type {
  TmdbContentDto,
  GameContentDto,
} from "@/features/entertainment/types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { gamesService } from "@/features/entertainment/services/gameService";
import GameCard from "@/features/entertainment/components/shared/GameCard";
import SearchResultsSection from "@/components/common/SearchResultsSection";

export default function EntertainmentPage() {
  const [query, setQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [results, setResults] = useState<(TmdbContentDto | GameContentDto)[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<"tv" | "movie" | "game">("tv");
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
        data = await mediaService.getTrendingTv();
      } else if (activeTab === "movie") {
        data = await mediaService.getTrendingMovie();
      } else {
        data = await gamesService.getTrendingGames();
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
      setDisplayedQuery("");
      return;
    }

    setLoading(true);
    setDisplayedQuery(query);
    try {
      let data;
      if (activeTab === "tv") {
        data = await mediaService.searchTv(query);
      } else if (activeTab === "movie") {
        data = await mediaService.searchMovie(query);
      } else {
        data = await gamesService.searchGames(query);
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
          <button
            onClick={() => setActiveTab("game")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "game"
                ? "bg-skin-primary text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.games")}
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
              : activeTab === "movie"
              ? t("entertainment:discovery.search_movies")
              : t("entertainment:discovery.search_games")
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

      <SearchResultsSection
        loading={loading}
        displayedQuery={displayedQuery}
        hasResults={results.length > 0}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.map((item) =>
            activeTab === "game" ? (
              <GameCard key={item.id} game={item as GameContentDto} />
            ) : (
              <MediaCard
                key={item.id}
                content={item as TmdbContentDto}
                type={activeTab as "tv" | "movie"}
              />
            )
          )}
        </div>
      </SearchResultsSection>
    </div>
  );
}
