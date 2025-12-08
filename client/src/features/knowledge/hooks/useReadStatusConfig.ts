import { useTranslation } from "react-i18next";
import { ReadStatus } from "../types";

export function useReadStatusConfig() {
  const { t } = useTranslation(["knowledge", "common"]);

  const STATUS_CONFIG: Record<
    number,
    { label: string; badge: string; button: string }
  > = {
    [ReadStatus.PlanToRead]: {
      label: t("knowledge:books.status.plan_to_read"),
      badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      button: "bg-blue-600 text-white border-blue-500",
    },
    [ReadStatus.Reading]: {
      label: t("knowledge:books.status.reading"),
      badge: "text-green-400 bg-green-400/10 border-green-400/20",
      button: "bg-green-600 text-white border-green-500",
    },
    [ReadStatus.Completed]: {
      label: t("knowledge:books.status.completed"),
      badge: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      button: "bg-purple-600 text-white border-purple-500",
    },
    [ReadStatus.OnHold]: {
      label: t("knowledge:books.status.on_hold"),
      badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      button: "bg-yellow-600 text-white border-yellow-500",
    },
    [ReadStatus.Dropped]: {
      label: t("knowledge:books.status.dropped"),
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

  const STATUS_OPTIONS = Object.keys(STATUS_CONFIG).map(Number) as ReadStatus[];

  return { STATUS_CONFIG, FILTER_OPTIONS, STATUS_OPTIONS };
}
