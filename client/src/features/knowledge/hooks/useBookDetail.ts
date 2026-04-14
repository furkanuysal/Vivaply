import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { booksApi } from "@/features/knowledge/api/booksApi";
import { ReadStatus, type BookContentDto } from "@/features/knowledge/types";

export function useBookDetail(id?: string) {
  const navigate = useNavigate();
  const { t } = useTranslation(["knowledge", "common"]);
  const [book, setBook] = useState<BookContentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(
    null,
  );

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const result = await booksApi.getBookDetail(id);
        setBook(result);
        setReviewText(result.userReview || "");
        setCurrentPageInput(result.currentPage || 0);
      } catch {
        toast.error(t("common:messages.content_not_found"));
        navigate("/knowledge");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, navigate, t]);

  const handleRate = async (rating: number) => {
    if (!book) return;

    try {
      await booksApi.rateBook({
        googleBookId: book.id,
        rating,
      });

      if (rating > 0) {
        toast.success(t("common:messages.rate_success", { rating }));
      } else {
        toast.success(t("common:messages.save_success"));
      }

      setBook((prev) =>
        prev
          ? {
              ...prev,
              userRating: rating > 0 ? rating : undefined,
            }
          : prev,
      );
    } catch {
      toast.error(t("common:messages.rate_error"));
    }
  };

  const handleUpdateProgress = async () => {
    if (!book) return;

    try {
      await booksApi.updateProgress({
        googleBookId: book.id,
        currentPage: Number(currentPageInput),
      });

      setBook((prev) =>
        prev
          ? {
              ...prev,
              currentPage: Number(currentPageInput),
              userStatus:
                Number(currentPageInput) >= (prev.pageCount ?? 0)
                  ? ReadStatus.Completed
                  : prev.userStatus,
            }
          : prev,
      );

      toast.success(t("common:messages.update_progress_success"));
    } catch {
      toast.error(t("common:messages.update_progress_error"));
    }
  };

  const executeRemove = async () => {
    if (!book || !id) return;

    try {
      await booksApi.removeBook(id);
      toast.info(t("common:messages.remove_from_library_success"));

      setBook((prev) =>
        prev
          ? {
              ...prev,
              userStatus: ReadStatus.None,
              userRating: 0,
              userReview: "",
            }
          : prev,
      );
    } catch {
      toast.error(t("common:messages.remove_error"));
    }
  };

  const handleRemoveClick = () => {
    if (!book) return;

    setConfirmTitle(t("common:dialogs.remove_from_library_title"));
    setConfirmMessage(t("common:dialogs.remove_from_library_message"));
    setOnConfirmAction(() => executeRemove);
    setIsConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const handleStatusChange = async (newStatus: ReadStatus) => {
    if (!book) return;

    setIsDropdownOpen(false);
    if (book.userStatus === newStatus) return;

    try {
      if (book.userStatus === ReadStatus.None) {
        await booksApi.trackBook({
          googleBookId: book.id,
          title: book.title,
          authors: book.authors,
          coverUrl: book.coverUrl,
          pageCount: book.pageCount ?? 0,
          status: newStatus,
        });
        toast.success(t("common:messages.track_success"));
      } else {
        await booksApi.updateStatus(book.id, newStatus);
        toast.info(t("common:messages.track_success"));
      }

      setBook((prev) => (prev ? { ...prev, userStatus: newStatus } : prev));
    } catch {
      toast.error(t("common:messages.general_error"));
    }
  };

  const handleSaveReview = async () => {
    if (!book) return;

    try {
      await booksApi.reviewBook({
        googleBookId: book.id,
        review: reviewText,
      });
      toast.success(t("common:messages.review_success"));
    } catch {
      toast.error(t("common:messages.review_error"));
    }

    setBook((prev) => (prev ? { ...prev, userReview: reviewText } : prev));
  };

  return {
    book,
    loading,
    reviewText,
    setReviewText,
    currentPageInput,
    setCurrentPageInput,
    isDropdownOpen,
    setIsDropdownOpen,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmTitle,
    confirmMessage,
    onConfirmAction,
    handleRate,
    handleUpdateProgress,
    handleRemoveClick,
    handleStatusChange,
    handleSaveReview,
  };
}
