import { useState } from "react";
import { useTranslation } from "react-i18next";
import StarRating from "../../../../components/common/StarRating";
import ProdStatusBadge from "../shared/ProdStatusBadge";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import UniversalCoverFallback from "@/components/common/UniversalCoverFallback";

interface EntertainmentHeaderProps {
  data: any;
  type: string;
  statusConfig: any;
  statusOptions: number[];
  allStatusConfigs: any;
  onStatusChange: (status: number) => void;
  onRate: (rating: number) => void;
  onRemove: () => void;
  children?: React.ReactNode;
}

export default function EntertainmentHeader({
  data,
  type,
  statusConfig,
  statusOptions,
  allStatusConfigs,
  onStatusChange,
  onRate,
  onRemove,
  children,
}: EntertainmentHeaderProps) {
  const { t } = useTranslation(["common", "entertainment"]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRemoveClick = () => {
    setIsConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const handleConfirmRemove = () => {
    onRemove();
    setIsConfirmOpen(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title={t("common:dialogs.remove_from_library_title")}
        message={t("common:dialogs.remove_from_library_message")}
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-full md:w-1/3 shrink-0">
          {data.poster_path ? (
            <img
              src={
                data.poster_path.startsWith("http")
                  ? data.poster_path
                  : `https://image.tmdb.org/t/p/w500${data.poster_path}`
              }
              alt={data.display_name}
              className="w-full rounded-xl shadow-lg border border-skin-border"
            />
          ) : (
            <div className="w-full aspect-[2/3] rounded-xl shadow-lg border border-skin-border overflow-hidden">
              <UniversalCoverFallback
                title={data.display_name}
                type={type as any}
              />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2 text-skin-primary">
            {data.display_name}
          </h1>
          <p className="text-skin-muted italic mb-6 text-lg">{data.tagline}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="bg-skin-accent/10 text-skin-accent px-3 py-1 rounded-lg font-bold border border-skin-accent/30 shadow-sm">
              ★ {(data.vote_average || 0).toFixed(1)}
            </span>

            {/* User Rating */}
            <div className="relative group">
              <span className="bg-skin-primary/20 text-skin-primary px-3 py-1 rounded-lg font-bold border border-skin-primary/40 cursor-pointer flex items-center gap-2">
                ★ {data.user_rating || 0}
              </span>
              <div className="absolute top-full left-0 mt-2 bg-skin-surface border border-skin-border p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                <StarRating currentRating={data.user_rating} onRate={onRate} />
              </div>
            </div>
            <span className="text-skin-muted">
              {data.display_date?.split("-")[0]}
            </span>
            <span className="uppercase bg-skin-surface/50 px-2 py-1 rounded text-xs">
              {t(`entertainment:common.${type}`)}
            </span>
            <ProdStatusBadge status={data.status} />
          </div>

          <h3 className="text-xl font-bold mb-2">
            {t("entertainment:detail.overview")}
          </h3>
          <div className="text-skin-muted leading-relaxed mb-8 text-sm max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-skin-primary pr-2">
            {data.overview || t("entertainment:detail.overview_not_available")}
          </div>

          {type === "game" && (
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-skin-surface/50 p-3 rounded-lg border border-skin-border">
                <h4 className="text-skin-muted font-bold text-xs uppercase mb-1">
                  {t("entertainment:games.platform")}
                </h4>
                <p className="text-skin-text font-medium">
                  {data.platforms || "-"}
                </p>
              </div>
              <div className="bg-skin-surface/50 p-3 rounded-lg border border-skin-border">
                <h4 className="text-skin-muted font-bold text-xs uppercase mb-1">
                  {t("entertainment:games.genre")}
                </h4>
                <p className="text-skin-text font-medium">
                  {data.genres || "-"}
                </p>
              </div>
              <div className="bg-skin-surface/50 p-3 rounded-lg border border-skin-border col-span-2">
                <h4 className="text-skin-muted font-bold text-xs uppercase mb-1">
                  {t("entertainment:games.developer")}
                </h4>
                <p className="text-skin-text font-medium">
                  {data.developers || "-"}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex gap-4 relative">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 min-w-[200px] justify-between ${
                    statusConfig.button
                  } ${
                    !data.user_status
                      ? "hover:scale-105 shadow-skin-primary/50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {statusConfig.label}
                  </div>
                  <span className="text-xs opacity-70 ml-2">▼</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-skin-surface border border-skin-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    {statusOptions.map((statusValue) => (
                      <button
                        key={statusValue}
                        onClick={() => {
                          onStatusChange(statusValue);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-skin-surface/70 transition flex justify-between items-center ${
                          data.user_status === statusValue
                            ? "text-skin-secondary font-bold bg-skin-surface/50"
                            : "text-skin-muted"
                        }`}
                      >
                        {allStatusConfigs[statusValue]?.label}
                        {data.user_status === statusValue && <span>✓</span>}
                      </button>
                    ))}

                    {data.user_status !== 0 &&
                      data.user_status !== undefined && (
                        <>
                          <div className="border-t border-skin-border my-1"></div>
                          <button
                            onClick={handleRemoveClick}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition flex items-center gap-2"
                          >
                            <span>🗑️</span>{" "}
                            {t("common:buttons.remove_from_library")}
                          </button>
                        </>
                      )}
                  </div>
                )}
              </div>
            </div>
            {/* Review Section or other children */}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
