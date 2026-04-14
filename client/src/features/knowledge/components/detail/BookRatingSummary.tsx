import { useTranslation } from "react-i18next";
import { StarRating } from "@/shared/ui";
import type { BookContentDto } from "@/features/knowledge/types";

interface BookRatingSummaryProps {
  book: BookContentDto;
  onRate: (rating: number) => void;
}

export default function BookRatingSummary({
  book,
  onRate,
}: BookRatingSummaryProps) {
  const { t } = useTranslation("knowledge");
  const hasVivaRating = (book.vivaRatingCount ?? 0) > 0;

  return (
    <>
      <div className="mb-6 inline-flex w-fit flex-wrap items-center gap-0 rounded-xl border border-skin-border/60 bg-skin-surface/35 px-4 py-3">
        <RatingInlineStat
          label="Google Books"
          value={Number(book.averageRating || 0).toFixed(1)}
          tone="accent"
        />
        <RatingInlineSeparator />
        <div className="group relative">
          <RatingInlineStat
            label="Viva"
            value={
              hasVivaRating
                ? Number(book.vivaRating || 0).toFixed(1)
                : undefined
            }
            fallback={t("books.detail.no_viva_rating")}
            tone="secondary"
            interactive
          />
          <div className="invisible absolute left-0 top-full z-50 mt-2 min-w-max rounded-xl border border-skin-border bg-skin-surface p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-skin-muted">
              Viva
            </p>
            <p className="mt-1 text-sm text-skin-text">
              {hasVivaRating
                ? t("books.detail.total_votes", {
                    count: book.vivaRatingCount,
                  })
                : t("books.detail.no_viva_rating")}
            </p>
          </div>
        </div>
        <RatingInlineSeparator />
        <div className="group relative">
          <RatingInlineStat
            label={t("books.library.personal_rating")}
            value={book.userRating ? Number(book.userRating).toFixed(1) : undefined}
            fallback={t("books.detail.rate_hint")}
            tone="primary"
            interactive
          />
          <div className="invisible absolute left-0 top-full z-50 mt-2 min-w-max rounded-xl border border-skin-border bg-skin-surface p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <StarRating currentRating={book.userRating} onRate={onRate} />
          </div>
        </div>
      </div>
      {(book.listCount || book.completedCount || book.activeCount) ? (
        <div className="mb-6 flex flex-wrap gap-2 text-sm text-skin-muted">
          {(book.listCount ?? 0) > 0 && (
            <SocialProofChip>
              {t("books.detail.list_count", { count: book.listCount })}
            </SocialProofChip>
          )}
          {(book.completedCount ?? 0) > 0 && (
            <SocialProofChip>
              {t("books.detail.completed_count", { count: book.completedCount })}
            </SocialProofChip>
          )}
          {(book.activeCount ?? 0) > 0 && (
            <SocialProofChip>
              {t("books.detail.active_count", { count: book.activeCount })}
            </SocialProofChip>
          )}
          {(book.completionRate ?? 0) > 0 && (
            <SocialProofChip>
              {t("books.detail.completion_rate", {
                count: Math.round((book.completionRate ?? 0) * 100),
              })}
            </SocialProofChip>
          )}
        </div>
      ) : null}
    </>
  );
}

function RatingInlineStat({
  label,
  value,
  fallback,
  tone,
  interactive = false,
}: {
  label: string;
  value?: string;
  fallback?: string;
  tone: "accent" | "secondary" | "primary";
  interactive?: boolean;
}) {
  const toneClass =
    tone === "accent"
      ? "text-skin-accent"
      : tone === "secondary"
        ? "text-skin-secondary"
        : "text-skin-primary";

  return (
    <div
      className={`flex min-h-11 items-center gap-2 pr-4 transition ${
        interactive ? "cursor-pointer" : ""
      }`}
    >
      {value ? (
        <>
          <span className={`text-2xl font-semibold leading-none ${toneClass}`}>
            {value}
          </span>
          <span className="text-sm text-skin-muted">{label}</span>
        </>
      ) : (
        <span className="text-sm text-skin-muted">{fallback ?? label}</span>
      )}
    </div>
  );
}

function RatingInlineSeparator() {
  return <span className="mx-4 h-6 w-px bg-skin-border/70" aria-hidden="true" />;
}

function SocialProofChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-skin-border/70 bg-skin-surface/40 px-3 py-1.5">
      {children}
    </span>
  );
}
