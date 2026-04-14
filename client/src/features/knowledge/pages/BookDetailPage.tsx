import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/ui";
import {
  BookHero,
  BookNotesPanel,
  BookProgressWidget,
} from "@/features/knowledge/components/detail";
import { useBookDetail } from "@/features/knowledge/hooks/useBookDetail";
import { useReadStatusConfig } from "@/features/knowledge/hooks/useReadStatusConfig";

export default function BookDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation(["knowledge", "common"]);
  const { STATUS_CONFIG, STATUS_OPTIONS } = useReadStatusConfig();
  const {
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
  } = useBookDetail(id);

  if (loading) {
    return (
      <div className="mt-20 text-center text-white">{t("common:loading")}</div>
    );
  }

  if (!book) return null;

  const progressPercent =
    book.pageCount && book.pageCount > 0
      ? Math.min((currentPageInput / book.pageCount) * 100, 100)
      : 0;

  const bgImage = book.coverUrl?.replace("http:", "https:") || null;
  const statusConfig = STATUS_CONFIG[book.userStatus] ?? {
    label: t("knowledge:books.status.add_to_library"),
    button: "bg-skin-primary hover:bg-skin-primary/90 text-skin-base",
  };

  return (
    <div className="pb-20 text-skin-text">
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => onConfirmAction?.()}
        title={confirmTitle}
        message={confirmMessage}
      />

      {bgImage && (
        <div
          className="fixed inset-0 -z-10 h-full w-full bg-cover bg-center opacity-20 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="glass relative mx-auto mt-6 max-w-5xl rounded-2xl p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <BookHero
            book={book}
            isStatusDropdownOpen={isDropdownOpen}
            statusConfig={statusConfig}
            statusOptions={STATUS_OPTIONS}
            allStatusConfigs={STATUS_CONFIG}
            onToggleStatusDropdown={() => setIsDropdownOpen((prev) => !prev)}
            onStatusChange={handleStatusChange}
            onRemove={handleRemoveClick}
            onRate={handleRate}
          />

          <div className="order-3 flex flex-col justify-start md:col-span-4 md:row-start-2">
            <BookProgressWidget
              progressPercent={book.userStatus !== 0 ? progressPercent : 0}
              pageCount={book.pageCount ?? 0}
              currentPageInput={book.userStatus !== 0 ? currentPageInput : 0}
              onPageChange={setCurrentPageInput}
              onSave={handleUpdateProgress}
              onReset={() => setCurrentPageInput(book.currentPage || 0)}
              showSave={currentPageInput !== book.currentPage}
              isDisabled={book.userStatus === 0 || book.userStatus === undefined}
            />
          </div>

          <div className="order-4 md:col-span-8 md:row-start-2">
            <BookNotesPanel
              reviewText={reviewText}
              originalReview={book.userReview}
              onChange={setReviewText}
              onSave={handleSaveReview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
