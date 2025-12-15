import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { booksService } from "../../features/knowledge/services/booksService";
import BookCard from "../../features/knowledge/components/BookCard";
import type { BookContentDto } from "../../features/knowledge/types";
import { useTranslation } from "react-i18next";

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookContentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(["common", "knowledge"]);

  // AbortController Ref (previous request cancel)
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    performSearch("subject:fiction&orderBy=newest");
  }, []);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);

    // Cancel previous search request if still running
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await booksService.searchBooks(searchQuery, {
        signal: controller.signal,
      });
      setResults(data);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Search error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Dynamic search: debounce + min 3 chars
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      performSearch("subject:fiction");
      return;
    }

    if (trimmed.length < 3) return;

    const debounceTimer = setTimeout(() => {
      performSearch(trimmed);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      performSearch(query.trim());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-skin-text">
          {t("knowledge:books.discover_books")}
        </h1>

        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            placeholder={t("knowledge:books.search_placeholder")}
            className="w-full bg-skin-surface border border-skin-border text-skin-text px-5 py-4 rounded-xl pl-12 focus:outline-none focus:border-skin-primary focus:ring-1 focus:ring-skin-primary transition shadow-lg placeholder:text-skin-muted"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-6 h-6 text-skin-muted absolute left-4 top-4" />
          <button
            type="submit"
            className="absolute right-3 top-2.5 bg-skin-primary hover:bg-skin-primary/90 text-skin-base px-6 py-1.5 rounded-lg font-medium transition"
          >
            {t("common:buttons.search")}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-skin-text border-l-4 border-skin-primary pl-3">
            {query
              ? t("common:search.search_results", { query })
              : t("common:search.recommended_for_you")}
          </h2>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center text-skin-muted py-10 bg-skin-surface/30 rounded-xl border border-skin-border/50">
              {t("common:messages.search_no_results")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
