import { GameCard, MediaCard } from "@/features/entertainment/components/cards";
import type { GameContentDto, TmdbContentDto } from "@/features/entertainment/types";

interface EntertainmentLibraryGridProps {
  activeTab: "tv" | "movie" | "game";
  items: Array<TmdbContentDto | GameContentDto>;
}

export default function EntertainmentLibraryGrid({
  activeTab,
  items,
}: EntertainmentLibraryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) =>
        activeTab === "game" ? (
          <GameCard key={item.id} game={item as GameContentDto} />
        ) : (
          <MediaCard
            key={item.id}
            content={item as TmdbContentDto}
            type={activeTab as "tv" | "movie"}
          />
        ),
      )}
    </div>
  );
}
