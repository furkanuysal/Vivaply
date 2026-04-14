import { useTranslation } from "react-i18next";
import type { ReadStatus } from "@/features/knowledge/types";

interface StatusConfig {
  label: string;
  button: string;
}

interface BookStatusDropdownProps {
  isOpen: boolean;
  currentStatus?: number;
  statusConfig: StatusConfig;
  statusOptions: ReadStatus[];
  allStatusConfigs: Record<number, StatusConfig>;
  onToggle: () => void;
  onStatusChange: (status: ReadStatus) => void;
  onRemove: () => void;
}

export default function BookStatusDropdown({
  isOpen,
  currentStatus,
  statusConfig,
  statusOptions,
  allStatusConfigs,
  onToggle,
  onStatusChange,
  onRemove,
}: BookStatusDropdownProps) {
  const { t } = useTranslation("common");

  return (
    <div className="relative w-full md:w-auto">
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition md:w-auto ${
          statusConfig.button
        } ${!currentStatus ? "hover:scale-105 shadow-skin-primary/50" : ""}`}
      >
        <div className="flex items-center gap-2">{statusConfig.label}</div>
        <span className="ml-2 text-xs opacity-70">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full animate-fade-in overflow-hidden rounded-xl border border-skin-border bg-skin-surface shadow-xl md:w-56">
          {statusOptions.map((statusValue) => (
            <button
              key={statusValue}
              onClick={() => onStatusChange(statusValue)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-skin-surface/70 ${
                currentStatus === statusValue
                  ? "bg-skin-surface/50 font-bold text-skin-secondary"
                  : "text-skin-muted"
              }`}
            >
              {allStatusConfigs[statusValue]?.label}
              {currentStatus === statusValue && <span>✓</span>}
            </button>
          ))}

          {currentStatus !== 0 && currentStatus !== undefined && (
            <>
              <div className="my-1 border-t border-skin-border"></div>
              <button
                onClick={onRemove}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <span>🗑️</span>
                {t("buttons.remove_from_library")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
