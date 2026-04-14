import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-skin-surface border border-skin-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100">
        <h3 className="text-xl font-bold text-skin-text mb-2">{title}</h3>
        <p className="text-skin-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-skin-muted hover:bg-skin-text/5 hover:text-skin-text transition font-medium"
          >
            {t("buttons.cancel")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-skin-primary hover:bg-skin-primary/90 text-skin-base shadow-lg shadow-skin-primary/20 transition font-bold"
          >
            {t("buttons.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
