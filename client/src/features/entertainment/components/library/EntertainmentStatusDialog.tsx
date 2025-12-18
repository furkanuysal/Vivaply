import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import {
  type TmdbContentDto,
  WatchStatus,
  type UpdateEntertainmentStatusDto,
} from "../../types";
import { useWatchStatusConfig } from "../../hooks/useWatchStatusConfig";
import StarRating from "../../../../components/common/StarRating";

interface EntertainmentStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: TmdbContentDto | null;
  type: "tv" | "movie";
  onSave: (data: UpdateEntertainmentStatusDto) => Promise<void>;
}

export default function EntertainmentStatusDialog({
  isOpen,
  onClose,
  content,
  type,
  onSave,
}: EntertainmentStatusDialogProps) {
  const { t } = useTranslation(["entertainment", "common"]);
  const { STATUS_CONFIG } = useWatchStatusConfig(type);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    status: WatchStatus;
    rating: number;
    review: string;
  }>({
    status: WatchStatus.None,
    rating: 0,
    review: "",
  });

  useEffect(() => {
    if (content) {
      setFormData({
        status: content.user_status,
        rating: content.user_rating || 0,
        review: content.user_review || "",
      });
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setLoading(true);
    try {
      await onSave({
        tmdbId: content.id,
        type: type,
        status: formData.status,
        rating: formData.rating,
        review: formData.review,
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

          {content && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header with Poster */}
              <div className="flex gap-4 items-start">
                <div className="w-24 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-skin-border/50 bg-skin-base relative">
                  {content.poster_path ? (
                    <img
                      src={
                        content.poster_path
                          ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
                          : "https://via.placeholder.com/500x750?text=No+Image"
                      }
                      alt={content.title || content.name}
                      className="w-full h-full object-cover"
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
                      content.poster_path ? "hidden" : "flex"
                    }`}
                  >
                    <span className="text-xs">No Image</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-2xl font-bold text-skin-text leading-tight mb-2 truncate">
                    {type === "movie"
                      ? content.title || content.name
                      : content.name || content.title}
                  </h4>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-skin-base border border-skin-border text-xs font-semibold text-skin-muted uppercase tracking-wide">
                    {t(`entertainment:common.${type}`)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:library.table.user_status")}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: Number(e.target.value) as WatchStatus,
                        })
                      }
                      className="w-full appearance-none bg-skin-base hover:bg-skin-surface border border-skin-border rounded-xl px-4 py-3 text-skin-text focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary outline-none transition cursor-pointer"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        if (key === "0") return null;
                        return (
                          <option key={key} value={key}>
                            {config.label}
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

                {/* Rating */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-skin-text/80">
                    {t("entertainment:library.table.personal_rating")}
                  </label>
                  <div className="flex items-center justify-center h-[50px] bg-skin-base border border-skin-border rounded-xl relative group hover:bg-skin-surface transition px-2">
                    <div className="scale-90 origin-center">
                      <StarRating
                        currentRating={formData.rating}
                        onRate={(rating: number) =>
                          setFormData({ ...formData, rating })
                        }
                      />
                    </div>
                    {formData.rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: 0 })}
                        className="absolute -right-2 -top-2 bg-skin-surface border border-skin-border shadow-sm rounded-full p-1 text-skin-muted hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 duration-200"
                        title={
                          t("entertainment:library.clear_rating") ||
                          "Clear Rating"
                        }
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Review */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-skin-text/80">
                  {t("entertainment:detail.personal_review")}
                </label>
                <textarea
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      review: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full bg-skin-base hover:bg-skin-surface border border-skin-border rounded-xl px-4 py-3 text-skin-text focus:ring-2 focus:ring-skin-primary/50 focus:border-skin-primary outline-none transition resize-none placeholder-skin-muted/50 text-sm leading-relaxed"
                  placeholder={t(
                    "entertainment:detail.personal_review_placeholder"
                  )}
                />
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
