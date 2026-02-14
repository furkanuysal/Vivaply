import { useNavigate } from "react-router-dom";
import { type GameContentDto } from "@/features/entertainment/types";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import FloatingGameCard from "@/features/entertainment/components/shared/FloatingGameCard";

import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";

interface Props {
  game: GameContentDto;
}

export default function GameCard({ game }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "entertainment"]);

  // Use coverUrl if available, otherwise placeholder
  const imageUrl = game.coverUrl
    ? game.coverUrl.replace("http:", "https:") // Ensure HTTPS
    : undefined;

  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

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
        onClick={() => navigate(`/entertainment/game/${game.id}`)}
        className="
          bg-skin-surface rounded-xl overflow-hidden shadow-lg
          border border-skin-border/40
          transition-all duration-300
          cursor-pointer relative min-w-0
        "
      >
        {/* Cover */}
        <div className="relative aspect-[2/3]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <UniversalCoverFallback title={game.title} type="game" />
          )}

          {/* Rating Badge */}
          {game.voteAverage > 0 && (
            <div className="absolute top-2 right-2 bg-skin-surface text-skin-accent text-xs font-bold px-2 py-1 rounded-md border border-skin-border shadow-sm">
              ⭐ {game.voteAverage.toFixed(1)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-2.5 md:p-4">
          <h3
            className="text-skin-text font-bold truncate mb-1"
            title={game.title}
          >
            {game.title}
          </h3>
          <div className="flex flex-nowrap gap-1 mt-1 mb-2 w-full overflow-hidden">
            {game.platforms
              ?.split(",")
              .slice(0, 2)
              .map((platform, index) => (
                <span
                  key={index}
                  className="text-[10px] bg-skin-base px-1.5 py-0.5 rounded text-skin-muted border border-skin-border truncate min-w-0"
                >
                  {platform.trim()}
                </span>
              ))}
            {game.platforms?.split(",").length > 2 && (
              <span className="text-[10px] text-skin-muted self-center flex-shrink-0">
                ...
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-skin-muted">
            <span>
              {game.releaseDate?.split("-")[0] || t("common:messages.no_date")}
            </span>
            <span className="uppercase border border-skin-border px-1 rounded">
              {t("entertainment:common.game")}
            </span>
          </div>
        </div>
      </div>

      {/* Portal Hover Card */}
      {ref.current &&
        createPortal(
          <AnimatePresence>
            {hovered && <FloatingGameCard anchorEl={ref.current} game={game} />}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
