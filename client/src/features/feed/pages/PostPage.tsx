import {
  ArrowLeftIcon,
  EyeSlashIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Location, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UniversalCoverFallback } from "@/shared/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import ComposerMentionSuggestions from "@/features/feed/components/ComposerMentionSuggestions";
import PostCard from "@/features/feed/components/PostCard";
import ComposerEmojiPicker from "@/features/feed/components/ComposerEmojiPicker";
import ComposerLocationPopover from "@/features/feed/components/ComposerLocationPopover";
import ComposerMediaPreview from "@/features/feed/components/ComposerMediaPreview";
import PostTextRenderer from "@/features/feed/components/PostTextRenderer";
import {
  feedApi,
  getActorAvatarUrl,
  getFeedActivityType,
  getFeedImageUrl,
  getFeedTargetPath,
  getFeedTimestamp,
  getFeedTitle,
  getRelativeTime,
} from "@/features/feed/api/feedApi";
import { getApiErrorMessage } from "@/shared/lib/api";
import {
  applyPostUpdate,
  publishPostUpdate,
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
import type { SearchUserDto } from "@/features/search/types";

interface PostPageProps {
  isModal?: boolean;
}

interface ModalNavigationState {
  backgroundLocation?: Location;
  modalDepth?: number;
  composerMode?: "reply" | "quote";
}

export default function PostPage({ isModal = false }: PostPageProps) {
  const { t } = useTranslation("feed");
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [item, setItem] = useState<FeedItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [submittingComposer, setSubmittingComposer] = useState(false);
  const [composerMode, setComposerMode] = useState<"reply" | "quote" | null>(null);
  const [mentionResults, setMentionResults] = useState<SearchUserDto[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionRange, setMentionRange] = useState<ActiveMentionRange | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(-1);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentUserAvatarUrl = getActorAvatarUrl(user?.avatarUrl);

  const closeModal = () => {
    const state = location.state as ModalNavigationState | null;

    if (state?.modalDepth && state.modalDepth > 0) {
      navigate(-state.modalDepth);
      return;
    }

    navigate("/feed", { replace: true });
  };

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const loadPost = async () => {
      try {
        setLoading(true);
        const response = await feedApi.getPostById(postId);
        setItem(response);
      } catch (error) {
        console.error("Post could not be loaded", error);
        toast.error(t("post.errors.load"));
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [postId, t]);

  useEffect(
    () =>
      subscribeToPostUpdates((update) => {
        setItem((current) => (current ? applyPostUpdate(current, update) : current));
      }),
    [],
  );

  useEffect(() => {
    const state = location.state as ModalNavigationState | null;
    if (state?.composerMode) {
      setComposerMode(state.composerMode);
    }
  }, [location.state]);

  useEffect(() => {
    setActiveMentionIndex(-1);
  }, [mentionRange?.query, mentionResults.length]);

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

  const replies = useMemo(
    () =>
      [...(item?.replies ?? [])]
        .filter((reply) => getParentId(reply) === item?.id)
        .sort(compareFeedItems),
    [item?.id, item?.replies],
  );

  const openReplyThread = (replyId: string) => {
    const state = location.state as ModalNavigationState | null;
    const backgroundLocation = state?.backgroundLocation ?? location;
    const modalDepth = (state?.modalDepth ?? 0) + 1;

    navigate(`/post/${replyId}`, {
      state: {
        backgroundLocation,
        modalDepth,
      },
    });
  };

  const appendEmoji = (emoji: string) => {
    setComposerText((current) => `${current}${emoji}`);
  };

  const syncMentionState = (
    nextText: string,
    cursorPosition: number,
  ) => {
    setMentionRange(getActiveMentionRange(nextText, cursorPosition));
  };

  const handleComposerTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = event.target.value;
    setComposerText(nextText);
    syncMentionState(nextText, event.target.selectionStart ?? nextText.length);
  };

  const handleMentionSelect = (username: string) => {
    if (!mentionRange || !composerTextareaRef.current) {
      return;
    }

    const { nextText, nextCursorPosition } = applyMentionSelection(
      composerText,
      mentionRange,
      username,
    );

    setComposerText(nextText);
    setMentionRange(null);
    setMentionResults([]);
    setActiveMentionIndex(-1);

    requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
      composerTextareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionRange) {
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

  const handleComposerSubmit = async () => {
    const value = composerText.trim();

    if (!postId || (composerMode === "reply" && !value && composerFiles.length === 0)) {
      return;
    }

    try {
      setSubmittingComposer(true);

      if (composerMode === "quote") {
        const quotePost = await feedApi.quotePost(
          postId,
          value,
          composerFiles,
          isSpoiler,
          selectedLocation,
        );
        publishPostUpdate({ createdPost: quotePost });
        publishPostUpdate({
          postId,
          stats: { quoteCount: (item?.stats?.quoteCount ?? 0) + 1 },
        });
        setItem((current) =>
          current
            ? {
                ...current,
                stats: {
                  ...current.stats,
                  quoteCount: (current.stats?.quoteCount ?? 0) + 1,
                },
              }
            : current,
        );
        setComposerText("");
        setComposerFiles([]);
        setIsSpoiler(false);
        setSelectedLocation(null);
        setComposerMode(null);

        if (isModal) {
          closeModal();
        }
        return;
      }

      const reply = await feedApi.replyToPost(
        postId,
        value,
        composerFiles,
        isSpoiler,
        selectedLocation,
      );
      const nextReplyCount = (item?.stats?.replyCount ?? 0) + 1;

      setItem((current) =>
        current
          ? {
              ...current,
              replies: [...(current.replies ?? []), reply].sort(compareFeedItems),
              stats: {
                ...current.stats,
                replyCount: (current.stats?.replyCount ?? 0) + 1,
              },
            }
          : current,
      );

      publishPostUpdate({
        postId,
        stats: { replyCount: nextReplyCount },
      });

      setComposerText("");
      setComposerFiles([]);
      setIsSpoiler(false);
      setSelectedLocation(null);
      setComposerMode(null);
    } catch (error) {
      console.error("Post composer action could not be completed", error);
      toast.error(
        getApiErrorMessage(error) ??
          (composerMode === "quote" ? t("post.errors.quote") : t("post.errors.reply")),
      );
    } finally {
      setSubmittingComposer(false);
    }
  };

  const content = loading ? (
    <div className="flex h-56 items-center justify-center text-skin-text">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary" />
    </div>
  ) : item ? (
    <div>
      <header className="mb-4 border-b border-skin-border/20 pb-3 pt-8 md:pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-skin-primary/80">
          {t("post.eyebrow")}
        </p>
      </header>

      {composerMode !== "quote" ? (
        <section className="rounded-xl border border-skin-border/20 bg-skin-surface px-4 py-4 shadow-sm">
          <PostCard
            item={item}
            disablePostNavigation
            variant="detailMain"
            onRequestQuote={() => setComposerMode("quote")}
            onDeleted={() => {
              if (isModal) {
                closeModal();
                return;
              }

              navigate("/feed", { replace: true });
            }}
          />
        </section>
      ) : null}

      <section
        className={`${composerMode === "quote" ? "mt-0" : "mt-4"} rounded-xl border border-skin-border/20 bg-skin-surface px-4 py-4 shadow-sm`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-skin-base text-sm font-bold text-skin-primary">
            {currentUserAvatarUrl ? (
              <img
                src={currentUserAvatarUrl}
                alt={user?.username ?? t("post.reply_submit")}
                className="h-full w-full object-cover"
              />
            ) : (
              user?.username?.charAt(0).toUpperCase() ?? "U"
            )}
          </div>

          <div className="min-w-0 flex-1">
            {!composerMode ? (
              <button
                type="button"
                onClick={() => setComposerMode("reply")}
                className="w-full px-0 py-1 text-left text-[15px] text-skin-muted transition hover:text-skin-text"
              >
                {t("post.reply_compact_placeholder")}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={composerTextareaRef}
                    value={composerText}
                    onChange={handleComposerTextChange}
                    onClick={(event) =>
                      syncMentionState(
                        composerText,
                        event.currentTarget.selectionStart ?? composerText.length,
                      )
                    }
                    onKeyUp={(event) =>
                      syncMentionState(
                        composerText,
                        event.currentTarget.selectionStart ?? composerText.length,
                      )
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
                      syncMentionState(
                        composerText,
                        event.currentTarget.selectionStart ?? composerText.length,
                      )
                    }
                    rows={4}
                    maxLength={4000}
                    placeholder={
                      composerMode === "quote"
                        ? t("post.quote_placeholder")
                        : t("post.reply_placeholder")
                    }
                    className="w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 text-skin-text outline-none placeholder:text-skin-muted focus:ring-0"
                  />
                  <ComposerMentionSuggestions
                    users={mentionResults}
                    loading={mentionLoading}
                    open={mentionRange !== null}
                    activeIndex={activeMentionIndex}
                    onSelect={handleMentionSelect}
                    onHover={setActiveMentionIndex}
                  />
                </div>

                <ComposerMediaPreview
                  files={composerFiles}
                  onRemove={(index) =>
                    setComposerFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                />

                {selectedLocation ? (
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-skin-primary/10 px-3 py-1.5 text-xs text-skin-primary">
                    <span className="truncate">{selectedLocation.displayName}</span>
                  </div>
                ) : null}

                {composerMode === "quote" ? (
                  <QuoteComposerPreview item={item} />
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-skin-muted">
                    <label className="cursor-pointer rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []).slice(0, 4);
                          setComposerFiles(files);
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

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-skin-muted">
                      {t("post.reply_count_hint", { count: composerText.trim().length })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setComposerMode(null);
                        setComposerText("");
                        setComposerFiles([]);
                        setIsSpoiler(false);
                        setSelectedLocation(null);
                      }}
                      className="text-sm font-medium text-skin-muted transition hover:text-skin-text"
                    >
                      {t("post.reply_cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleComposerSubmit()}
                      disabled={
                        submittingComposer ||
                        (!composerText.trim() &&
                          composerFiles.length === 0 &&
                          composerMode !== "quote") ||
                        !user
                      }
                      className="inline-flex items-center justify-center rounded-full bg-skin-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingComposer
                        ? composerMode === "quote"
                          ? t("post.quote_submitting")
                          : t("post.reply_submitting")
                        : composerMode === "quote"
                          ? t("post.quote_submit")
                          : t("post.reply_submit")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {composerMode !== "quote" ? (
        <section className="mt-4 rounded-xl bg-skin-surface px-4 py-4">
          <div className="flex items-center justify-between gap-3 border-b border-skin-border/20 pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-skin-muted">
              {t("post.replies_title")}
            </h2>
            <span className="text-xs font-medium text-skin-muted">
              {t("post.reply_total", { count: replies.length })}
            </span>
          </div>

          {replies.length > 0 ? (
            <div className="relative">
              <div className="absolute bottom-3 left-5 top-3 w-px bg-skin-border/20" />
              <div>
                {replies.map((reply, index) => (
                  <ReplyThreadPreview
                    key={reply.id}
                    reply={reply}
                    isLast={index === replies.length - 1}
                    onOpenThread={openReplyThread}
                    t={t}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6">
              <h3 className="text-base font-semibold text-skin-text">
                {t("post.no_replies_title")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-skin-muted">
                {t("post.no_replies_subtitle")}
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  ) : (
    <div className="px-2 py-12 text-center">
      <h2 className="text-xl font-semibold text-skin-text">
        {t("post.not_found_title")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-skin-muted">
        {t("post.not_found_subtitle")}
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 px-4 py-6 backdrop-blur-sm md:px-6 md:py-10"
        onClick={closeModal}
      >
        <div
          className="relative max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-skin-base px-6 py-5 shadow-2xl shadow-black/30 md:px-8"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={goBack}
            className="absolute left-4 top-4 rounded-full p-2 text-skin-muted transition hover:text-skin-text"
            aria-label={t("post.back")}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full p-2 text-skin-muted transition hover:text-skin-text"
            aria-label={t("post.close")}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 md:px-6">
      {content}
    </div>
  );
}

function compareFeedItems(left: FeedItemDto, right: FeedItemDto): number {
  const leftTime = new Date(left.publishedAt).getTime();
  const rightTime = new Date(right.publishedAt).getTime();

  if (leftTime === rightTime) {
    return left.id.localeCompare(right.id);
  }

  return leftTime - rightTime;
}

function getFallbackType(
  type: ReturnType<typeof getFeedActivityType>,
): "movie" | "tv" | "game" | "book" | "other" {
  if (type == null) {
    return "other";
  }

  switch (type) {
    case 10:
    case 11:
    case 12:
    case 13:
      return "tv";
    case 14:
    case 20:
    case 21:
      return "movie";
    case 30:
    case 31:
    case 32:
    case 33:
      return "game";
    case 40:
    case 41:
    case 42:
    case 43:
      return "book";
    default:
      return "other";
  }
}

function QuoteComposerPreview({ item }: { item: FeedItemDto }) {
  const avatarUrl = getActorAvatarUrl(item.actor.avatarUrl);
  const imageUrl = getFeedImageUrl(item);
  const title = getFeedTitle(item);
  const targetPath = getFeedTargetPath(item);
  const activityType = getFeedActivityType(item);
  const fallbackType = getFallbackType(activityType);
  const { t, i18n } = useTranslation("feed");
  const timestamp = getRelativeTime(getFeedTimestamp(item), i18n.resolvedLanguage);
  const text = item.textContent?.trim();

  return (
    <div className="rounded-2xl border border-skin-border/40 bg-skin-base/60 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-skin-muted">
        {t("post.quote_preview_label")}
      </p>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-skin-base">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={item.actor.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-skin-primary/20 to-skin-secondary/20 text-sm font-bold text-skin-primary">
              {item.actor.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-skin-text">{item.actor.username}</span>
            <span className="text-skin-muted">{timestamp}</span>
          </div>

          {text ? (
            <p className="mt-2 text-sm leading-6 text-skin-text/90">
              <PostTextRenderer text={text} />
            </p>
          ) : null}

          {targetPath ? (
            <div className="mt-3 rounded-xl border border-skin-border/40 bg-skin-surface px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-skin-base">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UniversalCoverFallback
                      title={title}
                      type={fallbackType}
                      variant="compact"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-skin-text">
                    {title}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReplyThreadPreview({
  reply,
  isLast,
  onOpenThread,
  t,
}: {
  reply: FeedItemDto;
  isLast: boolean;
  onOpenThread: (replyId: string) => void;
  t: ReturnType<typeof useTranslation<"feed">>["t"];
}) {
  const children = [...(reply.children ?? [])].sort(compareFeedItems).slice(0, 3);
  const hiddenReplyCount = Math.max(
    (reply.stats?.replyCount ?? children.length) - children.length,
    0,
  );

  return (
    <div
      className={`py-3 ${
        isLast ? "" : "border-b border-skin-border/40"
      }`}
    >
      <div className="pl-12">
        <PostCard item={reply} variant="threadReply" />

        {children.length > 0 ? (
          <div className="relative ml-8 mt-3 space-y-3 border-l border-skin-border/20 pl-5">
            {children.map((child) => (
              <div key={child.id} className="pt-1">
                <PostCard item={child} variant="threadReply" />
              </div>
            ))}
          </div>
        ) : null}

        {hiddenReplyCount > 0 ? (
          <button
            type="button"
            onClick={() => onOpenThread(reply.id)}
            className="ml-8 mt-3 text-sm font-medium text-skin-primary transition hover:underline"
          >
            {t("post.view_more_replies", { count: hiddenReplyCount })}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getParentId(item: FeedItemDto): string | null | undefined {
  return item.parentPostId;
}
