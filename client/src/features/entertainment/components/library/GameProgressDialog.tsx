import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import {
  type GameContentDto,
  GameCompletionType,
  type UpdateGameProgressDto,
} from "../../types";

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
  }>({
    userPlatform: "",
    completionType: GameCompletionType.None,
    userPlaytime: "",
  });

  useEffect(() => {
    if (game) {
      setFormData({
        userPlatform: game.userPlatform || "",
        completionType: game.completionType || GameCompletionType.None,
        userPlaytime: game.userPlaytime?.toString() || "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close could be added here if desired */}
      <div className="bg-skin-surface border border-skin-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-skin-text">
            {t("common:dialogs.update_content_title")}
          </h3>
          <button
            onClick={onClose}
            className="text-skin-muted hover:text-skin-text transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {game && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Game Title Display */}
            <div className="p-3 bg-skin-surface rounded-lg border border-skin-border/50 text-sm font-medium text-skin-text">
              {game.title}
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-skin-text mb-1">
                {t("entertainment:games.platform")}
              </label>
              <select
                value={formData.userPlatform}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userPlatform: e.target.value,
                  })
                }
                className="w-full bg-skin-base border-skin-border rounded-lg px-4 py-2 text-skin-text focus:ring-2 focus:ring-skin-primary focus:border-transparent outline-none transition"
              >
                <option value="">{t("common:dialogs.select_option")}</option>
                {game.platforms?.split(",").map((platform) => {
                  const p = platform.trim();
                  return (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Completion Type */}
            <div>
              <label className="block text-sm font-medium text-skin-text mb-1">
                {t("entertainment:games.completion")}
              </label>
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
                className="w-full bg-skin-base border-skin-border rounded-lg px-4 py-2 text-skin-text focus:ring-2 focus:ring-skin-primary focus:border-transparent outline-none transition"
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
            </div>

            {/* Playtime */}
            <div>
              <label className="block text-sm font-medium text-skin-text mb-1">
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
                className="w-full bg-skin-base border-skin-border rounded-lg px-4 py-2 text-skin-text focus:ring-2 focus:ring-skin-primary focus:border-transparent outline-none transition"
                placeholder="0"
              />
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-skin-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-skin-border hover:bg-skin-base transition text-skin-text"
              >
                {t("common:buttons.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-skin-primary text-white hover:bg-skin-primary/90 transition disabled:opacity-50 flex justify-center items-center"
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
  );
}
