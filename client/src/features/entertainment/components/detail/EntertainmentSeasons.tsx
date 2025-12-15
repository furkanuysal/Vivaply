import { useTranslation } from "react-i18next";
import type { TmdbEpisodeDto } from "../../types";
import { getRatingClasses } from "../../utils/ratingUtils";

interface EntertainmentSeasonsProps {
  seasons: any[];
  selectedSeason: number;
  loadingSeason: boolean;
  seasonEpisodes: TmdbEpisodeDto[];
  onSeasonSelect: (seasonNum: number) => void;
  onToggleEpisode: (episode: TmdbEpisodeDto) => void;
  onMarkSeasonWatched: () => void;
}

export default function EntertainmentSeasons({
  seasons,
  selectedSeason,
  loadingSeason,
  seasonEpisodes,
  onSeasonSelect,
  onToggleEpisode,
  onMarkSeasonWatched,
}: EntertainmentSeasonsProps) {
  const { t } = useTranslation(["common", "entertainment"]);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700">
        {seasons.map(
          (season: any) =>
            season.season_number > 0 && (
              <button
                key={season.id}
                onClick={() => onSeasonSelect(season.season_number)}
                className={`min-w-[60px] px-4 py-2 rounded-lg font-bold transition ${
                  selectedSeason === season.season_number
                    ? "bg-skin-primary text-skin-base shadow-lg shadow-skin-primary/30"
                    : "bg-skin-surface text-skin-muted hover:bg-skin-surface/70 hover:text-skin-text"
                }`}
              >
                {t("entertainment:detail.season_short")}
                {season.season_number}
              </button>
            )
        )}
      </div>

      {loadingSeason ? (
        <div className="text-center py-10 text-skin-muted">
          {t("common:loading")}
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={onMarkSeasonWatched}
              className="text-xs bg-skin-secondary/10 hover:bg-skin-secondary/20 text-skin-secondary border border-skin-secondary/50 px-3 py-1.5 rounded-lg transition flex items-center gap-2"
            >
              <span>✓</span>{" "}
              {t("entertainment:detail.mark_season_as_completed")}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {seasonEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => onToggleEpisode(ep)}
                className={`border p-3 rounded-xl cursor-pointer transition group relative ${
                  ep.is_watched
                    ? "bg-skin-secondary/20 border-skin-secondary/50 hover:bg-skin-secondary/30"
                    : "bg-skin-surface/50 border-skin-border hover:border-skin-primary"
                }`}
              >
                <div className="aspect-video bg-skin-base rounded-lg mb-2 overflow-hidden relative">
                  {ep.still_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${
                        ep.still_path.startsWith("/") ? "" : "/"
                      }${ep.still_path}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                      alt={ep.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-skin-muted text-xs">
                      {t("entertainment:detail.no_picture")}
                    </div>
                  )}
                  {ep.is_watched && (
                    <div className="absolute inset-0 bg-skin-secondary/20 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-skin-secondary font-bold text-2xl drop-shadow-md">
                        ✓
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`font-bold text-sm ${
                        ep.is_watched
                          ? "text-skin-secondary"
                          : "text-skin-primary"
                      }`}
                    >
                      #{ep.episode_number}
                    </span>
                    <h4
                      className="text-xs font-medium text-skin-text line-clamp-1"
                      title={ep.name}
                    >
                      {ep.name}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border min-w-[32px] text-center ${getRatingClasses(
                        ep.vote_average
                      )}`}
                    >
                      {ep.vote_average.toFixed(1)}
                    </span>
                    {ep.is_watched && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border min-w-[32px] text-center font-bold bg-skin-secondary text-skin-base border-skin-secondary shadow-sm">
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-black/90 text-white text-[10px] p-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition z-50 shadow-xl border border-white/10 top-full mt-2 hidden group-hover:block">
                  <div className="font-bold mb-0.5 line-clamp-1 text-skin-primary">
                    {selectedSeason}x{ep.episode_number}. {ep.name}
                  </div>
                  <div className="text-gray-400">{ep.air_date}</div>
                  <div className="text-gray-500 line-clamp-3 mt-1 text-[9px] font-normal leading-tight max-w-[180px]">
                    {ep.overview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
