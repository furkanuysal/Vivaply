import { useState, useEffect, useRef } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { locationService } from "@/features/location/services/locationService";
import type { LocationDto } from "@/features/location/types";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parent value changes, update input
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Search logic (Debounce + Service)
  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      // If query is same as selected value, don't search
      if (query === value) return;

      setIsLoading(true);

      try {
        const data = await locationService.search(query);
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        // 429 / network / backend error → sessizce ignore
        console.error("Location search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [query, value]);

  const handleSelect = (option: LocationDto) => {
    // "Semt, İlçe, İl" → ilk 3 parça
    const shortName = option.displayName.split(",").slice(0, 3).join(",");

    setQuery(shortName);
    onChange(shortName);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-skin-base/50 border border-skin-border/50 rounded-xl px-4 py-3 pl-10 text-skin-text placeholder:text-skin-muted/50 focus:border-skin-primary focus:ring-1 focus:ring-skin-primary/50 outline-none transition-all"
          placeholder="Şehir veya Ülke ara..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
        />

        <MapPinIcon className="w-5 h-5 text-skin-muted absolute left-3 top-3.5" />

        {isLoading && (
          <div className="absolute right-3 top-3.5">
            <div className="w-4 h-4 border-2 border-skin-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions List */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-skin-surface border border-skin-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in backdrop-blur-sm">
          {suggestions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-4 py-3 hover:bg-skin-primary/10 cursor-pointer text-sm text-skin-text border-b border-skin-border/20 last:border-0 flex items-start gap-2 transition-colors"
            >
              <MapPinIcon className="w-4 h-4 mt-0.5 text-skin-primary shrink-0" />
              <span>{option.displayName}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Attribution */}
      {isOpen && (
        <div className="text-[10px] text-skin-muted mt-1 text-right px-1">
          Data © OpenStreetMap contributors
        </div>
      )}
    </div>
  );
}
