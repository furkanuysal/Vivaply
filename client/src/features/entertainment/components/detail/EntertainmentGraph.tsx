import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TmdbEpisodeDto } from "@/features/entertainment/types";
import { getRatingClasses } from "@/features/entertainment/utils/ratingUtils";

interface EntertainmentGraphProps {
  seasons: any[];
  allSeasonsEpisodes: Record<number, TmdbEpisodeDto[]>;
  loadingAllSeasons: boolean;
  onToggleGraphEpisode: (seasonNum: number, episode: TmdbEpisodeDto) => void;
}

export default function EntertainmentGraph({
  seasons,
  allSeasonsEpisodes,
  loadingAllSeasons,
  onToggleGraphEpisode,
}: EntertainmentGraphProps) {
  const { t } = useTranslation(["common", "entertainment"]);
  const [showAllScores, setShowAllScores] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowAllScores(!showAllScores)}
          className={`px-3 py-2 rounded-lg transition border border-skin-border ${
            showAllScores
              ? "bg-skin-primary text-skin-base border-skin-primary"
              : "bg-skin-surface hover:bg-skin-surface/80 text-skin-muted"
          }`}
          title={
            showAllScores
              ? t("entertainment:detail.show_watched_episodes")
              : t("entertainment:detail.show_all_scores")
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {showAllScores ? (
              <>
                <path d="M12 5c7 0 10 7 10 7s-3 7-10 7-10-7-10-7 3-7 10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5z" />
                <path d="M9 16l2 2 4-4" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className="bg-skin-surface/30 p-6 rounded-2xl border border-skin-border overflow-x-auto">
        {loadingAllSeasons ? (
          <div className="flex justify-center items-center py-12 gap-3">
            <div className="animate-spin h-6 w-6 border-4 border-skin-primary border-t-transparent rounded-full"></div>
            <span className="text-skin-muted animate-pulse">
              {t("common:loading")}...
            </span>
          </div>
        ) : (
          <div className="inline-block min-w-max pl-4">
            {(() => {
              const validSeasons = seasons.filter(
                (s: any) => s.season_number >= 0,
              );

              const maxEpisodesCount = Math.max(
                0,
                ...validSeasons.map(
                  (s: any) => allSeasonsEpisodes[s.season_number]?.length || 0,
                ),
              );

              if (maxEpisodesCount === 0)
                return (
                  <div className="text-skin-muted italic">
                    {t("entertainment:detail.no_episodes_found")}
                  </div>
                );

              return (
                <div
                  className="grid gap-2 items-center"
                  style={{
                    gridTemplateColumns: `auto repeat(${validSeasons.length}, min-content)`,
                  }}
                >
                  {/* Header Row */}
                  <div className="h-8 w-8"></div>
                  {validSeasons.map((season: any) => (
                    <div
                      key={`header-s${season.season_number}`}
                      className="font-bold text-skin-muted text-xs text-center px-2 py-1 bg-skin-surface/50 rounded border border-skin-border/50 whitespace-nowrap"
                    >
                      {season.season_number === 0
                        ? t("entertainment:detail.special")
                        : t("entertainment:format.season_short", {
                            season: season.season_number,
                          })}
                    </div>
                  ))}

                  {/* Episode Rows */}
                  {Array.from({ length: maxEpisodesCount }).map(
                    (_, rowIndex) => {
                      const episodeNumber = rowIndex + 1;
                      const isFirstRow = rowIndex === 0;

                      return (
                        <>
                          {/* Row Header: Episode Number */}
                          <div className="font-bold text-skin-muted text-xs text-right pr-3 opacity-70">
                            {t("entertainment:format.episode_short", {
                              episode: episodeNumber,
                            })}
                          </div>

                          {/* Cells */}
                          {validSeasons.map((season: any) => {
                            const episodes =
                              allSeasonsEpisodes[season.season_number] || [];
                            const ep = episodes[rowIndex];

                            if (!ep) {
                              return (
                                <div
                                  key={`empty-${season.season_number}-${rowIndex}`}
                                  className="w-9 h-9"
                                ></div>
                              );
                            }

                            // Display Logic
                            const showAsWatched =
                              ep.is_watched && !showAllScores;

                            // Rating Color Logic
                            const ratingClass = getRatingClasses(
                              ep.vote_average,
                            );

                            return (
                              <div
                                key={ep.id}
                                className="relative group w-9 h-9"
                              >
                                <button
                                  onClick={() =>
                                    onToggleGraphEpisode(
                                      season.season_number,
                                      ep,
                                    )
                                  }
                                  className={`
                                      w-full h-full flex items-center justify-center rounded-md text-[10px] font-bold border transition-all duration-200
                                      ${
                                        showAsWatched
                                          ? "bg-skin-secondary text-skin-base border-skin-secondary hover:bg-skin-secondary/90 scale-100 shadow-sm"
                                          : `${ratingClass} hover:scale-110`
                                      }
                                  `}
                                >
                                  {showAsWatched ? (
                                    <span className="text-sm">✓</span>
                                  ) : (
                                    <span>
                                      {ep.vote_average > 0
                                        ? ep.vote_average.toFixed(1)
                                        : "?"}
                                    </span>
                                  )}
                                </button>

                                {/* Tooltip */}
                                <div
                                  className={`absolute left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-black/90 text-white text-[10px] p-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition z-50 shadow-xl border border-white/10 ${
                                    isFirstRow
                                      ? "top-full mt-2"
                                      : "bottom-full mb-2"
                                  }`}
                                >
                                  <div className="font-bold mb-0.5 line-clamp-1 text-skin-primary">
                                    {season.season_number}x{ep.episode_number}.{" "}
                                    {ep.name}
                                  </div>
                                  <div className="text-gray-400">
                                    {ep.air_date}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    },
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
