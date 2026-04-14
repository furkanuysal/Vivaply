import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { SearchResultsSection } from "@/shared/ui";
import { BookCard } from "@/features/knowledge/components/cards";
import { useKnowledgeSearch } from "@/features/knowledge/hooks/useKnowledgeSearch";

export default function KnowledgePage() {
  const { t, i18n } = useTranslation(["common", "knowledge"]);
  const {
    query,
    setQuery,
    displayedQuery,
    results,
    loading,
    discoverError,
    retryDiscover,
    handleSubmitSearch,
  } = useKnowledgeSearch(i18n.language);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitSearch();
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
            className="w-full rounded-xl border border-skin-border bg-skin-surface px-5 py-4 pl-12 text-skin-text shadow-lg transition placeholder:text-skin-muted focus:border-skin-primary focus:outline-none focus:ring-1 focus:ring-skin-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-skin-muted" />

          <button
            type="submit"
            className="absolute right-3 top-2.5 rounded-lg bg-skin-primary px-6 py-1.5 font-medium text-skin-base transition hover:bg-skin-primary/90"
          >
            {t("common:buttons.search")}
          </button>
        </form>
      </div>

      <SearchResultsSection
        loading={loading}
        displayedQuery={displayedQuery}
        hasResults={results.length > 0}
      >
        {discoverError && !displayedQuery ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center">
            <h2 className="text-lg font-semibold text-skin-text">
              {t("common:messages.general_error")}
            </h2>
            <p className="mt-2 text-sm text-skin-muted">
              {t("knowledge:books.discover_books")}
            </p>
            <button
              type="button"
              onClick={() => void retryDiscover()}
              className="mt-4 rounded-lg bg-skin-primary px-5 py-2 text-sm font-medium text-skin-base transition hover:bg-skin-primary/90"
            >
              {t("common:buttons.retry")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </SearchResultsSection>
    </div>
  );
}
