import { useTranslation } from "react-i18next";

interface BookNotesPanelProps {
  reviewText: string;
  originalReview?: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export default function BookNotesPanel({
  reviewText,
  originalReview,
  onChange,
  onSave,
}: BookNotesPanelProps) {
  const { t } = useTranslation(["knowledge", "common"]);

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-skin-border/40 bg-skin-surface/30 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-skin-muted">
          {t("knowledge:books.detail.personal_notes")}
        </p>
        {originalReview !== reviewText && (
          <button
            onClick={onSave}
            className="rounded bg-skin-primary px-3 py-1 text-xs text-skin-base transition hover:bg-skin-primary/90"
          >
            {t("common:buttons.save")}
          </button>
        )}
      </div>
      <textarea
        className="h-32 flex-1 resize-none rounded-lg border border-skin-border/50 bg-white/90 p-3 text-sm text-gray-800 placeholder-gray-400 transition focus:border-skin-primary focus:outline-none md:h-full"
        placeholder={t("knowledge:books.detail.notes_placeholder")}
        value={reviewText}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
