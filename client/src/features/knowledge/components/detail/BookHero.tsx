import { useTranslation } from "react-i18next";
import { UniversalCoverFallback } from "@/shared/ui";
import type { BookContentDto, ReadStatus } from "@/features/knowledge/types";
import BookRatingSummary from "./BookRatingSummary";
import BookStatusDropdown from "./BookStatusDropdown";

interface StatusConfig {
  label: string;
  button: string;
}

interface BookHeroProps {
  book: BookContentDto;
  isStatusDropdownOpen: boolean;
  statusConfig: StatusConfig;
  statusOptions: ReadStatus[];
  allStatusConfigs: Record<number, StatusConfig>;
  onToggleStatusDropdown: () => void;
  onStatusChange: (status: ReadStatus) => void;
  onRemove: () => void;
  onRate: (rating: number) => void;
}

export default function BookHero({
  book,
  isStatusDropdownOpen,
  statusConfig,
  statusOptions,
  allStatusConfigs,
  onToggleStatusDropdown,
  onStatusChange,
  onRemove,
  onRate,
}: BookHeroProps) {
  const { t } = useTranslation("knowledge");

  return (
    <>
      <div className="order-1 flex justify-center md:col-span-4 md:row-start-1 md:justify-start">
        {book.coverUrl ? (
          <img
            src={book.coverUrl.replace("http:", "https:")}
            alt={book.title}
            className="w-48 rounded-xl border border-skin-border object-cover shadow-lg md:w-full"
          />
        ) : (
          <div className="aspect-[2/3] w-48 overflow-hidden rounded-xl border border-skin-border shadow-lg md:w-full">
            <UniversalCoverFallback title={book.title} type="book" />
          </div>
        )}
      </div>

      <div className="order-2 md:col-span-8 md:row-start-1">
        <h1 className="mb-2 text-4xl font-bold text-skin-primary">{book.title}</h1>
        <p className="mb-4 text-xl font-medium text-skin-muted">
          {book.authors?.join(", ") || t("books.detail.unknown_author")}
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="text-skin-muted">{book.publishedDate?.split("-")[0]}</span>
          <span className="inline-flex h-9 min-w-[88px] items-center justify-center rounded border border-skin-border px-2 font-mono text-sm text-skin-muted">
            {book.pageCount} {t("books.detail.page_suffix")}
          </span>
        </div>

        <BookRatingSummary book={book} onRate={onRate} />

        <h3 className="mb-2 text-xl font-bold">{t("books.detail.summary_title")}</h3>
        <div
          className="mb-8 max-h-60 overflow-y-auto pr-2 text-sm leading-relaxed text-skin-muted scrollbar-thin scrollbar-thumb-skin-primary"
          dangerouslySetInnerHTML={{
            __html: book.description || t("books.detail.no_summary"),
          }}
        />

        <BookStatusDropdown
          isOpen={isStatusDropdownOpen}
          currentStatus={book.userStatus}
          statusConfig={statusConfig}
          statusOptions={statusOptions}
          allStatusConfigs={allStatusConfigs}
          onToggle={onToggleStatusDropdown}
          onStatusChange={onStatusChange}
          onRemove={onRemove}
        />
      </div>
    </>
  );
}
