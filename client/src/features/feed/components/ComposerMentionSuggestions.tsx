import { type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { getActorAvatarUrl } from "@/features/feed/api/feedApi";
import type { SearchUserDto } from "@/features/search/types";

interface ComposerMentionSuggestionsProps {
  users: SearchUserDto[];
  loading: boolean;
  open: boolean;
  activeIndex: number;
  onSelect: (username: string) => void;
  onHover: (index: number) => void;
}

export default function ComposerMentionSuggestions({
  users,
  loading,
  open,
  activeIndex,
  onSelect,
  onHover,
}: ComposerMentionSuggestionsProps) {
  const { t } = useTranslation("feed");

  if (!open) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-skin-border/60 bg-skin-surface shadow-xl">
      {loading ? (
        <div className="px-4 py-3 text-sm text-skin-muted">
          {t("mentions.loading")}
        </div>
      ) : users.length > 0 ? (
        <div className="p-2">
          <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-skin-muted">
            {t("mentions.title")}
          </div>
          {users.map((searchUser, index) => (
            <button
              key={searchUser.id}
              type="button"
              onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                onSelect(searchUser.username);
              }}
              onMouseEnter={() => onHover(index)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-skin-base ${
                activeIndex === index ? "bg-skin-base" : ""
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-skin-base">
                {getActorAvatarUrl(searchUser.avatarUrl ?? undefined) ? (
                  <img
                    src={getActorAvatarUrl(searchUser.avatarUrl ?? undefined) ?? ""}
                    alt={searchUser.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-skin-primary">
                    {searchUser.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-skin-text">
                  @{searchUser.username}
                </p>
                {searchUser.bio ? (
                  <p className="truncate text-xs text-skin-muted">
                    {searchUser.bio}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-skin-muted">
          {t("mentions.empty")}
        </div>
      )}
    </div>
  );
}
