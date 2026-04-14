import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { UniversalCoverFallback } from "@/shared/ui";
import FloatingBookCard from "@/features/knowledge/components/cards/FloatingBookCard";
import { useReadStatusConfig } from "@/features/knowledge/hooks/useReadStatusConfig";
import { ReadStatus, type BookContentDto } from "@/features/knowledge/types";

interface Props {
  book: BookContentDto;
}

export default function BookCard({ book }: Props) {
  const navigate = useNavigate();
  const { STATUS_CONFIG } = useReadStatusConfig();
  const { t } = useTranslation(["common", "knowledge"]);
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const imageUrl = book.coverUrl?.replace("http:", "https:") || undefined;
  const pageCount = book.pageCount ?? 0;
  const progress =
    pageCount > 0 ? Math.min((book.currentPage / pageCount) * 100, 100) : 0;

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={() => {
          if (window.innerWidth >= 768) {
            setHovered(true);
          }
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/knowledge/book/${book.id}`)}
        className="relative cursor-pointer overflow-hidden rounded-xl border border-skin-border/40 bg-skin-surface shadow-lg transition-all duration-300 hover:border-skin-primary/50 min-w-0"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <UniversalCoverFallback title={book.title} type="book" />
          )}
        </div>

        <div className="flex flex-grow flex-col justify-between p-4">
          <div>
            <h3
              className="mb-1 line-clamp-2 text-sm font-bold text-skin-text"
              title={book.title}
            >
              {book.title}
            </h3>
            <p className="line-clamp-1 text-xs text-skin-muted">
              {book.authors.join(", ") || t("knowledge:books.detail.unknown_author")}
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {book.userStatus !== ReadStatus.None && (
              <div className="flex items-center justify-between">
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] ${
                    STATUS_CONFIG[book.userStatus]?.badge ??
                    "border-skin-border bg-skin-base/50 text-skin-muted"
                  }`}
                >
                  {STATUS_CONFIG[book.userStatus]?.label ?? ""}
                </span>
                {book.userStatus === ReadStatus.Reading && (
                  <span className="font-mono text-xs text-skin-muted">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
            )}

            {book.userStatus === ReadStatus.Reading && (
              <div className="h-1.5 w-full rounded-full bg-skin-base">
                <div
                  className="h-1.5 rounded-full bg-skin-primary"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
      {ref.current &&
        createPortal(
          <AnimatePresence>
            {hovered && <FloatingBookCard anchorEl={ref.current} book={book} />}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
