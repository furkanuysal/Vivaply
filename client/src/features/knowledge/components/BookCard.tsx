import { useNavigate } from "react-router-dom";
import { ReadStatus, type BookContentDto } from "../types";
import { useReadStatusConfig } from "../hooks/useReadStatusConfig";
import { useTranslation } from "react-i18next";

import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";

interface Props {
  book: BookContentDto;
}

export default function BookCard({ book }: Props) {
  const navigate = useNavigate();
  const { STATUS_CONFIG } = useReadStatusConfig();
  const { t } = useTranslation(["common", "knowledge"]);

  const imageUrl = book.coverUrl?.replace("http:", "https:") || undefined;

  // Progress Percentage
  const pageCount = book.pageCount ?? 0;
  const progress =
    pageCount > 0 ? Math.min((book.currentPage / pageCount) * 100, 100) : 0;

  return (
    <div
      onClick={() => navigate(`/knowledge/book/${book.id}`)}
      className="bg-skin-surface rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-skin-border group cursor-pointer flex flex-col h-full"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <UniversalCoverFallback title={book.title} type="book" />
        )}
        {/* Hover Button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-skin-primary text-skin-base px-4 py-2 rounded-full font-bold hover:bg-skin-primary/90">
            {t("buttons.view")}
          </button>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3
            className="text-skin-text font-bold text-sm line-clamp-2 mb-1"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-skin-muted text-xs line-clamp-1">
            {book.authors.join(", ") ||
              t("knowledge:books.detail.unknown_author")}
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {/* Show Status if exists */}
          {book.userStatus !== ReadStatus.None && (
            <div className="flex justify-between items-center">
              <span
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  STATUS_CONFIG[book.userStatus]?.badge ??
                  "text-skin-muted bg-skin-base/50 border-skin-border"
                }`}
              >
                {STATUS_CONFIG[book.userStatus]?.label ?? ""}
              </span>
              {/* Show Progress if Reading */}
              {book.userStatus === ReadStatus.Reading && (
                <span className="text-xs text-skin-muted font-mono">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          )}

          {/* Progress Bar (Only if Reading) */}
          {book.userStatus === ReadStatus.Reading && (
            <div className="w-full bg-skin-base rounded-full h-1.5">
              <div
                className="bg-skin-primary h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
