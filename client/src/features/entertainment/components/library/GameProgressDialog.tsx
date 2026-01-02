import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import StarRating from "@/components/common/StarRating";
import {
  type GameContentDto,
  GameCompletionType,
  type UpdateGameProgressDto,
} from "@/features/entertainment/types";

interface GameProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameContentDto | null;
  onSave: (data: UpdateGameProgressDto) => Promise<void>;
}

export default function GameProgressDialog({
  isOpen,
  onClose,
  game,
  onSave,
}: GameProgressDialogProps) {
  const { t } = useTranslation(["entertainment", "common"]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    userPlatform: string;
    completionType: GameCompletionType;
    userPlaytime: string; // string for input handling, convert to number on submit
    rating: number;
  }>({
    userPlatform: "",
    completionType: GameCompletionType.None,
    userPlaytime: "",
    rating: 0,
  });

  useEffect(() => {
    if (game) {
      setFormData({
        userPlatform: game.userPlatform || "",
        completionType: game.completionType || GameCompletionType.None,
        userPlaytime: game.userPlaytime?.toString() || "",
        rating: game.userRating || 0,
      });
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;

    setLoading(true);
    try {
      await onSave({
        igdbId: game.id,
        userPlatform: formData.userPlatform,
        completionType: formData.completionType,
        userPlaytime: parseFloat(formData.userPlaytime) || 0,
        userRating: formData.rating,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save progress", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in !m-0 p-4">
      <div className="bg-gradient-to-br from-skin-surface to-skin-base border border-skin-border rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden relative">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-skin-primary to-skin-accent opacity-80" />

        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-skin-text tracking-tight">
              {t("common:dialogs.update_content_title")}
            </h3>
            <button
              onClick={onClose}
              className="text-skin-muted hover:text-skin-text transition p-1 hover:bg-skin-base rounded-full"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {game && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header with Cover */}
              <div className="flex gap-4 items-start">
                <div className="w-24 aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-skin-border/50 bg-skin-base relative">
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl.replace("t_thumb", "t_cover_big")}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          (e.target as HTMLImageElement)
                            .nextSibling as HTMLElement
                        ).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full absolute inset-0 items-center justify-center text-skin-muted bg-skin-base ${
                      game.coverUrl ? "hidden" : "flex"
                    }`}
                  >
                    <span className="text-xs">No Image</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-2xl font-bold text-skin-text leading-tight mb-2 truncate">
                    {game.title}
                  </h4>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-skin-base border border-skin-border text-xs font-semibold text-skin-muted uppercase tracking-wide">
                    {t("entertainment:common.game")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Platform */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:games.platform")}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.userPlatform}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userPlatform: e.target.value,
                        })
                      }
                      className="w-full appearance-none bg-skin-base hover:bg-skin-surface border border-skin-border rounded-xl px-4 py-3 text-skin-text focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary outline-none transition cursor-pointer"
                    >
                      <option value="">
                        {t("common:dialogs.select_option")}
                      </option>
                      {game.platforms?.split(",").map((platform) => {
                        const p = platform.trim();
                        return (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-skin-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Playtime */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:games.playtime")} (
                    {t("entertainment:games.hours")})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.userPlaytime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        userPlaytime: e.target.value,
                      })
                    }
                    className="w-full bg-skin-base hover:bg-skin-surface border border-skin-border rounded-xl px-4 py-3 text-skin-text focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary outline-none transition placeholder-skin-muted/50"
                    placeholder="0"
                  />
                </div>

                {/* Completion Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:games.completion")}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.completionType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          completionType: Number(
                            e.target.value
                          ) as GameCompletionType,
                        })
                      }
                      className="w-full appearance-none bg-skin-base hover:bg-skin-surface border border-skin-border rounded-xl px-4 py-3 text-skin-text focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary outline-none transition cursor-pointer"
                    >
                      <option value={GameCompletionType.None}>
                        {t("entertainment:games.completionType.none")}
                      </option>
                      <option value={GameCompletionType.MainStory}>
                        {t("entertainment:games.completionType.mainStory")}
                      </option>
                      <option value={GameCompletionType.MainPlusExtras}>
                        {t("entertainment:games.completionType.mainPlusExtras")}
                      </option>
                      <option value={GameCompletionType.Completionist}>
                        {t("entertainment:games.completionType.completionist")}
                      </option>
                      <option value={GameCompletionType.Speedrun}>
                        {t("entertainment:games.completionType.speedrun")}
                      </option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-skin-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:library.table.personal_rating")}
                  </label>
                  <div className="flex items-center justify-center h-[50px] bg-skin-base border border-skin-border rounded-xl relative group hover:bg-skin-surface transition px-2">
                    <div className="scale-90 origin-center">
                      <StarRating
                        currentRating={formData.rating}
                        onRate={(rating) =>
                          setFormData({ ...formData, rating })
                        }
                      />
                    </div>
                    {formData.rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: 0 })}
                        className="absolute -right-2 -top-2 bg-skin-surface border border-skin-border shadow-sm rounded-full p-1 text-skin-muted hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 duration-200"
                        title={t("common:buttons.clear")}
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-skin-border hover:bg-skin-base hover:border-skin-muted/50 transition text-skin-text font-medium text-sm"
                >
                  {t("common:buttons.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-skin-primary hover:bg-skin-primary/90 text-white shadow-lg shadow-skin-primary/20 hover:shadow-skin-primary/30 transition disabled:opacity-50 disabled:shadow-none flex justify-center items-center font-medium text-sm transform active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t("common:buttons.save")
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
