import { type NavigateFunction } from "react-router-dom";
import type { TFunction } from "i18next";
import {
  TvIcon,
  FilmIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";
import type { DashboardItemDto } from "@/features/dashboard/types";

interface DashboardCardProps {
  item: DashboardItemDto;
  navigate: NavigateFunction;
  t: TFunction<["dashboard", "common"], undefined>;
}

export default function DashboardCard({
  item,
  navigate,
  t,
}: DashboardCardProps) {
  let subText = "";
  if (item.type === "tv" && item.season && item.episode) {
    subText = `${t("dashboard:units.season")} ${item.season} • ${t("dashboard:units.episode")} ${item.episode}`;
  } else {
    subText = t("common:types.movie") || "Film";
  }

  const progressPercent = item.progressPercent ?? 0;

  return (
    <div
      onClick={() => navigate(item.routePath)}
      className="group relative aspect-[16/10] rounded-2xl overflow-hidden shadow-md cursor-pointer transform hover:scale-[1.02] transition-all duration-300 border border-skin-border/30"
    >
      {/* --- Background Image --- */}
      <div className="absolute inset-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl.replace("http:", "https:")}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={item.title}
          />
        ) : (
          <UniversalCoverFallback
            title={item.title}
            type={item.type || "other"}
            className="w-full h-full"
          />
        )}

        {/* Darkening Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* --- Top Right Icon Badge --- */}
      <div className="absolute top-3 right-3 z-20 bg-skin-surface/90 backdrop-blur text-skin-text p-2 rounded-full shadow-lg border border-skin-border/10">
        {item.type === "tv" && <TvIcon className="w-5 h-5" />}
        {(item.type === "movie" || !item.type) && (
          <FilmIcon className="w-5 h-5" />
        )}
        {item.type === "book" && <BookOpenIcon className="w-5 h-5" />}
        {item.type === "game" && <PuzzlePieceIcon className="w-5 h-5" />}
      </div>

      {/* --- Content --- */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1 z-10">
        <h4 className="text-white text-lg font-bold leading-tight drop-shadow-md truncate pr-4">
          {item.title}
        </h4>
        <p className="text-gray-300 text-sm font-medium drop-shadow-sm">
          {subText}
        </p>

        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-skin-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
