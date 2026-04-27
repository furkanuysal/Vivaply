import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LocationPicker from "@/features/location/components/LocationPicker";
import type { LocationDto } from "@/features/location/types";

interface ComposerLocationPopoverProps {
  value: LocationDto | null;
  onChange: (value: LocationDto | null) => void;
}

export default function ComposerLocationPopover({
  value,
  onChange,
}: ComposerLocationPopoverProps) {
  const { t } = useTranslation("feed");
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [inputValue, setInputValue] = useState(value?.displayName ?? "");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInputValue(value?.displayName ?? "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!open || !wrapperRef.current) {
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    const popoverHeight = 340;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < popoverHeight + 24 && spaceAbove > spaceBelow) {
      setPlacement("top");
      return;
    }

    setPlacement("bottom");
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`rounded-full p-2 transition hover:bg-skin-base hover:text-skin-text ${
          value ? "bg-skin-primary/10 text-skin-primary" : "text-skin-muted"
        }`}
        aria-label={t("actions.location")}
      >
        <MapPinIcon className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className={`absolute left-0 z-20 w-80 rounded-3xl border border-skin-border/50 bg-skin-surface/95 p-4 shadow-[0_24px_56px_rgb(0_0_0_/_0.16)] backdrop-blur-sm ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <LocationPicker
            value={inputValue}
            onChange={setInputValue}
            onSelectLocation={(location) => {
              onChange(location);
              setInputValue(location.displayName);
              setOpen(false);
            }}
          />

          {value ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-skin-border/40 bg-skin-base/55 px-3 py-2.5 text-sm text-skin-text">
              <div className="flex min-w-0 items-center gap-2">
                <MapPinIcon className="h-4 w-4 shrink-0 text-skin-primary" />
                <span className="truncate">{value.displayName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setInputValue("");
                }}
                className="rounded-full p-1 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
                aria-label={t("actions.delete")}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
