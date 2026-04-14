import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

export type EntertainmentSortKey =
  | "title"
  | "averageRating"
  | "userRating"
  | "lastWatched"
  | "latestEpisode"
  | "status"
  | "watchDate"
  | "releaseDate"
  | "platform"
  | "playtime"
  | "completion";

export type SortDirection = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  sortKey?: EntertainmentSortKey;
  activeSortKey: EntertainmentSortKey;
  direction: SortDirection;
  onSort: (key: EntertainmentSortKey) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  className = "",
}: SortableHeaderProps) {
  const isActive = !!sortKey && sortKey === activeSortKey;

  if (!sortKey) {
    return <th className={className}>{label}</th>;
  }

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 transition ${
          isActive ? "text-skin-primary" : "hover:text-skin-primary"
        }`}
      >
        <span>{label}</span>
        {isActive ? (
          direction === "asc" ? (
            <ChevronUpIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          )
        ) : (
          <span className="h-3.5 w-3.5 opacity-30">↕</span>
        )}
      </button>
    </th>
  );
}
