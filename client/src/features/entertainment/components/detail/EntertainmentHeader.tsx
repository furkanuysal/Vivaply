import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, StarRating, UniversalCoverFallback } from "@/shared/ui";
import ProdStatusBadge from "@/features/entertainment/components/shared/ProdStatusBadge";

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

  const commonTypeMap = {
    tv: "entertainment:common.tv",
    movie: "entertainment:common.movie",
    game: "entertainment:common.game",
  } as const;

  const externalSourceLabel =
    type === "game" ? "IGDB" : "TMDB";

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

        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2 text-skin-primary">
            {data.display_name}
          </h1>
          <p className="text-skin-muted italic mb-6 text-lg">{data.tagline}</p>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <span className="text-skin-muted">
              {data.display_date?.split("-")[0]}
            </span>
            <span className="uppercase bg-skin-surface/50 px-2 py-1 rounded text-xs">
              {t(
                commonTypeMap[type as keyof typeof commonTypeMap] ||
                  `entertainment:common.${type}`,
              )}
            </span>
            <ProdStatusBadge status={data.status} />
          </div>

          {type !== "game" && data.genres && data.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.genres.map((g: any) => (
                <span
                  key={g.id}
                  className="bg-skin-surface/50 border border-skin-border px-3 py-1 rounded-lg text-xs text-skin-muted font-medium hover:text-skin-text transition-colors"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <div className="mb-6 inline-flex w-fit flex-wrap items-center gap-0 rounded-xl border border-skin-border/60 bg-skin-surface/35 px-4 py-3">
            <RatingInlineStat
              label={externalSourceLabel}
              value={Number(data.vote_average || 0).toFixed(1)}
              tone="accent"
            />
            <RatingInlineSeparator />
            <div className="relative group">
              <RatingInlineStat
                label="Viva"
                value={
                  data.viva_rating_count > 0
                    ? Number(data.viva_rating || 0).toFixed(1)
                    : undefined
                }
                tone="secondary"
                fallback={t("entertainment:detail.no_viva_rating")}
                interactive
              />
              <div className="absolute top-full left-0 mt-2 bg-skin-surface border border-skin-border p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-skin-muted">
                  Viva
                </p>
                <p className="mt-1 text-sm text-skin-text">
                  {data.viva_rating_count > 0
                    ? t("entertainment:detail.total_votes", {
                        count: data.viva_rating_count,
                      })
                    : t("entertainment:detail.no_viva_rating")}
                </p>
              </div>
            </div>
            <RatingInlineSeparator />
            <div className="relative group">
              <RatingInlineStat
                label={t("entertainment:library.table.personal_rating")}
                value={data.user_rating ? Number(data.user_rating).toFixed(1) : undefined}
                tone="primary"
                fallback={t("entertainment:detail.rate_hint")}
                interactive
              />
              <div className="absolute top-full left-0 mt-2 bg-skin-surface border border-skin-border p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                <StarRating currentRating={data.user_rating} onRate={onRate} />
              </div>
            </div>
          </div>

          {(data.list_count > 0 || data.completed_count > 0 || data.active_count > 0) && (
            <div className="mb-6 flex flex-wrap gap-2 text-sm text-skin-muted">
              {data.list_count > 0 && (
                <SocialProofChip>
                  {t("entertainment:detail.list_count", {
                    count: data.list_count,
                  })}
                </SocialProofChip>
              )}
              {data.completed_count > 0 && (
                <SocialProofChip>
                  {t("entertainment:detail.completed_count", {
                    count: data.completed_count,
                  })}
                </SocialProofChip>
              )}
              {data.active_count > 0 && (
                <SocialProofChip>
                  {t("entertainment:detail.active_count", {
                    count: data.active_count,
                  })}
                </SocialProofChip>
              )}
              {data.completion_rate > 0 && (
                <SocialProofChip>
                  {t("entertainment:detail.completion_rate", {
                    count: Math.round(data.completion_rate * 100),
                  })}
                </SocialProofChip>
              )}
            </div>
          )}

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
                  <span className="text-xs opacity-70 ml-2">v</span>
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
                            <span>x</span> {t("common:buttons.remove_from_library")}
                          </button>
                        </>
                      )}
                  </div>
                )}
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

function RatingInlineStat({
  label,
  value,
  fallback,
  tone,
  interactive = false,
}: {
  label: string;
  value?: string;
  fallback?: string;
  tone: "accent" | "secondary" | "primary";
  interactive?: boolean;
}) {
  const valueClass =
    tone === "accent"
      ? "text-skin-accent"
      : tone === "secondary"
        ? "text-skin-secondary"
        : "text-skin-primary";

  return (
    <div
      className={`flex min-h-11 items-center gap-2 pr-4 transition ${
        interactive ? "cursor-pointer" : ""
      }`}
    >
      {value ? (
        <>
          <span className={`text-2xl font-semibold leading-none ${valueClass}`}>
            {value}
          </span>
          <span className="text-sm text-skin-muted">{label}</span>
        </>
      ) : (
        <span className="text-sm text-skin-muted">{fallback ?? label}</span>
      )}
    </div>
  );
}

function RatingInlineSeparator() {
  return <span className="mx-4 h-6 w-px bg-skin-border/70" aria-hidden="true" />;
}

function SocialProofChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-skin-border/70 bg-skin-surface/40 px-3 py-1.5">
      {children}
    </span>
  );
}
