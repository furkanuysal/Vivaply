import { useEffect, useRef, useState } from "react";
import { booksApi } from "@/features/knowledge/api/booksApi";
import type { BookContentDto } from "@/features/knowledge/types";

const isRequestCanceled = (error: unknown) => {
  const maybeError = error as { name?: string; code?: string };
  return (
    maybeError?.name === "AbortError" ||
    maybeError?.name === "CanceledError" ||
    maybeError?.code === "ERR_CANCELED"
  );
};

export function useKnowledgeSearch(language: string) {
  const [query, setQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [results, setResults] = useState<BookContentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverError, setDiscoverError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setDiscoverError(false);
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await booksApi.searchBooks(searchQuery, {
        signal: controller.signal,
      });
      setResults(data);
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        console.error("Search error:", err);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const loadDiscover = async () => {
    setLoading(true);
    setDiscoverError(false);
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await booksApi.discoverBooks(language, {
        signal: controller.signal,
      });

      setResults(data);
      setDisplayedQuery("");
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        console.error("Discover error:", err);
        setDiscoverError(true);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDiscover();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [language]);

  const handleSubmitSearch = () => {
    if (!query.trim()) {
      loadDiscover();
      return;
    }

    performSearch(query);
    setDisplayedQuery(query);
  };

  return {
    query,
    setQuery,
    displayedQuery,
    results,
    loading,
    discoverError,
    retryDiscover: loadDiscover,
    handleSubmitSearch,
  };
}
