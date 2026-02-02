import { type NavigateFunction } from "react-router-dom";
import type { TFunction } from "i18next";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";
import type { DashboardItemDto } from "@/features/dashboard/types";

interface DashboardListCardProps {
  item: DashboardItemDto;
  navigate: NavigateFunction;
  t: TFunction<["dashboard", "common"], undefined>;
}

export default function DashboardListCard({
  item,
  navigate,
  t,
}: DashboardListCardProps) {
  let subText = "";
  let progressText = "";
  let progressLabel = "";
  let progressColor = "text-skin-primary";

  if (item.type === "book") {
    subText = t("common:types.book");

    // Secure percentage calculation
    const current = item.currentValue ?? 0;
    const max = item.maxValue ?? 1; // Prevent division by zero
    const percent = max > 0 ? Math.round((current / max) * 100) : 0;

    progressText = `%${percent}`;
    progressLabel = t("dashboard:status.in_progress");
    progressColor = "text-skin-accent"; // Book color
  } else if (item.type === "game") {
    subText = t("common:types.game");

    // Game time
    progressText = `${item.currentValue ?? 0}${t("dashboard:units.hour_short")}`;
    progressLabel = t("dashboard:status.played");
    progressColor = "text-skin-rating-90"; // Game color
  }

  return (
    <div
      onClick={() => navigate(item.routePath)}
      className="flex items-center gap-4 p-3 hover:bg-skin-surface/50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-skin-border/30"
    >
      {/* Cover Image */}
      <div
        className={`shrink-0 bg-skin-base rounded-md overflow-hidden shadow-sm relative w-12 h-16`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            className="w-full h-full object-cover"
            alt={item.title}
          />
        ) : (
          <UniversalCoverFallback
            title={item.title}
            type={item.type || "other"}
            variant="compact"
          />
        )}
      </div>

      {/* Text Area */}
      <div className="flex-1 min-w-0">
        <p className="text-skin-text font-bold truncate group-hover:text-skin-primary transition-colors">
          {item.title}
        </p>
        <p className="text-skin-muted text-xs truncate uppercase tracking-wider font-medium">
          {subText}
        </p>
      </div>

      {/* Progress Status */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${progressColor}`}>{progressText}</p>
        <p className="text-[10px] text-skin-muted uppercase tracking-tighter">
          {progressLabel}
        </p>
      </div>
    </div>
  );
}
