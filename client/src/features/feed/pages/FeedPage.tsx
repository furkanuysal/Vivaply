import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowPathIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import PostCard from "@/features/feed/components/PostCard";
import ComposerEmojiPicker from "@/features/feed/components/ComposerEmojiPicker";
import ComposerMentionSuggestions from "@/features/feed/components/ComposerMentionSuggestions";
import ComposerLocationPopover from "@/features/feed/components/ComposerLocationPopover";
import ComposerMediaPreview from "@/features/feed/components/ComposerMediaPreview";
import {
  feedApi,
  getActorAvatarUrl,
  getFeedDescription,
  getRelativeTime,
} from "@/features/feed/api/feedApi";
import {
  applyPostUpdateToList,
  subscribeToPostUpdates,
} from "@/features/feed/services/postUpdateEvents";
import type { FeedItemDto } from "@/features/feed/types";
import {
  applyMentionSelection,
  getActiveMentionRange,
  type ActiveMentionRange,
} from "@/features/feed/lib/mentions";
import type { LocationDto } from "@/features/location/types";
import { searchApi } from "@/features/search/api/searchApi";
import type { SearchResponseDto } from "@/features/search/types";
import type { SearchUserDto } from "@/features/search/types";
import { getApiErrorMessage } from "@/shared/lib/api";

export default function FeedPage() {
  const { t } = useTranslation(["feed", "search"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [mentionResults, setMentionResults] = useState<SearchUserDto[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionRange, setMentionRange] = useState<ActiveMentionRange | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponseDto>({
    users: [],
    posts: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentUserAvatarUrl = getActorAvatarUrl(user?.avatarUrl);
  const trimmedSearchQuery = searchQuery.trim();
  const shouldShowSearchDropdown = searchOpen && trimmedSearchQuery.length > 0;
  const shouldShowMentionDropdown = mentionRange !== null;
  const hasSearchResults =
    searchResults.users.length > 0 || searchResults.posts.length > 0;

  const previewUsers = useMemo(() => searchResults.users.slice(0, 3), [searchResults.users]);
  const previewPosts = useMemo(() => searchResults.posts.slice(0, 3), [searchResults.posts]);
  const searchNavigationItems = useMemo(
    () => [
      ...previewUsers.map((searchUser) => ({
        key: `user-${searchUser.id}`,
        type: "user" as const,
        label: searchUser.username,
        action: () => handleSearchUserClick(searchUser.username),
      })),
      ...previewPosts.map((post) => ({
        key: `post-${post.id}`,
        type: "post" as const,
        label: post.actor.username,
        action: () => handleSearchPostClick(post.id),
      })),
      ...(trimmedSearchQuery.length >= 2
        ? [
            {
              key: "view-all",
              type: "view-all" as const,
              label: trimmedSearchQuery,
              action: () => {
                setSearchOpen(false);
                navigate(`/search?q=${encodeURIComponent(trimmedSearchQuery)}&tab=users`);
              },
            },
          ]
        : []),
    ],
    [navigate, previewPosts, previewUsers, trimmedSearchQuery],
  );

  useEffect(() => {
    void loadFeed();
  }, []);

  useEffect(
    () =>
      subscribeToPostUpdates((update) => {
        setItems((current) => applyPostUpdateToList(current, update));
      }),
    [],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveSearchIndex(-1);
  }, [trimmedSearchQuery, searchResults.users.length, searchResults.posts.length, searchOpen]);

  useEffect(() => {
    setActiveMentionIndex(-1);
  }, [mentionRange?.query, mentionResults.length]);

  useEffect(() => {
    if (trimmedSearchQuery.length < 2) {
      setSearchResults({ users: [], posts: [] });
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await searchApi.search(trimmedSearchQuery, 6);
        if (!cancelled) {
          setSearchResults(response);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults({ users: [], posts: [] });
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedSearchQuery]);

  useEffect(() => {
    const query = mentionRange?.query.trim() ?? "";

    if (!mentionRange || query.length === 0) {
      setMentionResults([]);
      setMentionLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setMentionLoading(true);
        const users = await searchApi.searchUsers(query, 5);
        if (!cancelled) {
          setMentionResults(users);
        }
      } catch {
        if (!cancelled) {
          setMentionResults([]);
        }
      } finally {
        if (!cancelled) {
          setMentionLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [mentionRange]);

  const loadFeed = async (cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await feedApi.getFeed(cursor);

      setItems((prev) => (cursor ? [...prev, ...response.items] : response.items));
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("Feed could not be loaded", error);
      toast.error(t("page.empty_title"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCreatePost = async () => {
    const value = postText.trim();
    if (!value && selectedFiles.length === 0) {
      return;
    }

    try {
      setSubmittingPost(true);
      const createdPost = await feedApi.createPost(
        value,
        selectedFiles,
        isSpoiler,
        selectedLocation,
      );
      setItems((current) => [createdPost, ...current]);
      setPostText("");
      setSelectedFiles([]);
      setIsSpoiler(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error("Post could not be created", error);
      toast.error(getApiErrorMessage(error) ?? t("page.composer.error"));
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();
    setSearchOpen(false);
    navigate(trimmed.length > 0 ? `/search?q=${encodeURIComponent(trimmed)}&tab=users` : "/search");
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSearchDropdown) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (searchNavigationItems.length === 0) {
        return;
      }

      setActiveSearchIndex((current) =>
        current >= searchNavigationItems.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (searchNavigationItems.length === 0) {
        return;
      }

      setActiveSearchIndex((current) =>
        current <= 0 ? searchNavigationItems.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveSearchIndex(-1);
      return;
    }

    if (event.key === "Enter" && activeSearchIndex >= 0) {
      event.preventDefault();
      searchNavigationItems[activeSearchIndex]?.action();
    }
  };

  const handleSearchUserClick = (username: string) => {
    setSearchOpen(false);
    navigate(`/${username}`);
  };

  const handleSearchPostClick = (postId: string) => {
    setSearchOpen(false);
    navigate(`/post/${postId}`, {
      state: { backgroundLocation: location },
    });
  };

  const appendEmoji = (emoji: string) => {
    setPostText((current) => `${current}${emoji}`);
  };

  const syncMentionState = (
    nextText: string,
    cursorPosition: number,
  ) => {
    setMentionRange(getActiveMentionRange(nextText, cursorPosition));
  };

  const handlePostTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = event.target.value;
    setPostText(nextText);
    syncMentionState(nextText, event.target.selectionStart ?? nextText.length);
  };

  const handleMentionSelect = (username: string) => {
    if (!mentionRange || !postTextareaRef.current) {
      return;
    }

    const { nextText, nextCursorPosition } = applyMentionSelection(
      postText,
      mentionRange,
      username,
    );

    setPostText(nextText);
    setMentionRange(null);
    setMentionResults([]);
    setActiveMentionIndex(-1);

    requestAnimationFrame(() => {
      postTextareaRef.current?.focus();
      postTextareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!shouldShowMentionDropdown) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (mentionResults.length === 0) {
        return;
      }

      setActiveMentionIndex((current) =>
        current >= mentionResults.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (mentionResults.length === 0) {
        return;
      }

      setActiveMentionIndex((current) =>
        current <= 0 ? mentionResults.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setMentionRange(null);
      setMentionResults([]);
      setActiveMentionIndex(-1);
      return;
    }

    if (event.key === "Enter" && activeMentionIndex >= 0) {
      event.preventDefault();
      handleMentionSelect(mentionResults[activeMentionIndex].username);
    }
  };

  const renderSearchPostPreview = (item: FeedItemDto) => {
    const previewText = item.textContent?.trim() || getFeedDescription(item, t);
    return previewText.length > 110 ? `${previewText.slice(0, 110)}...` : previewText;
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
            {t("page.eyebrow")}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-skin-text">
            {t("page.title")}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-skin-muted">
            {t("page.subtitle")}
          </p>
        </div>

        <div
          ref={searchContainerRef}
          className="relative w-full max-w-xl lg:w-[360px] lg:shrink-0"
        >
          <form onSubmit={handleSearchSubmit}>
            <label className="relative block">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-skin-muted" />
              <input
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("search:page.search_placeholder")}
                className="h-12 w-full rounded-2xl border border-skin-border/60 bg-skin-surface/90 pl-12 pr-24 text-sm text-skin-text outline-none transition focus:border-skin-primary/40"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center justify-center rounded-full bg-skin-primary px-4 text-xs font-semibold text-white transition hover:opacity-90"
              >
                {t("search:page.search_button")}
              </button>
            </label>
          </form>

          {shouldShowSearchDropdown ? (
            <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border border-skin-border/60 bg-skin-surface shadow-xl">
              {trimmedSearchQuery.length < 2 ? (
                <div className="px-4 py-3 text-sm text-skin-muted">
                  {t("search:live.min_length")}
                </div>
              ) : searchLoading ? (
                <div className="px-4 py-3 text-sm text-skin-muted">
                  {t("search:live.loading")}
                </div>
              ) : hasSearchResults ? (
                <div className="divide-y divide-skin-border/50">
                  {previewUsers.length > 0 ? (
                    <div className="p-2">
                      <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-skin-muted">
                        {t("search:live.users")}
                      </div>
                      {previewUsers.map((searchUser) => (
                        <button
                          key={searchUser.id}
                          type="button"
                          onClick={() => handleSearchUserClick(searchUser.username)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-skin-base ${
                            searchNavigationItems[activeSearchIndex]?.key === `user-${searchUser.id}`
                              ? "bg-skin-base"
                              : ""
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
                              {searchUser.username}
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
                  ) : null}

                  {previewPosts.length > 0 ? (
                    <div className="p-2">
                      <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-skin-muted">
                        {t("search:live.posts")}
                      </div>
                      {previewPosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => handleSearchPostClick(post.id)}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-skin-base ${
                            searchNavigationItems[activeSearchIndex]?.key === `post-${post.id}`
                              ? "bg-skin-base"
                              : ""
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-skin-base">
                            {getActorAvatarUrl(post.actor.avatarUrl) ? (
                              <img
                                src={getActorAvatarUrl(post.actor.avatarUrl) ?? ""}
                                alt={post.actor.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-skin-primary">
                                {post.actor.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-skin-muted">
                              <span className="font-medium text-skin-text">
                                {post.actor.username}
                              </span>
                              <span>{getRelativeTime(post.publishedAt)}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-skin-muted">
                              {renderSearchPostPreview(post)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/search?q=${encodeURIComponent(trimmedSearchQuery)}&tab=users`);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-sm font-medium text-skin-primary transition hover:bg-skin-base ${
                        searchNavigationItems[activeSearchIndex]?.key === "view-all"
                          ? "bg-skin-base"
                          : ""
                      }`}
                    >
                      {t("search:live.view_all")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-skin-muted">
                  {t("search:live.empty")}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-skin-border/50 bg-skin-surface/90 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-skin-base">
            {currentUserAvatarUrl ? (
              <img
                src={currentUserAvatarUrl}
                alt={user?.username ?? t("page.composer.submit")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-skin-primary/20 to-skin-secondary/20 text-lg font-bold text-skin-primary">
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative">
            <textarea
              ref={postTextareaRef}
              value={postText}
              onChange={handlePostTextChange}
              onClick={(event) =>
                syncMentionState(postText, event.currentTarget.selectionStart ?? postText.length)
              }
              onKeyUp={(event) =>
                syncMentionState(postText, event.currentTarget.selectionStart ?? postText.length)
              }
              onKeyDown={handleComposerKeyDown}
              onBlur={() => {
                window.setTimeout(() => {
                  setMentionRange(null);
                  setMentionResults([]);
                  setActiveMentionIndex(-1);
                }, 120);
              }}
              onFocus={(event) =>
                syncMentionState(postText, event.currentTarget.selectionStart ?? postText.length)
              }
              rows={3}
              maxLength={4000}
              placeholder={t("page.composer.placeholder")}
              className="w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 text-skin-text outline-none placeholder:text-skin-muted focus:ring-0"
            />
              <ComposerMentionSuggestions
                users={mentionResults}
                loading={mentionLoading}
                open={shouldShowMentionDropdown}
                activeIndex={activeMentionIndex}
                onSelect={handleMentionSelect}
                onHover={setActiveMentionIndex}
              />
            </div>

            <div className="mt-3">
              <ComposerMediaPreview
                files={selectedFiles}
                onRemove={(index) =>
                  setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            </div>

            {selectedLocation ? (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-skin-primary/10 px-3 py-1.5 text-xs text-skin-primary">
                <span className="truncate">{selectedLocation.displayName}</span>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-skin-muted">
                <label className="cursor-pointer rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []).slice(0, 4);
                      setSelectedFiles(files);
                      event.target.value = "";
                    }}
                  />
                  <PhotoIcon className="h-5 w-5" />
                  <span className="sr-only">{t("actions.media")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSpoiler((current) => !current)}
                  className={`rounded-full p-2 transition hover:bg-skin-base hover:text-skin-text ${
                    isSpoiler ? "bg-skin-primary/10 text-skin-primary" : "text-skin-muted"
                  }`}
                  aria-pressed={isSpoiler}
                  aria-label={t("actions.spoiler")}
                >
                  <EyeSlashIcon className="h-5 w-5" />
                </button>
                <ComposerEmojiPicker onSelect={appendEmoji} />
                <ComposerLocationPopover
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-skin-muted sm:text-right">
                  {t("page.composer.count", { count: postText.trim().length })}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCreatePost()}
                  disabled={submittingPost || (!postText.trim() && selectedFiles.length === 0)}
                  className="inline-flex min-w-[112px] items-center justify-center rounded-full bg-skin-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingPost
                    ? t("page.composer.submitting")
                    : t("page.composer.submit")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface/70 px-8 py-14 text-center">
          <h2 className="text-xl font-semibold text-skin-text">
            {t("page.empty_title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-skin-muted">
            {t("page.empty_subtitle")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <PostCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadFeed(nextCursor)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-skin-border/60 bg-skin-surface px-5 py-3 text-sm font-medium text-skin-text transition hover:border-skin-primary/40 hover:bg-skin-surface/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loadingMore ? "animate-spin" : ""}`} />
            {loadingMore ? t("buttons.loading_more") : t("buttons.load_more")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
