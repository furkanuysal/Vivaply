import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface SearchResultsSectionProps {
  loading: boolean;
  displayedQuery: string;
  hasResults: boolean;
  children: ReactNode;
}

export default function SearchResultsSection({
  loading,
  displayedQuery,
  hasResults,
  children,
}: SearchResultsSectionProps) {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-skin-text border-l-4 border-skin-primary pl-3">
        {displayedQuery
          ? t("common:search.search_results", { query: displayedQuery })
          : t("common:search.recommended_for_you")}
      </h2>

      {hasResults ? (
        children
      ) : (
        <div className="text-center text-skin-muted py-10 bg-skin-surface/30 rounded-xl border border-skin-border/50">
          {t("common:messages.search_no_results")}
        </div>
      )}
    </div>
  );
}
