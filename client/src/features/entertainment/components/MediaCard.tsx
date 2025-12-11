import { useNavigate } from "react-router-dom";
import type { TmdbContentDto } from "../../entertainment/types";
import { useTranslation } from "react-i18next";

interface Props {
  content: TmdbContentDto;
  type: "movie" | "tv";
}

export default function MediaCard({ content, type }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "entertainment"]);
  const imageUrl = content.poster_path
    ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  return (
    <div
      onClick={() => navigate(`/entertainment/${type}/${content.id}`)}
      className="bg-skin-surface rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-skin-border group cursor-pointer relative"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3]">
        <img
          src={imageUrl}
          alt={content.display_name}
          className="w-full h-full object-cover"
        />

        {/* Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-skin-primary text-skin-base px-4 py-2 rounded-full font-bold hover:bg-skin-primary/90">
            {t("common:buttons.view")}
          </button>
        </div>

        {/* Average Rating */}
        <div className="absolute top-2 right-2 bg-skin-surface/70 backdrop-blur-sm text-skin-accent text-xs font-bold px-2 py-1 rounded-md border border-skin-accent/30 shadow-md">
          ⭐ {(content.vote_average || 0).toFixed(1)}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3
          className="text-skin-text font-bold truncate"
          title={content.display_name}
        >
          {content.display_name}
        </h3>
        <div className="flex justify-between items-center mt-2 text-xs text-skin-muted">
          <span>
            {content.display_date?.split("-")[0] ||
              t("common:messages.no_date")}
          </span>
          <span className="uppercase border border-skin-border px-1 rounded">
            {t(`entertainment:common.${type}`)}
          </span>
        </div>
      </div>
    </div>
  );
}
