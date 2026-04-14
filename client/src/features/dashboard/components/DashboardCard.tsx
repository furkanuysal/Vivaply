import { type NavigateFunction } from "react-router-dom";
import type { TFunction } from "i18next";
import {
  TvIcon,
  FilmIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { UniversalCoverFallback } from "@/shared/ui";
import type { DashboardItemDto } from "@/features/dashboard/types";
import { DashboardItemType } from "@/features/dashboard/types";
import { TYPE_LABEL, getRoutePath } from "@/features/dashboard/utils";
import { WatchStatus } from "@/features/entertainment/types";

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

  if (item.type === DashboardItemType.Tv && item.season && item.episode) {
    subText = `${t("dashboard:units.season")} ${item.season} • ${t("dashboard:units.episode")} ${item.episode}`;
  } else if (item.userStatus === WatchStatus.Completed) {
    subText = t("dashboard:status.completed");
  } else {
    subText = t("common:types.movie") || "Film";
  }

  const progressPercent = item.progressPercent ?? 0;

  return (
    <div
      onClick={() => navigate(getRoutePath(item.type, item.id))}
      className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl border border-skin-border/30 shadow-md transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="absolute inset-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl.replace("http:", "https:")}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={item.title}
          />
        ) : (
          <UniversalCoverFallback
            title={item.title}
            type={TYPE_LABEL[item.type]}
            className="h-full w-full"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute right-3 top-3 z-20 rounded-full border border-skin-border/10 bg-skin-surface/90 p-2 text-skin-text shadow-lg backdrop-blur">
        {item.type === DashboardItemType.Tv && <TvIcon className="h-5 w-5" />}
        {item.type === DashboardItemType.Movie && (
          <FilmIcon className="h-5 w-5" />
        )}
        {item.type === DashboardItemType.Book && <BookOpenIcon className="h-5 w-5" />}
        {item.type === DashboardItemType.Game && (
          <PuzzlePieceIcon className="h-5 w-5" />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1 p-5">
        <h4 className="truncate pr-4 text-lg font-bold leading-tight text-white drop-shadow-md">
          {item.title}
        </h4>
        <p className="text-sm font-medium text-gray-300 drop-shadow-sm">
          {subText}
        </p>

        {progressPercent > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-skin-primary shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
