import { useTranslation } from "react-i18next";

interface EntertainmentReviewProps {
  reviewText: string;
  originalReview: string | undefined;
  onSave: () => void;
  onChange: (text: string) => void;
}

export default function EntertainmentReview({
  reviewText,
  originalReview,
  onSave,
  onChange,
}: EntertainmentReviewProps) {
  const { t } = useTranslation(["common", "entertainment"]);

  return (
    <div className="bg-skin-surface/50 p-4 rounded-xl border border-skin-border w-full mt-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-skin-muted text-xs uppercase font-bold tracking-wider">
          {t("entertainment:detail.personal_review")}
        </p>
        {originalReview !== reviewText && (
          <button
            onClick={onSave}
            className="text-xs bg-skin-primary hover:bg-skin-primary/90 text-skin-base px-3 py-1 rounded transition"
          >
            {t("common:buttons.save")}
          </button>
        )}
      </div>
      <textarea
        rows={3}
        className="w-full bg-skin-base/50 text-skin-text text-sm p-3 rounded-lg border border-skin-border/50 focus:border-skin-primary focus:outline-none resize-none transition"
        placeholder={t("entertainment:detail.personal_review_placeholder")}
        value={reviewText}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
