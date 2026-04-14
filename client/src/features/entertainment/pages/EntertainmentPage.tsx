import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { SearchResultsSection } from "@/shared/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GameCard, MediaCard } from "@/features/entertainment/components/cards";
import { useEntertainmentDiscovery } from "@/features/entertainment/hooks/useEntertainmentDiscovery";
import { useRecommendations } from "@/features/entertainment/hooks/useRecommendations";
import type {
  GameContentDto,
  TmdbContentDto,
} from "@/features/entertainment/types";

export default function EntertainmentPage() {
  const [activeTab, setActiveTab] = useState<"tv" | "movie" | "game">("tv");
  const { t } = useTranslation(["common", "entertainment"]);
  const { user } = useAuth();
  const { data: recommendations, isLoading: recLoading } = useRecommendations();
  const {
    query,
    setQuery,
    displayedQuery,
    results,
    loading,
    carouselRef,
    handleSearch,
    scrollLeft,
    scrollRight,
  } = useEntertainmentDiscovery(activeTab);

  const currentRecommendations =
    activeTab === "tv" ? recommendations?.tv : recommendations?.movies;
  const showRecommendations =
    user &&
    !recLoading &&
    currentRecommendations &&
    currentRecommendations.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-3xl font-bold text-skin-text">
          {t("entertainment:discovery.discover")}
        </h1>

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
            onClick={() => setActiveTab("tv")}
            className={`relative z-10 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition md:px-4 md:py-2 md:text-sm ${
              activeTab === "tv"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.tv_shows")}
          </button>
          <button
            onClick={() => setActiveTab("movie")}
            className={`relative z-10 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition md:px-4 md:py-2 md:text-sm ${
              activeTab === "movie"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.movies")}
          </button>
          <button
            onClick={() => setActiveTab("game")}
            className={`relative z-10 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition md:px-4 md:py-2 md:text-sm ${
              activeTab === "game"
                ? "text-skin-base"
                : "text-skin-muted hover:text-skin-text"
            }`}
          >
            {t("entertainment:common.games")}
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSearch();
        }}
        className="relative"
      >
        <input
          type="text"
          placeholder={`${
            activeTab === "tv"
              ? t("entertainment:discovery.search_tv_shows")
              : activeTab === "movie"
                ? t("entertainment:discovery.search_movies")
                : t("entertainment:discovery.search_games")
          }`}
          className="w-full rounded-xl border border-skin-border bg-skin-surface px-4 py-3 pl-10 text-sm text-skin-text transition placeholder:text-skin-muted focus:border-skin-primary focus:outline-none focus:ring-1 focus:ring-skin-primary md:px-5 md:py-4 md:pl-12 md:text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-skin-muted md:left-4 md:top-4 md:h-6 md:w-6" />
        <button
          type="submit"
          className="absolute right-2 top-2 rounded-lg bg-skin-primary px-3 py-1.5 text-xs font-medium text-skin-base transition hover:bg-skin-primary/90 md:right-3 md:top-2.5 md:px-4 md:text-sm"
        >
          {t("common:buttons.search")}
        </button>
      </form>

      <SearchResultsSection
        title={!query.trim() ? t("entertainment:discovery.trending") : undefined}
        loading={loading}
        displayedQuery={displayedQuery}
        hasResults={results.length > 0}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
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

      {!query.trim() && activeTab !== "game" && showRecommendations && (
        <div className="space-y-6">
          <h2 className="border-l-4 border-skin-primary pl-3 text-xl font-semibold text-skin-text">
            {t("entertainment:discovery.recommended_for_you")}
          </h2>

          {recLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
            </div>
          ) : (
            <div className="group/carousel relative">
              <button
                onClick={scrollLeft}
                className="pointer-events-auto absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/10 bg-black/60 p-2 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/80 disabled:opacity-0 group-hover/carousel:opacity-100"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>

              <button
                onClick={scrollRight}
                className="pointer-events-auto absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/10 bg-black/60 p-2 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/80 disabled:opacity-0 group-hover/carousel:opacity-100"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>

              <div
                ref={carouselRef}
                className="pointer-events-auto flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {currentRecommendations?.map((item) => (
                  <div
                    key={item.id}
                    className="w-[160px] shrink-0 snap-start md:w-[200px]"
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
