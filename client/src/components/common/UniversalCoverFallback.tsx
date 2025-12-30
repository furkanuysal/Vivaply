import {
  FilmIcon,
  TvIcon,
  PuzzlePieceIcon,
  BookOpenIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface Props {
  title: string;
  type?: "movie" | "tv" | "game" | "book" | "other";
  className?: string;
  variant?: "default" | "compact";
}

const ICONS = {
  movie: FilmIcon,
  tv: TvIcon,
  game: PuzzlePieceIcon,
  book: BookOpenIcon,
  other: PhotoIcon,
};

const GRADIENTS = {
  movie: "from-sky-500/20 to-indigo-500/20",
  tv: "from-purple-500/20 to-pink-500/20",
  game: "from-emerald-500/20 to-teal-500/20",
  book: "from-amber-500/20 to-orange-500/20",
  other: "from-gray-500/20 to-slate-500/20",
};

export default function UniversalCoverFallback({
  title,
  type = "other",
  className = "",
  variant = "default",
}: Props) {
  const Icon = ICONS[type] || ICONS.other;
  const gradient = GRADIENTS[type] || GRADIENTS.other;

  const isCompact = variant === "compact";

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-center ${
        isCompact ? "p-1" : "p-4"
      } ${className}`}
    >
      <div
        className={`bg-skin-surface/50 rounded-full backdrop-blur-sm border border-skin-border/30 ${
          isCompact ? "p-1.5 mb-1" : "p-4 mb-3"
        }`}
      >
        <Icon
          className={`text-skin-muted ${isCompact ? "w-4 h-4" : "w-8 h-8"}`}
        />
      </div>
      {!isCompact && (
        <h4 className="text-sm font-semibold text-skin-muted line-clamp-3 opacity-80 uppercase tracking-wide">
          {title || "No Cover"}
        </h4>
      )}
    </div>
  );
}
