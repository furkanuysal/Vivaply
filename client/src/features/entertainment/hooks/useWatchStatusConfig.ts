import { useTranslation } from "react-i18next";
import { WatchStatus } from "../types";

export function useWatchStatusConfig(type?: "tv" | "movie") {
  const { t } = useTranslation(["entertainment", "common"]);

  const STATUS_CONFIG: Record<
    number,
    { label: string; badge: string; button: string }
  > = {
    [WatchStatus.PlanToWatch]: {
      label: t("entertainment:status.plan_to_watch"),
      badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      button: "bg-blue-600 text-white border-blue-500",
    },
    [WatchStatus.Watching]: {
      label: t("entertainment:status.watching"),
      badge: "text-green-400 bg-green-400/10 border-green-400/20",
      button: "bg-green-600 text-white border-green-500",
    },
    [WatchStatus.Completed]: {
      label: t("entertainment:status.completed"),
      badge: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      button: "bg-purple-600 text-white border-purple-500",
    },
    [WatchStatus.OnHold]: {
      label: t("entertainment:status.on_hold"),
      badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      button: "bg-yellow-600 text-white border-yellow-500",
    },
    [WatchStatus.Dropped]: {
      label: t("entertainment:status.dropped"),
      badge: "text-red-400 bg-red-400/10 border-red-400/20",
      button: "bg-red-600 text-white border-red-500",
    },
  };

  const STATUS_OPTIONS = (
    type === "movie"
      ? [WatchStatus.PlanToWatch, WatchStatus.Completed]
      : Object.keys(STATUS_CONFIG).map(Number)
  ) as WatchStatus[];

  const FILTER_OPTIONS = [
    { value: 0, label: t("common:buttons.all") },
    ...STATUS_OPTIONS.map((status) => ({
      value: status,
      label: STATUS_CONFIG[status].label,
    })),
  ];

  const STATUS_ORDER: Record<number, number> =
    type === "tv"
      ? {
          [WatchStatus.Watching]: 1,
          [WatchStatus.PlanToWatch]: 2,
          [WatchStatus.OnHold]: 3,
          [WatchStatus.Dropped]: 4,
          [WatchStatus.Completed]: 5,
        }
      : {};

  return { STATUS_CONFIG, STATUS_OPTIONS, FILTER_OPTIONS, STATUS_ORDER };
}
