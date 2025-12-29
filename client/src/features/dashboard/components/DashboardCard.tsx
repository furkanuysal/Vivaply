import { type NavigateFunction } from "react-router-dom";
import type { TFunction } from "i18next";
import {
  TvIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import type { DashboardItemDto } from "../types";

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
  let infoDisplay = "";
  if (item.type === "tv" && item.season && item.episode) {
    infoDisplay = `${t("dashboard:units.season")} ${item.season}, ${t(
      "dashboard:units.episode"
    )} ${item.episode}`;
  } else if (item.type === "book" && item.currentValue && item.maxValue) {
    infoDisplay = `${item.currentValue} / ${item.maxValue} ${t(
      "dashboard:units.page"
    )}`;
  } else if (item.type === "game" && item.currentValue) {
    infoDisplay = `${item.currentValue} ${t("dashboard:units.hour")}`;
  }

  return (
    <div
      onClick={() => navigate(item.routePath)}
      className="group relative bg-skin-surface rounded-2xl overflow-hidden border border-skin-border/40 shadow-sm cursor-pointer hover:shadow-2xl hover:border-skin-primary/50 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Background/Image Area */}
      <div className="relative h-48 overflow-hidden bg-skin-base">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
        <img
          src={
            item.imageUrl?.replace("http:", "https:") ||
            "https://via.placeholder.com/400x300"
          }
          className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out"
          alt={item.title}
        />

        {/* Type Icon Badge */}
        <div className="absolute top-3 right-3 z-20 bg-skin-surface/90 backdrop-blur text-skin-text p-2 rounded-full shadow-lg">
          {item.type === "tv" && <TvIcon className="w-4 h-4" />}
          {item.type === "book" && <BookOpenIcon className="w-4 h-4" />}
          {item.type === "game" && <PuzzlePieceIcon className="w-4 h-4" />}
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/40 backdrop-blur-[2px]">
          <button className="bg-skin-primary text-skin-base px-6 py-2 rounded-full font-bold hover:bg-skin-primary/90 shadow-lg transform scale-110 active:scale-95 transition-all">
            {t("common:buttons.view")}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 relative">
        <h4 className="font-bold text-lg text-skin-text truncate mb-1 group-hover:text-skin-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-skin-muted text-sm font-medium mb-3 flex items-center gap-2">
          {infoDisplay}
        </p>

        {/* Progress for Books */}
        {item.type === "book" && item.progressPercent !== undefined && (
          <div className="w-full bg-skin-base/50 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-skin-accent h-1.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              style={{ width: `${item.progressPercent}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
