import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";

interface ComposerEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function ComposerEmojiPicker({
  onSelect,
}: ComposerEmojiPickerProps) {
  const { t } = useTranslation("feed");
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !wrapperRef.current) {
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    const pickerHeight = 380;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < pickerHeight + 24 && spaceAbove > spaceBelow) {
      setPlacement("top");
      return;
    }

    setPlacement("bottom");
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    setOpen(false);
  };

  const pickerStyle = useMemo(
    () =>
      ({
        "--epr-bg-color": "rgb(var(--color-bg-surface-rgb))",
        "--epr-picker-border-color": "rgb(var(--color-border-rgb) / 0.5)",
        "--epr-picker-border-radius": "1.25rem",
        "--epr-search-input-bg-color": "rgb(var(--color-bg-base-rgb) / 0.75)",
        "--epr-search-input-bg-color-active": "rgb(var(--color-bg-base-rgb) / 0.92)",
        "--epr-text-color": "rgb(var(--color-text-main-rgb))",
        "--epr-hover-bg-color": "rgb(var(--color-primary-rgb) / 0.08)",
        "--epr-focus-bg-color": "rgb(var(--color-primary-rgb) / 0.14)",
        "--epr-highlight-color": "rgb(var(--color-primary-rgb))",
        "--epr-category-label-bg-color": "rgb(var(--color-bg-surface-rgb) / 0.96)",
        "--epr-category-icon-active-color": "rgb(var(--color-primary-rgb))",
        "--epr-search-border-color": "rgb(var(--color-border-rgb) / 0.5)",
        "--epr-search-input-text-color": "rgb(var(--color-text-main-rgb))",
        "--epr-reactions-bg-color": "rgb(var(--color-bg-surface-rgb) / 0.88)",
        "--epr-emoji-variation-picker-bg-color": "rgb(var(--color-bg-surface-rgb))",
        boxShadow: "0 24px 56px rgb(0 0 0 / 0.16)",
      }) as CSSProperties,
    [],
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
        aria-label={t("actions.emoji")}
      >
        <FaceSmileIcon className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className={`absolute left-0 z-20 overflow-hidden rounded-2xl border border-skin-border/60 shadow-lg ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.AUTO}
            emojiStyle={EmojiStyle.NATIVE}
            lazyLoadEmojis
            autoFocusSearch={false}
            searchPlaceholder={t("actions.emoji")}
            previewConfig={{ showPreview: false }}
            width={320}
            height={380}
            style={pickerStyle}
          />
        </div>
      ) : null}
    </div>
  );
}
