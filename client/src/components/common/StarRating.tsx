import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface Props {
  currentRating?: number;
  onRate: (rating: number) => void;
}

export default function StarRating({ currentRating = 0, onRate }: Props) {
  const { t } = useTranslation("common");
  const [hover, setHover] = useState(0);

  // Rating to show
  const displayRating = hover || currentRating || 0;

  return (
    <div className="flex flex-col gap-3 select-none">
      {currentRating > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRate(0)}
            className="rounded-lg border border-skin-border px-2.5 py-1 text-xs font-medium text-skin-muted transition hover:border-skin-primary/40 hover:text-skin-text"
          >
            {t("buttons.clear")}
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-1">
      <div className="flex relative">
        {[...Array(10)].map((_, index) => {
          const starValue = index + 1;

          return (
            <div key={index} className="relative w-6 h-6 cursor-pointer group">
              <div className="absolute inset-0 pointer-events-none">
                {displayRating >= starValue ? (
                  // Full Star
                  <StarIcon className="w-6 h-6 text-skin-primary" />
                ) : displayRating >= starValue - 0.5 ? (
                  // Half Star (Masking)
                  <div className="relative w-6 h-6">
                    <StarOutline className="absolute w-6 h-6 text-skin-muted" />
                    <div className="absolute inset-0 overflow-hidden w-[50%]">
                      <StarIcon className="w-6 h-6 text-skin-primary" />
                    </div>
                  </div>
                ) : (
                  // Empty Star
                  <StarOutline className="w-6 h-6 text-skin-muted" />
                )}
              </div>

              {/* Click Areas (Upper Layer - Hidden)
                 There are two buttons hidden on top of each star.
              */}

              {/* Left Half (Half Point: X.5) */}
              <div
                className="absolute left-0 top-0 w-1/2 h-full z-20"
                onMouseEnter={() => setHover(starValue - 0.5)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onRate(starValue - 0.5)}
              />

              {/* Right Half (Full Point: X.0) */}
              <div
                className="absolute right-0 top-0 w-1/2 h-full z-20"
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onRate(starValue)}
              />
            </div>
          );
        })}
      </div>

      {/* Rating Text */}
      <span className="ml-3 text-lg font-bold text-skin-primary w-10 text-center">
        {displayRating.toFixed(1)}
      </span>
      </div>
    </div>
  );
}
