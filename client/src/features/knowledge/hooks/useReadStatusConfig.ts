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
      badge:
        "text-skin-badge-blue-text bg-skin-badge-blue-bg/20 border-skin-badge-blue-bg/30",
      button: "bg-blue-600 text-white border-blue-500",
    },
    [ReadStatus.Reading]: {
      label: t("knowledge:books.status.reading"),
      badge:
        "text-skin-badge-green-text bg-skin-badge-green-bg/20 border-skin-badge-green-bg/30",
      button: "bg-green-600 text-white border-green-500",
    },
    [ReadStatus.Completed]: {
      label: t("knowledge:books.status.completed"),
      badge:
        "text-skin-badge-purple-text bg-skin-badge-purple-bg/20 border-skin-badge-purple-bg/30",
      button: "bg-purple-600 text-white border-purple-500",
    },
    [ReadStatus.OnHold]: {
      label: t("knowledge:books.status.on_hold"),
      badge:
        "text-skin-badge-yellow-text bg-skin-badge-yellow-bg/20 border-skin-badge-yellow-bg/30",
      button: "bg-yellow-600 text-white border-yellow-500",
    },
    [ReadStatus.Dropped]: {
      label: t("knowledge:books.status.dropped"),
      badge:
        "text-skin-badge-red-text bg-skin-badge-red-bg/20 border-skin-badge-red-bg/30",
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
