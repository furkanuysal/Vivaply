import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface BookProgressWidgetProps {
  progressPercent: number;
  pageCount: number;
  currentPageInput: number;
  onPageChange: (val: number) => void;
  onSave: () => void;
  onReset: () => void;
  showSave: boolean;
  isDisabled?: boolean;
}

export default function BookProgressWidget({
  progressPercent,
  pageCount,
  currentPageInput,
  onPageChange,
  onSave,
  onReset,
  showSave,
  isDisabled = false,
}: BookProgressWidgetProps) {
  const { t } = useTranslation(["knowledge", "common"]);

  return (
    <div
      className={`flex flex-row items-center justify-between gap-4 rounded-xl border border-skin-border/50 bg-skin-surface/30 p-4 shadow-lg backdrop-blur-sm transition-all md:flex-col md:justify-center md:gap-4 md:rounded-2xl md:p-6 ${
        isDisabled ? "pointer-events-none select-none opacity-50 grayscale" : ""
      }`}
    >
      <div className="flex shrink-0 items-center gap-4 md:flex-col md:gap-4">
        <h3 className="hidden text-xs font-bold uppercase tracking-wider text-skin-muted md:block">
          {t("knowledge:books.detail.progress_title")}
        </h3>

        <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20">
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

      <div className="flex w-full flex-col items-end gap-2 md:items-center">
        <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-skin-muted md:hidden">
          {t("knowledge:books.detail.progress_title")}
        </h3>

        <InputControl
          pageCount={pageCount}
          currentPageInput={currentPageInput}
          onPageChange={(val) => !isDisabled && onPageChange(val)}
        />
        {!isDisabled ? (
          <ActionButtons
            visible={showSave}
            onSave={onSave}
            onReset={onReset}
          />
        ) : (
          <div className="flex h-8 items-center text-center text-[10px] text-skin-muted md:mt-2">
            {t("knowledge:books.detail.track_to_progress")}
          </div>
        )}
      </div>
    </div>
  );
}

function CircularProgress({
  percent,
  onUpdate,
}: {
  percent: number;
  onUpdate: (val: number) => void;
}) {
  const circleRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (
    e:
      | React.MouseEvent<HTMLDivElement>
      | MouseEvent
      | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
      className="relative h-full w-full touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
    >
      <svg
        className="pointer-events-none h-full w-full -rotate-90 transform"
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-skin-secondary md:text-lg">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

function InputControl({
  pageCount,
  currentPageInput,
  onPageChange,
}: {
  pageCount: number;
  currentPageInput: number;
  onPageChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-skin-border/30 bg-skin-base/50 p-1">
      <input
        type="number"
        min={0}
        max={pageCount}
        className="w-12 bg-transparent text-center text-xs font-bold text-skin-text focus:outline-none md:w-14 md:text-sm"
        value={currentPageInput}
        onChange={(e) => onPageChange(Number(e.target.value))}
      />
      <span className="border-l border-skin-border/30 pl-2 pr-2 text-[10px] text-skin-muted md:text-xs">
        / {pageCount}
      </span>
    </div>
  );
}

function ActionButtons({
  visible,
  onSave,
  onReset,
}: {
  visible: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation("common");

  if (!visible) return null;

  return (
    <div className="flex w-full items-center justify-end gap-2 animate-fade-in md:mt-2 md:justify-center">
      <button
        onClick={onReset}
        className="group flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-skin-border/50 bg-skin-base/50 font-bold text-skin-muted transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-95"
        title={t("buttons.cancel")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 transition-transform group-hover:-rotate-180"
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
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-skin-secondary px-3 py-1.5 text-xs font-bold text-skin-base shadow-lg shadow-skin-secondary/20 transition-all hover:bg-skin-secondary/90 active:scale-95 md:flex-none"
      >
        <span>{t("buttons.save")}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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
}
