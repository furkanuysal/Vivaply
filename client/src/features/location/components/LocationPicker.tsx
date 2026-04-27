import { useEffect, useRef, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { locationApi } from "@/features/location/api/locationApi";
import type { LocationDto } from "@/features/location/types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation?: (location: LocationDto) => void;
  placeholder?: string;
}

export default function LocationPicker({
  value,
  onChange,
  onSelectLocation,
  placeholder = "Şehir veya ülke ara...",
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      if (query === value) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await locationApi.search(query);
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Location search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [query, value]);

  const handleSelect = (option: LocationDto) => {
    const shortName = option.displayName.split(",").slice(0, 3).join(", ");

    setQuery(shortName);
    onChange(shortName);
    onSelectLocation?.({
      ...option,
      displayName: shortName,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-xl border border-skin-border/50 bg-skin-base/50 px-4 py-3 pl-10 text-skin-text outline-none transition-all placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
        />

        <MapPinIcon className="absolute left-3 top-3.5 h-5 w-5 text-skin-muted" />

        {isLoading ? (
          <div className="absolute right-3 top-3.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-skin-primary border-t-transparent" />
          </div>
        ) : null}
      </div>

      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-skin-border/50 bg-skin-surface shadow-xl backdrop-blur-sm">
          {suggestions.map((option, index) => (
            <li
              key={`${option.displayName}-${index}`}
              onClick={() => handleSelect(option)}
              className="flex cursor-pointer items-start gap-2 border-b border-skin-border/20 px-4 py-3 text-sm text-skin-text transition-colors hover:bg-skin-primary/10 last:border-0"
            >
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-skin-primary" />
              <span>{option.displayName}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {isOpen ? (
        <div className="mt-1 px-1 text-right text-[10px] text-skin-muted">
          Data © OpenStreetMap contributors
        </div>
      ) : null}
    </div>
  );
}
