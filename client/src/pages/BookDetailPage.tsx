import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { booksService } from "../features/knowledge/services/booksService";
import { ReadStatus } from "../features/knowledge/types";
import { toast } from "react-toastify";
import StarRating from "../components/StarRating";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { useReadStatusConfig } from "../features/knowledge/hooks/useReadStatusConfig";

export default function BookDetailPage() {
  const { id } = useParams(); // Google Book ID
  const navigate = useNavigate();
  const { t } = useTranslation(["knowledge", "common"]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { STATUS_CONFIG, STATUS_OPTIONS } = useReadStatusConfig();

  // Review Text
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

  // Rating
  const handleRate = async (rating: number) => {
    if (!data) return;
    try {
      await booksService.rateBook({
        googleBookId: data.id,
        rating,
      });
      toast.success(t("common:messages.rate_success", { rating }));
    } catch (error: any) {
      toast.error(t("common:messages.rate_error"));
    }
    setData((prev: any) => ({ ...prev, userRating: rating }));
  };

  // Remove from Library
  const handleRemoveClick = () => {
    if (!data) return;
    setConfirmTitle(t("common:dialogs.remove_from_library_title"));
    setConfirmMessage(t("common:dialogs.remove_from_library_message"));
    setOnConfirmAction(() => executeRemove);
    setIsConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const executeRemove = async () => {
    if (!data || !id) return;
    try {
      await booksService.removeBook(id);
      toast.info(t("common:dialogs.remove_from_library_success"));

      // UI Update
      setData((prev: any) => ({
        ...prev,
        userStatus: 0,
        userRating: 0,
        userReview: "",
      }));
    } catch (error: any) {
      toast.error(t("common:messages.remove_error"));
    }
  };

  // Status Change / Add
  const handleStatusChange = async (newStatus: ReadStatus) => {
    if (!data) return;
    setIsDropdownOpen(false);

    if (data.userStatus === newStatus) return;

    try {
      if (!data.userStatus || data.userStatus === 0) {
        // If not added before -> TRACK (Add)
        await booksService.trackBook({
          googleBookId: data.id,
          title: data.title,
          authors: data.authors,
          coverUrl: data.coverUrl,
          pageCount: data.pageCount,
          status: newStatus,
        });
        toast.success(t("common:messages.track_success"));
      } else {
        // If already added -> UPDATE (Update)
        await booksService.updateStatus(data.id, newStatus);
        toast.info(t("common:messages.track_success"));
      }

      // UI Update
      setData((prev: any) => ({ ...prev, userStatus: newStatus }));
    } catch (error: any) {
      toast.error(t("common:messages.general_error"));
    }
  };

  // Save Review
  const handleSaveReview = async () => {
    if (!data) return;
    try {
      await booksService.reviewBook({
        googleBookId: data.id,
        review: reviewText,
      });
      toast.success(t("common:messages.review_success"));
    } catch (error: any) {
      toast.error(t("common:messages.review_error"));
    }
    setData((prev: any) => ({ ...prev, userReview: reviewText }));
  };

  // Data Loading
  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await booksService.getBookDetail(id);
        setData(result);
        setReviewText(result.userReview || "");
      } catch (error) {
        toast.error(t("common:messages.not_found"));
        navigate("/books"); // Go back
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id, navigate]);

  if (loading)
    return (
      <div className="text-white text-center mt-20">{t("common:loading")}</div>
    );
  if (!data) return null;

  const bgImage = data.coverUrl?.replace("http:", "https:") || null;
  const statusConfig = STATUS_CONFIG[data.userStatus] ?? {
    label: t("knowledge:books.status.add_to_library"),
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  };

  return (
    <div className="text-white pb-20">
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

      {/* Background Blur */}
      {bgImage && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-5xl mx-auto bg-gray-900/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700 mt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-full md:w-1/3 shrink-0 flex justify-center md:justify-start">
            <img
              src={
                data.coverUrl?.replace("http:", "https:") ||
                "https://via.placeholder.com/300x450"
              }
              alt={data.title}
              className="w-64 md:w-full rounded-xl shadow-lg border border-gray-600 object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-blue-400">
              {data.title}
            </h1>
            <p className="text-xl text-gray-300 mb-4 font-medium">
              {data.authors?.join(", ") ||
                t("knowledge:books.detail.unknown_author")}
            </p>

            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {/* User Rating */}
              <div className="relative group">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg font-bold border border-blue-500/40 cursor-pointer flex items-center gap-2">
                  ★ {data.userRating || 0}
                </span>
                {/* Hover Stars */}
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                  <StarRating
                    currentRating={data.userRating}
                    onRate={handleRate}
                  />
                </div>
              </div>

              <span className="text-gray-400">
                {data.publishedDate?.split("-")[0]}
              </span>
              <span className="text-gray-400 font-mono text-sm border border-gray-600 px-2 py-0.5 rounded">
                {data.pageCount} {t("knowledge:books.detail.page_suffix")}
              </span>
            </div>

            {/* Summary (Google Books might return HTML) */}
            <h3 className="text-xl font-bold mb-2">
              {t("knowledge:books.detail.summary_title")}
            </h3>
            <div
              className="text-gray-300 leading-relaxed mb-8 text-sm max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 pr-2"
              dangerouslySetInnerHTML={{
                __html:
                  data.description || t("knowledge:books.detail.no_summary"),
              }}
            />

            <div className="flex flex-col gap-6">
              {/* Action Buttons */}
              <div className="flex gap-4 relative">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 min-w-[200px] justify-between ${
                      statusConfig.button
                    } ${
                      !data.userStatus
                        ? "hover:scale-105 shadow-blue-900/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {statusConfig.label}
                    </div>
                    <span className="text-xs opacity-70 ml-2">▼</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                      {STATUS_OPTIONS.map((statusValue) => (
                        <button
                          key={statusValue}
                          onClick={() => handleStatusChange(statusValue)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition flex justify-between items-center ${
                            data.userStatus === statusValue
                              ? "text-green-400 font-bold bg-gray-700/50"
                              : "text-gray-300"
                          }`}
                        >
                          {STATUS_CONFIG[statusValue]?.label}
                          {data.userStatus === statusValue && <span>✓</span>}
                        </button>
                      ))}

                      {/* Remove Button (Only show if added) */}
                      {data.userStatus !== 0 &&
                        data.userStatus !== undefined && (
                          <>
                            <div className="border-t border-gray-700 my-1"></div>
                            <button
                              onClick={handleRemoveClick}
                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-2"
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

              {/* Personal Notes Area */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 w-full">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                    {t("knowledge:books.detail.personal_notes")}
                  </p>
                  {data.userReview !== reviewText && (
                    <button
                      onClick={handleSaveReview}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                    >
                      {t("common:buttons.save")}
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full bg-gray-900/50 text-gray-200 text-sm p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none transition"
                  rows={3}
                  placeholder={t("knowledge:books.detail.notes_placeholder")}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
