import { useNavigate } from "react-router-dom";
import { type GameContentDto } from "../../types";
import { useTranslation } from "react-i18next";

interface Props {
  game: GameContentDto;
}

export default function GameCard({ game }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "entertainment"]);

  // Use coverUrl if available, otherwise placeholder
  const imageUrl = game.coverUrl
    ? game.coverUrl.replace("http:", "https:") // Ensure HTTPS
    : "https://via.placeholder.com/135x190?text=No+Cover";

  return (
    <div
      onClick={() => navigate(`/entertainment/game/${game.id}`)}
      className="bg-skin-surface rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-skin-border group cursor-pointer relative"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3]">
        <img
          src={imageUrl}
          alt={game.title}
          className="w-full h-full object-cover"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-skin-primary text-skin-base px-4 py-2 rounded-full font-bold hover:bg-skin-primary/90">
            {t("common:buttons.view")}
          </button>
        </div>

        {/* Rating Badge */}
        {game.voteAverage > 0 && (
          <div className="absolute top-2 right-2 bg-skin-surface/70 backdrop-blur-sm text-skin-accent text-xs font-bold px-2 py-1 rounded-md border border-skin-accent/30 shadow-md">
            ⭐ {game.voteAverage.toFixed(1)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <h3
          className="text-skin-text font-bold truncate mb-1"
          title={game.title}
        >
          {game.title}
        </h3>
        <div className="flex flex-nowrap gap-1 mt-1 mb-2 w-full overflow-hidden">
          {game.platforms
            ?.split(",")
            .slice(0, 2)
            .map((platform, index) => (
              <span
                key={index}
                className="text-[10px] bg-skin-base px-1.5 py-0.5 rounded text-skin-muted border border-skin-border truncate min-w-0"
              >
                {platform.trim()}
              </span>
            ))}
          {game.platforms?.split(",").length > 2 && (
            <span className="text-[10px] text-skin-muted self-center flex-shrink-0">
              ...
            </span>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-skin-muted">
          <span>
            {game.releaseDate?.split("-")[0] || t("common:messages.no_date")}
          </span>
          <span className="uppercase border border-skin-border px-1 rounded">
            {t("entertainment:common.game")}
          </span>
        </div>
      </div>
    </div>
  );
}
