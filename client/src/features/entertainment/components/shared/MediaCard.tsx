// MediaCard.tsx
import { useNavigate } from "react-router-dom";
import type { TmdbContentDto } from "@/features/entertainment/types";
import { useTranslation } from "react-i18next";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import FloatingMediaCard from "@/features/entertainment/components/shared/FloatingMediaCard";
import { AnimatePresence } from "framer-motion";

interface Props {
  content: TmdbContentDto;
  type: "movie" | "tv";
}

export default function MediaCard({ content, type }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "entertainment"]);
  const imageUrl = content.poster_path
    ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : undefined;

  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Normal küçük kart */}
      <div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/entertainment/${type}/${content.id}`)}
        className="
          bg-skin-surface rounded-xl overflow-hidden shadow-lg
          border border-skin-border/40
          transition-all duration-300
          cursor-pointer relative
        "
      >
        {/* Poster */}
        <div className="relative aspect-[2/3]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={content.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UniversalCoverFallback title={content.display_name} type={type} />
          )}

          {/* Rating */}
          <div className="absolute top-2 right-2 bg-skin-surface text-skin-accent text-xs font-bold px-2 py-1 rounded-md border border-skin-border shadow-sm">
            ⭐ {(content.vote_average || 0).toFixed(1)}
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <h3
            className="text-skin-text font-bold truncate"
            title={content.display_name}
          >
            {content.display_name}
          </h3>
          <div className="flex justify-between items-center mt-2 text-xs text-skin-muted">
            <span>
              {content.display_date?.split("-")[0] ||
                t("common:messages.no_date")}
            </span>
            <span className="uppercase border border-skin-border px-1 rounded">
              {t(`entertainment:common.${type}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Portal Hover Card */}
      {ref.current &&
        createPortal(
          <AnimatePresence>
            {hovered && (
              <FloatingMediaCard
                anchorEl={ref.current}
                content={content}
                type={type}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
