import { XMarkIcon } from "@heroicons/react/24/solid";
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

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-skin-border/40 bg-skin-base">
      <img src={previewUrl} alt={file.name} className="h-28 w-full object-cover" />

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
