import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

interface ComposerMediaPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function ComposerMediaPreview({
  files,
  onRemove,
}: ComposerMediaPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {files.map((file, index) => {
        return (
          <ComposerMediaPreviewItem
            key={`${file.name}-${file.lastModified}-${index}`}
            file={file}
            onRemove={() => onRemove(index)}
          />
        );
      })}
    </div>
  );
}

function ComposerMediaPreviewItem({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const isVideo = file.type.startsWith("video/");

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-skin-border/40 bg-skin-base">
      {isVideo ? (
        <div className="relative">
          <video
            src={previewUrl}
            className="h-28 w-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration || null);
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
            <PlayIcon className="h-3.5 w-3.5" />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      ) : (
        <img src={previewUrl} alt={file.name} className="h-28 w-full object-cover" />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        aria-label="Remove media"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function formatDuration(duration: number | null): string {
  if (!duration || Number.isNaN(duration) || !Number.isFinite(duration)) {
    return "00:00";
  }

  const totalSeconds = Math.max(0, Math.floor(duration));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
