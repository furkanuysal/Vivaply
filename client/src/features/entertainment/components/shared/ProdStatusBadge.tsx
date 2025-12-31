import { useTranslation } from "react-i18next";

interface ProdStatusBadgeProps {
  status?: string;
}

export default function ProdStatusBadge({ status }: ProdStatusBadgeProps) {
  if (!status) return null;
  const { t } = useTranslation("entertainment");

  switch (status) {
    case "Ended":
      return (
        <span className="bg-skin-badge-red-bg/20 text-skin-badge-red-text px-2 py-1 rounded-md text-xs font-medium border border-skin-badge-red-bg/30 whitespace-nowrap">
          {t("entertainment:prod_status.ended")}
        </span>
      );
    case "Returning Series":
      return (
        <span className="bg-skin-badge-green-bg/20 text-skin-badge-green-text border-skin-badge-green-bg/30 px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap">
          {t("entertainment:prod_status.returning_series")}
        </span>
      );
    case "Canceled":
      return (
        <span className="bg-skin-badge-gray-bg/20 text-skin-badge-gray-text px-2 py-1 rounded-md text-xs font-medium border border-skin-badge-gray-bg/30 whitespace-nowrap">
          {t("entertainment:prod_status.canceled")}
        </span>
      );
    case "In Production":
      return (
        <span className="bg-skin-badge-yellow-bg/20 text-skin-badge-yellow-text px-2 py-1 rounded-md text-xs font-medium border border-skin-badge-yellow-bg/30 whitespace-nowrap">
          {t("entertainment:prod_status.in_production")}
        </span>
      );
    case "Released":
      return (
        <span className="bg-skin-badge-blue-bg/20 text-skin-badge-blue-text px-2 py-1 rounded-md text-xs font-medium border border-skin-badge-blue-bg/30 whitespace-nowrap">
          {t("entertainment:prod_status.released")}
        </span>
      );
    default:
      return (
        <span className="bg-skin-badge-gray-bg/20 text-skin-badge-gray-text px-2 py-1 rounded-md text-xs font-medium border border-skin-badge-gray-bg/30 whitespace-nowrap">
          {status}
        </span>
      );
  }
}
