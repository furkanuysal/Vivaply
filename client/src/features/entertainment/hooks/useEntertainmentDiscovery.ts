import { useEffect, useRef, useState } from "react";
import { gamesApi } from "@/features/entertainment/api/gamesApi";
import { mediaApi } from "@/features/entertainment/api/mediaApi";
import type {
  GameContentDto,
  TmdbContentDto,
} from "@/features/entertainment/types";

export function useEntertainmentDiscovery(activeTab: "tv" | "movie" | "game") {
  const [query, setQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [results, setResults] = useState<(TmdbContentDto | GameContentDto)[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const data =
        activeTab === "tv"
          ? await mediaApi.getTrendingTv()
          : activeTab === "movie"
            ? await mediaApi.getTrendingMovie()
            : await gamesApi.getTrendingGames();

      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      void handleSearch();
    } else {
      void loadTrending();
    }
  }, [activeTab]);

  const handleSearch = async () => {
    if (!query.trim()) {
      await loadTrending();
      setDisplayedQuery("");
      return;
    }

    setLoading(true);
    setDisplayedQuery(query);

    try {
      const data =
        activeTab === "tv"
          ? await mediaApi.searchTv(query)
          : activeTab === "movie"
            ? await mediaApi.searchMovie(query)
            : await gamesApi.searchGames(query);

      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    const itemWidth = carouselRef.current.firstElementChild?.clientWidth || 200;
    const gap = 16;
    const scrollAmount = itemWidth + gap;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount * 2 : scrollAmount * 2,
      behavior: "smooth",
    });
  };

  return {
    query,
    setQuery,
    displayedQuery,
    results,
    loading,
    carouselRef,
    handleSearch,
    scrollLeft: () => scrollCarousel("left"),
    scrollRight: () => scrollCarousel("right"),
  };
}
