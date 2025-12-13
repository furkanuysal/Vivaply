import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { entertainmentService } from "../../features/entertainment/services/entertainmentService";
import {
  WatchStatus,
  type TmdbEpisodeDto,
} from "../../features/entertainment/types";
import { toast } from "react-toastify";
import StarRating from "../../components/StarRating";
import ProdStatusBadge from "../../features/entertainment/components/ProdStatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useWatchStatusConfig } from "../../features/entertainment/hooks/useWatchStatusConfig";
import { useTranslation } from "react-i18next";
import { gamesService } from "../../features/entertainment/services/gameService";
import { usePlayStatusConfig } from "../../features/entertainment/hooks/usePlayStatusConfig";
import { PlayStatus } from "../../features/entertainment/types";

export default function EntertainmentDetailPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const {
    STATUS_CONFIG: WATCH_STATUS_CONFIG,
    STATUS_OPTIONS: WATCH_STATUS_OPTIONS,
  } = useWatchStatusConfig(type as "tv" | "movie");
  const {
    STATUS_CONFIG: PLAY_STATUS_CONFIG,
    STATUS_OPTIONS: PLAY_STATUS_OPTIONS,
  } = usePlayStatusConfig();

  const STATUS_CONFIG =
    type === "game" ? PLAY_STATUS_CONFIG : WATCH_STATUS_CONFIG;
  const STATUS_OPTIONS =
    type === "game" ? PLAY_STATUS_OPTIONS : WATCH_STATUS_OPTIONS;
  const { t } = useTranslation(["common", "entertainment"]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<TmdbEpisodeDto[]>([]);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [reviewText, setReviewText] = useState("");

  // Dropdown Menu State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(
    null
  );

  const handleRate = async (rating: number) => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesService.rateGame(data.id, rating);
      } else {
        await entertainmentService.rateItem(
          data.id,
          type as "tv" | "movie",
          rating
        );
      }
      toast.success(t("common:messages.rate_success", { rating }));

      // Update UI
      setData((prev: any) => ({ ...prev, user_rating: rating }));

      // If not added yet, automatically added, so update status
      if (!data.user_status) {
        const newStatus =
          type === "tv" ? WatchStatus.Watching : WatchStatus.Completed;
        setData((prev: any) => ({
          ...prev,
          user_rating: rating,
          user_status: newStatus,
        }));
      }
    } catch (error: any) {
      toast.error(t("common:messages.rate_error"));
    }
  };

  // Remove from Library Function
  const handleRemoveClick = () => {
    if (!data) return;
    setConfirmTitle(t("common:dialogs.remove_from_library_title"));
    setConfirmMessage(t("common:dialogs.remove_from_library_message"));
    setOnConfirmAction(() => executeRemove);
    setIsConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const executeRemove = async () => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesService.removeGame(data.id);
      } else {
        await entertainmentService.removeFromLibrary(
          data.id,
          type as "tv" | "movie"
        );
      }
      toast.info(t("common:messages.remove_from_library_success"));

      // Update UI: Set status to undefined, so the button turns back to blue "+ Follow"
      setData((prev: any) => ({ ...prev, user_status: undefined }));
      if (type === "tv") {
        try {
          const seasonData = await entertainmentService.getTvSeasonDetail(
            Number(id),
            selectedSeason
          );
          setSeasonEpisodes(seasonData.episodes);
        } catch (err) {
          console.error("Season data could not be updated", err);
        }
      }
    } catch (error: any) {
      toast.error(t("common:messages.remove_error"));
    }
  };

  // Update Status Function
  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (!data) return;
    setIsDropdownOpen(false); // Close dropdown when selection is made

    // If the same status is selected, do nothing
    if (data.user_status === newStatus) return;

    try {
      if (!data.user_status) {
        // If not added yet, automatically added, so update status
        if (type === "game") {
          await gamesService.trackGame({
            igdbId: data.id,
            title: data.title,
            coverUrl: data.coverUrl,
            releaseDate: data.releaseDate,
            status: newStatus as PlayStatus,
          });
        } else {
          if (newStatus === WatchStatus.Completed) {
            await entertainmentService.trackItem({
              tmdbId: data.id,
              type: type as "tv" | "movie",
              title: data.display_name,
              posterPath: data.poster_path,
              date: data.display_date,
              status: WatchStatus.PlanToWatch,
            });

            await entertainmentService.updateStatus(
              data.id,
              type as "tv" | "movie",
              WatchStatus.Completed
            );
          } else {
            await entertainmentService.trackItem({
              tmdbId: data.id,
              type: type as "tv" | "movie",
              title: data.display_name,
              posterPath: data.poster_path,
              date: data.display_date,
              status: newStatus as WatchStatus,
            });
          }
        }
        toast.success(t("common:messages.track_success"));
      } else {
        // If already added, update status
        if (type === "game") {
          await gamesService.updateStatus(data.id, newStatus as PlayStatus);
        } else {
          await entertainmentService.updateStatus(
            data.id,
            type as "tv" | "movie",
            newStatus as WatchStatus
          );
        }
        toast.info(t("common:messages.status_update_success"));
      }

      // UI Update
      setData((prev: any) => ({ ...prev, user_status: newStatus }));

      // If "Completed" is selected and this is a TV series, update the season data
      if (type === "tv" && newStatus === WatchStatus.Completed) {
        try {
          const seasonData = await entertainmentService.getTvSeasonDetail(
            Number(id),
            selectedSeason
          );
          setSeasonEpisodes(seasonData.episodes);
        } catch (err) {
          console.error("Season data could not be updated", err);
        }
      }
    } catch (error: any) {
      const errorMsg =
        typeof error.response?.data === "string"
          ? error.response.data
          : t("common:messages.content_update_error");

      console.error("Update Error:", error); // Show error in console
      toast.error(errorMsg);
    }
  };

  // Load Detail
  useEffect(() => {
    const loadDetail = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        let result;
        if (type === "tv") {
          result = await entertainmentService.getTvDetail(Number(id));
        } else if (type === "movie") {
          result = await entertainmentService.getMovieDetail(Number(id));
        } else {
          const gameResult = await gamesService.getGameDetail(Number(id));

          // Normalize game data for UI (create a new object with adapted fields)
          result = {
            ...gameResult,
            user_status: gameResult.userStatus,
            user_rating: gameResult.userRating,
            user_review: gameResult.userReview,
            display_name: gameResult.title,
            poster_path: gameResult.coverUrl,
            display_date: gameResult.releaseDate,
            vote_average: gameResult.voteAverage,
          };
        }
        setData(result);
        setReviewText(result.user_review || "");

        if (type === "tv" && result.seasons?.length > 0) {
          const firstSeason =
            result.seasons.find((s: any) => s.season_number === 1) ||
            result.seasons[0];
          if (firstSeason) handleSeasonClick(firstSeason.season_number);
        }
      } catch (error) {
        toast.error(t("common:messages.content_not_found"));
        navigate("/entertainment");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [type, id, navigate]);

  const handleSeasonClick = async (seasonNum: number) => {
    if (!id) return;
    setSelectedSeason(seasonNum);
    setSeasonEpisodes([]);
    setLoadingSeason(true);
    try {
      const seasonData = await entertainmentService.getTvSeasonDetail(
        Number(id),
        seasonNum
      );
      setSeasonEpisodes(seasonData.episodes);
    } catch (error) {
      console.error("Update Error:", error);
    } finally {
      setLoadingSeason(false);
    }
  };

  const handleSaveReview = async () => {
    if (!data) return;
    try {
      if (type === "game") {
        await gamesService.addReview(data.id, reviewText);
      } else {
        await entertainmentService.addReview(
          data.id,
          type as "tv" | "movie",
          reviewText
        );
      }
      toast.success(t("common:messages.review_success"));

      setData((prev: any) => ({ ...prev, user_review: reviewText }));
    } catch (error: any) {
      toast.error(t("common:messages.review_error"));
    }
  };

  const handleToggleEpisode = async (episode: TmdbEpisodeDto) => {
    if (!id) return;
    const newStatus = !episode.is_watched;
    setSeasonEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === episode.id ? { ...ep, is_watched: newStatus } : ep
      )
    );

    try {
      await entertainmentService.toggleEpisode(
        Number(id),
        selectedSeason,
        episode.episode_number
      );
      if (newStatus)
        toast.success(
          t("entertainment:messages.watch_episode_success", {
            episodeNumber: episode.episode_number,
          })
        );
    } catch (error) {
      setSeasonEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === episode.id ? { ...ep, is_watched: !newStatus } : ep
        )
      );
      toast.error(t("common:messages.general_error"));
    }
  };

  const handleMarkSeasonWatchedClick = () => {
    if (!id) return;
    setConfirmTitle(t("entertainment:dialogs.mark_season_as_completed_title"));
    setConfirmMessage(
      t("entertainment:dialogs.mark_season_as_completed_message", {
        seasonNumber: selectedSeason,
      })
    );
    setOnConfirmAction(() => executeMarkSeasonWatched);
    setIsConfirmOpen(true);
  };

  const executeMarkSeasonWatched = async () => {
    if (!id) return;
    try {
      await entertainmentService.markSeasonWatched({
        tmdbShowId: Number(id),
        seasonNumber: selectedSeason,
      });
      toast.success(
        t("entertainment:messages.mark_season_as_completed_success", {
          seasonNumber: selectedSeason,
        })
      );

      // Update local state
      setSeasonEpisodes((prev) =>
        prev.map((ep) => ({ ...ep, is_watched: true }))
      );
    } catch (error) {
      toast.error(t("common:messages.general_error"));
    }
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20">{t("common:loading")}</div>
    );
  if (!data) return null;

  const bgImage = data.poster_path
    ? data.poster_path.startsWith("http")
      ? data.poster_path
      : `https://image.tmdb.org/t/p/original${data.poster_path}`
    : null;
  const statusConfig = STATUS_CONFIG[data.user_status] ?? {
    label: t("entertainment:status.add_to_library"),
    button: "bg-skin-primary hover:bg-skin-primary/90 text-skin-base",
  };

  return (
    <div className="text-skin-text pb-20">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
        }}
        title={confirmTitle}
        message={confirmMessage}
      />

      {bgImage && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-6xl mx-auto bg-skin-surface/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-skin-border mt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3 shrink-0">
            <img
              src={
                data.poster_path
                  ? data.poster_path.startsWith("http")
                    ? data.poster_path
                    : `https://image.tmdb.org/t/p/w500${data.poster_path}`
                  : "https://via.placeholder.com/500x750"
              }
              alt={data.display_name}
              className="w-full rounded-xl shadow-lg border border-skin-border"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-skin-primary">
              {data.display_name}
            </h1>
            <p className="text-skin-muted italic mb-6 text-lg">
              {data.tagline}
            </p>

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
                  <StarRating
                    currentRating={data.user_rating}
                    onRate={handleRate}
                  />
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
              {data.overview ||
                t("entertainment:detail.overview_not_available")}
            </div>

            {type === "game" && ( // Game Details (Platforms, etc.)
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
              {/* Action Buttons (Dropdown) */}
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
                      {STATUS_OPTIONS.map((statusValue) => (
                        <button
                          key={statusValue}
                          onClick={() => handleStatusChange(statusValue)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-skin-surface/70 transition flex justify-between items-center ${
                            data.user_status === statusValue
                              ? "text-skin-secondary font-bold bg-skin-surface/50"
                              : "text-skin-muted"
                          }`}
                        >
                          {STATUS_CONFIG[statusValue]?.label}
                          {data.user_status === statusValue && <span>✓</span>}
                        </button>
                      ))}

                      {/* Remove Button (Only show if added) */}
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
              {/* Personal Review */}
              <div className="bg-skin-surface/50 p-4 rounded-xl border border-skin-border w-full">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-skin-muted text-xs uppercase font-bold tracking-wider">
                    {t("entertainment:detail.personal_review")}
                  </p>
                  {data.user_review !== reviewText && (
                    <button
                      onClick={handleSaveReview}
                      className="text-xs bg-skin-primary hover:bg-skin-primary/90 text-skin-base px-3 py-1 rounded transition"
                    >
                      {t("common:buttons.save")}
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  className="w-full bg-skin-base/50 text-skin-text text-sm p-3 rounded-lg border border-skin-border/50 focus:border-skin-primary focus:outline-none resize-none transition"
                  placeholder={t(
                    "entertainment:detail.personal_review_placeholder"
                  )}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        {type === "tv" && data.seasons && Array.isArray(data.seasons) && (
          <div className="mt-12 animate-fade-in">
            <h3 className="text-2xl font-bold mb-6 text-skin-primary">
              {t("entertainment:detail.seasons_and_episodes")}
            </h3>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700">
              {data.seasons.map(
                (season: any) =>
                  season.season_number > 0 && (
                    <button
                      key={season.id}
                      onClick={() => handleSeasonClick(season.season_number)}
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
                    onClick={handleMarkSeasonWatchedClick}
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
                      onClick={() => handleToggleEpisode(ep)}
                      className={`border p-3 rounded-xl cursor-pointer transition group relative overflow-hidden ${
                        ep.is_watched
                          ? "bg-skin-secondary/20 border-skin-secondary/50 hover:bg-skin-secondary/30"
                          : "bg-skin-surface/50 border-skin-border hover:border-skin-primary"
                      }`}
                    >
                      {ep.is_watched && (
                        <div className="absolute top-2 right-2 text-skin-secondary bg-black/50 rounded-full p-1 z-10">
                          ✓
                        </div>
                      )}
                      <div className="aspect-video bg-skin-base rounded-lg mb-2 overflow-hidden relative">
                        {ep.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
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
                        <span className="text-[10px] bg-skin-surface/50 text-skin-primary px-1.5 py-0.5 rounded border border-skin-primary/50">
                          {ep.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
