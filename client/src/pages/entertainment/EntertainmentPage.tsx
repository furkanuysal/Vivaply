import { useState, useEffect, useRef } from "react";
import { mediaService } from "@/features/entertainment/services/mediaService";
import MediaCard from "@/features/entertainment/components/shared/MediaCard";
import type {
  TmdbContentDto,
  GameContentDto,
} from "@/features/entertainment/types";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useRecommendations } from "@/features/entertainment/hooks/useRecommendations";
import { gamesService } from "@/features/entertainment/services/gameService";
import GameCard from "@/features/entertainment/components/shared/GameCard";
import SearchResultsSection from "@/components/common/SearchResultsSection";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function EntertainmentPage() {
  const [query, setQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [results, setResults] = useState<(TmdbContentDto | GameContentDto)[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState<"tv" | "movie" | "game">("tv");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(["common", "entertainment"]);
  const { user } = useAuth();
  const { data: recommendations, isLoading: recLoading } = useRecommendations();
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
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

  const currentRecommendations =
    activeTab === "tv" ? recommendations?.tv : recommendations?.movies;
  const showRecommendations =
    user &&
    !recLoading &&
    currentRecommendations &&
    currentRecommendations.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search and Filter Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold text-skin-text">
          {t("entertainment:discovery.discover")}
        </h1>

        {/* Tab Switcher */}
        <div className="relative bg-skin-surface p-1 rounded-lg flex border border-skin-border">
          {/* Sliding Indicator */}
          <div className="absolute inset-0 p-1 pointer-events-none">
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
            onClick={() => setActiveTab("tv")}
            className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "tv"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.tv_shows")}
          </button>
          <button
            onClick={() => setActiveTab("movie")}
            className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "movie"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.movies")}
          </button>
          <button
            onClick={() => setActiveTab("game")}
            className={`relative z-10 flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "game"
                ? "text-skin-base"
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
        title={
          !query.trim() ? t("entertainment:discovery.trending") : undefined
        }
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
            ),
          )}
        </div>
      </SearchResultsSection>

      {/* Recommendations Section */}
      {!query.trim() && activeTab !== "game" && showRecommendations && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-skin-text border-l-4 border-skin-primary pl-3">
            {t("entertainment:discovery.recommended_for_you")}
          </h2>

          {recLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-skin-primary"></div>
            </div>
          ) : (
            <div className="relative group/carousel">
              {/* Left Button */}
              <button
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 hover:bg-black/80 backdrop-blur-sm shadow-lg"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>

              {/* Right Button */}
              <button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 hover:bg-black/80 backdrop-blur-sm shadow-lg"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>

              <div
                ref={carouselRef}
                className="
    flex overflow-x-auto overflow-y-visible gap-4 pb-4
    snap-x snap-mandatory
    scrollbar-hide
  "
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {currentRecommendations?.map((item: TmdbContentDto, index) => (
                  <div
                    key={item.id}
                    className={`
        shrink-0 w-[160px] md:w-[200px] snap-start
        ${index === 0 ? "ml-4" : ""}
        ${index === currentRecommendations.length - 1 ? "mr-4" : ""}
      `}
                  >
                    <MediaCard
                      content={item}
                      type={activeTab as "tv" | "movie"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
