import { useNavigate } from "react-router-dom";
import type { TmdbContentDto } from "../../entertainment/types";
import { useTranslation } from "react-i18next";

interface Props {
  content: TmdbContentDto;
  type: "movie" | "tv";
}

export default function MediaCard({ content, type }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(["common"]);
  const imageUrl = content.poster_path
    ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  return (
    <div
      onClick={() => navigate(`/entertainment/${type}/${content.id}`)}
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-gray-700 group cursor-pointer relative"
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
            {t("common:buttons.view")}
          </button>
        </div>

        {/* Average Rating */}
        <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md border border-yellow-500/30">
          ⭐ {(content.vote_average || 0).toFixed(1)}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3
          className="text-white font-bold truncate"
          title={content.display_name}
        >
          {content.display_name}
        </h3>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>
            {content.display_date?.split("-")[0] ||
              t("common:messages.no_date")}
          </span>
          <span className="uppercase border border-gray-600 px-1 rounded">
            {type}
          </span>
        </div>
      </div>
    </div>
  );
}
