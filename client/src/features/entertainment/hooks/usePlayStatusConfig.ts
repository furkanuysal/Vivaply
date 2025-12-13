import { useTranslation } from "react-i18next";
import { PlayStatus } from "../types";

export function usePlayStatusConfig() {
  const { t } = useTranslation(["entertainment", "common"]);

  const STATUS_CONFIG: Record<
    number,
    { label: string; badge: string; button: string }
  > = {
    [PlayStatus.PlanToPlay]: {
      label: t("entertainment:games.status.plan_to_play"),
      badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      button: "bg-blue-600 text-white border-blue-500",
    },
    [PlayStatus.Playing]: {
      label: t("entertainment:games.status.playing"),
      badge: "text-green-400 bg-green-400/10 border-green-400/20",
      button: "bg-green-600 text-white border-green-500",
    },
    [PlayStatus.Completed]: {
      label: t("entertainment:games.status.completed"),
      badge: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      button: "bg-purple-600 text-white border-purple-500",
    },
    [PlayStatus.OnHold]: {
      label: t("entertainment:games.status.on_hold"),
      badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      button: "bg-yellow-600 text-white border-yellow-500",
    },
    [PlayStatus.Dropped]: {
      label: t("entertainment:games.status.dropped"),
      badge: "text-red-400 bg-red-400/10 border-red-400/20",
      button: "bg-red-600 text-white border-red-500",
    },
  };

  const FILTER_OPTIONS = [
    { value: 0, label: t("common:buttons.all") },
    ...Object.keys(STATUS_CONFIG).map((key) => ({
      value: Number(key),
      label: STATUS_CONFIG[Number(key)].label,
    })),
  ];

  const STATUS_OPTIONS = Object.keys(STATUS_CONFIG).map(Number) as PlayStatus[];

  return { STATUS_CONFIG, FILTER_OPTIONS, STATUS_OPTIONS };
}
