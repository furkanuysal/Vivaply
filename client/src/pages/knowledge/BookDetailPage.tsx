import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { booksService } from "../../features/knowledge/services/booksService";
import { ReadStatus } from "../../features/knowledge/types";
import { toast } from "react-toastify";
import StarRating from "../../components/common/StarRating";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { useReadStatusConfig } from "../../features/knowledge/hooks/useReadStatusConfig";

const BookProgressWidget = ({
  progressPercent,
  pageCount,
  currentPageInput,
  onPageChange,
  onSave,
  onReset,
  showSave,
  t,
  isDisabled = false,
}: {
  progressPercent: number;
  pageCount: number;
  currentPageInput: number;
  onPageChange: (val: number) => void;
  onSave: () => void;
  onReset: () => void;
  showSave: boolean;
  t: any;
  isDisabled?: boolean;
}) => {
  return (
    <div
      className={`flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 bg-skin-surface/30 backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl border border-skin-border/50 w-full shadow-lg transition-all ${
        isDisabled ? "opacity-50 grayscale pointer-events-none select-none" : ""
      }`}
    >
      <div className="flex items-center gap-4 md:flex-col md:gap-4 shrink-0">
        <h3 className="hidden md:block text-xs font-bold uppercase text-skin-muted tracking-wider">
          {t("knowledge:books.detail.progress_title")}
        </h3>

        <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
          <CircularProgress
            percent={progressPercent}
            onUpdate={(newPercent) => {
              if (isDisabled) return;
              const newPage = Math.round((newPercent / 100) * pageCount);
              onPageChange(Math.min(newPage, pageCount));
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-end md:items-center gap-2 w-full">
        <h3 className="md:hidden text-[10px] font-bold uppercase text-skin-muted tracking-wider mb-1">
          {t("knowledge:books.detail.progress_title")}
        </h3>

        <InputControl
          pageCount={pageCount}
          currentPageInput={currentPageInput}
          onPageChange={(val: number) => !isDisabled && onPageChange(val)}
        />
        {!isDisabled ? (
          <ActionButtons
            visible={showSave}
            onSave={onSave}
            onReset={onReset}
            t={t}
          />
        ) : (
          <div className="h-8 md:mt-2 text-[10px] text-skin-muted text-center flex items-center">
            {t("knowledge:books.detail.track_to_progress")}
          </div>
        )}
      </div>
    </div>
  );
};

const CircularProgress = ({
  percent,
  onUpdate,
}: {
  percent: number;
  onUpdate: (val: number) => void;
}) => {
  const circleRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (e: any) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    const angleRad = Math.atan2(deltaY, deltaX);
    let angleDeg = (angleRad * 180) / Math.PI;
    angleDeg += 90;
    if (angleDeg < 0) angleDeg += 360;

    const newPercent = Math.min(Math.max((angleDeg / 360) * 100, 0), 100);
    onUpdate(newPercent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleInteraction(e);
    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      handleInteraction(ev);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={circleRef}
      className="relative w-full h-full touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => handleInteraction(e)}
      onTouchMove={(e) => handleInteraction(e)}
    >
      <svg
        className="w-full h-full transform -rotate-90 pointer-events-none"
        viewBox="0 0 128 128"
      >
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-skin-text opacity-20"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={351.86}
          strokeDashoffset={351.86 - (351.86 * percent) / 100}
          className="text-skin-secondary transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm md:text-lg font-bold text-skin-secondary">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
};

const InputControl = ({ pageCount, currentPageInput, onPageChange }: any) => (
  <div className="flex items-center gap-2 bg-skin-base/50 rounded-lg p-1 border border-skin-border/30">
    <input
      type="number"
      min={0}
      max={pageCount}
      className="w-12 md:w-14 text-xs md:text-sm bg-transparent text-center font-bold text-skin-text focus:outline-none"
      value={currentPageInput}
      onChange={(e) => onPageChange(Number(e.target.value))}
    />
    <span className="text-[10px] md:text-xs text-skin-muted pr-2 border-l border-skin-border/30 pl-2">
      / {pageCount}
    </span>
  </div>
);

const ActionButtons = ({ visible, onSave, onReset, t }: any) => {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 animate-fade-in w-full md:mt-2 justify-end md:justify-center">
      <button
        onClick={onReset}
        className="flex-none flex items-center justify-center bg-skin-base/50 hover:bg-red-500/10 hover:text-red-500 text-skin-muted border border-skin-border/50 font-bold transition-all active:scale-95 group w-8 h-8 rounded-lg"
        title={t("common:buttons.cancel")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 transition-transform group-hover:-rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <button
        onClick={onSave}
        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-skin-secondary hover:bg-skin-secondary/90 text-skin-base font-bold shadow-lg shadow-skin-secondary/20 transition-all active:scale-95 px-3 py-1.5 text-xs rounded-lg"
      >
        <span>{t("common:buttons.save")}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>
    </div>
  );
};

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["knowledge", "common"]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { STATUS_CONFIG, STATUS_OPTIONS } = useReadStatusConfig();
  const [reviewText, setReviewText] = useState("");
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  // Progress
  const handleUpdateProgress = async () => {
    if (!data) return;
    try {
      await booksService.updateProgress({
        googleBookId: data.id,
        currentPage: Number(currentPageInput),
      });
      if (Number(currentPageInput) >= data.pageCount) {
        setData((prev: any) => ({
          ...prev,
          currentPage: Number(currentPageInput),
          userStatus: ReadStatus.Completed,
        }));
      } else {
        setData((prev: any) => ({
          ...prev,
          currentPage: Number(currentPageInput),
        }));
      }
      toast.success(t("common:messages.update_progress_success"));
    } catch (error: any) {
      toast.error(t("common:messages.update_progress_error"));
    }
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
      toast.info(t("common:messages.remove_from_library_success"));

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
        setCurrentPageInput(result.currentPage || 0);
      } catch (error) {
        toast.error(t("common:messages.content_not_found"));
        navigate("/books");
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

  const progressPercent =
    data.pageCount > 0
      ? Math.min((currentPageInput / data.pageCount) * 100, 100)
      : 0;

  const bgImage = data.coverUrl?.replace("http:", "https:") || null;
  const statusConfig = STATUS_CONFIG[data.userStatus] ?? {
    label: t("knowledge:books.status.add_to_library"),
    button: "bg-skin-primary hover:bg-skin-primary/90 text-skin-base",
  };

  return (
    <div className="text-skin-text pb-20">
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => onConfirmAction && onConfirmAction()}
        title={confirmTitle}
        message={confirmMessage}
      />

      {bgImage && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-5xl mx-auto bg-skin-surface/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-skin-border mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Book Cover */}
          <div className="order-1 md:col-span-4 md:row-start-1 flex justify-center md:justify-start">
            <img
              src={
                data.coverUrl?.replace("http:", "https:") ||
                "https://via.placeholder.com/300x450"
              }
              alt={data.title}
              className="w-48 md:w-full rounded-xl shadow-lg border border-skin-border object-cover"
            />
          </div>

          {/* Book Details & Buttons */}
          <div className="order-2 md:col-span-8 md:row-start-1">
            <h1 className="text-4xl font-bold mb-2 text-skin-primary">
              {data.title}
            </h1>
            <p className="text-xl text-skin-muted mb-4 font-medium">
              {data.authors?.join(", ") ||
                t("knowledge:books.detail.unknown_author")}
            </p>

            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative group">
                <span className="bg-skin-primary/20 text-skin-primary px-3 py-1 rounded-lg font-bold border border-skin-primary/40 cursor-pointer flex items-center gap-2">
                  ★ {data.userRating || 0}
                </span>
                <div className="absolute top-full left-0 mt-2 bg-skin-surface border border-skin-border p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                  <StarRating
                    currentRating={data.userRating}
                    onRate={handleRate}
                  />
                </div>
              </div>
              <span className="text-skin-muted">
                {data.publishedDate?.split("-")[0]}
              </span>
              <span className="text-skin-muted font-mono text-sm border border-skin-border px-2 py-0.5 rounded">
                {data.pageCount} {t("knowledge:books.detail.page_suffix")}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">
              {t("knowledge:books.detail.summary_title")}
            </h3>
            <div
              className="text-skin-muted leading-relaxed mb-8 text-sm max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-skin-primary pr-2"
              dangerouslySetInnerHTML={{
                __html:
                  data.description || t("knowledge:books.detail.no_summary"),
              }}
            />

            {/* Action Dropdown Button */}
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 justify-between ${
                  statusConfig.button
                } ${
                  !data.userStatus
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
                <div className="absolute top-full left-0 mt-2 w-full md:w-56 bg-skin-surface border border-skin-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                  {STATUS_OPTIONS.map((statusValue) => (
                    <button
                      key={statusValue}
                      onClick={() => handleStatusChange(statusValue)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-skin-surface/70 transition flex justify-between items-center ${
                        data.userStatus === statusValue
                          ? "text-skin-secondary font-bold bg-skin-surface/50"
                          : "text-skin-muted"
                      }`}
                    >
                      {STATUS_CONFIG[statusValue]?.label}
                      {data.userStatus === statusValue && <span>✓</span>}
                    </button>
                  ))}
                  {data.userStatus !== 0 && data.userStatus !== undefined && (
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

          {/* Progress Widget */}
          <div className="order-3 md:col-span-4 md:row-start-2 flex flex-col justify-start">
            <BookProgressWidget
              progressPercent={data.userStatus !== 0 ? progressPercent : 0}
              pageCount={data.pageCount}
              currentPageInput={data.userStatus !== 0 ? currentPageInput : 0}
              onPageChange={setCurrentPageInput}
              onSave={handleUpdateProgress}
              onReset={() => setCurrentPageInput(data.currentPage || 0)}
              showSave={currentPageInput !== data.currentPage}
              t={t}
              isDisabled={
                data.userStatus === 0 || data.userStatus === undefined
              }
            />
          </div>

          {/* Personal Notes */}
          <div className="order-4 md:col-span-8 md:row-start-2">
            <div className="bg-skin-surface/50 p-4 rounded-xl border border-skin-border w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <p className="text-skin-muted text-xs uppercase font-bold tracking-wider">
                  {t("knowledge:books.detail.personal_notes")}
                </p>
                {data.userReview !== reviewText && (
                  <button
                    onClick={handleSaveReview}
                    className="text-xs bg-skin-primary hover:bg-skin-primary/90 text-skin-base px-3 py-1 rounded transition"
                  >
                    {t("common:buttons.save")}
                  </button>
                )}
              </div>
              <textarea
                className="w-full bg-white/90 text-gray-800 placeholder-gray-400 text-sm p-3 rounded-lg border border-skin-border/50 focus:border-skin-primary focus:outline-none resize-none transition h-32 md:h-full flex-1"
                placeholder={t("knowledge:books.detail.notes_placeholder")}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
