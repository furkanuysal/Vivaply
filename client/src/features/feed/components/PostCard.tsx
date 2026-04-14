import {
  ArrowPathRoundedSquareIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, type Location, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UniversalCoverFallback } from "@/shared/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  getActorAvatarUrl,
  getFeedActivityType,
  getFeedDescription,
  getFeedImageUrl,
  getFeedTargetPath,
  getFeedTimestamp,
  getFeedTitle,
  getRelativeTime,
  getReviewSnippet,
  isActivityPost,
  feedApi,
} from "@/features/feed/api/feedApi";
import { publishPostUpdate } from "@/features/feed/services/postUpdateEvents";
import {
  FeedActivityType,
  FeedPostType,
  type FeedItemDto,
  type FeedQuotedPostDto,
} from "@/features/feed/types";

interface PostCardProps {
  item: FeedItemDto;
  disablePostNavigation?: boolean;
  variant?: "default" | "detailMain" | "threadReply";
  onDeleted?: () => void;
  onRequestQuote?: () => void;
}

interface ModalNavigationState {
  backgroundLocation?: Location;
  modalDepth?: number;
  composerMode?: "reply" | "quote";
}

export default function PostCard({
  item,
  disablePostNavigation = false,
  variant = "default",
  onDeleted,
  onRequestQuote,
}: PostCardProps) {
  const { t, i18n } = useTranslation("feed");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const avatarUrl = getActorAvatarUrl(item.actor.avatarUrl);
  const imageUrl = getFeedImageUrl(item);
  const title = getFeedTitle(item);
  const description = getFeedDescription(item, t);
  const reviewSnippet = getReviewSnippet(item);
  const targetPath = getFeedTargetPath(item);
  const profilePath = `/${item.actor.username}`;
  const activityType = getFeedActivityType(item);
  const hasActivity = isActivityPost(item);
  const shouldRenderContentPreview = Boolean(targetPath);
  const secondaryMeta = getSecondaryMeta(item, t);
  const contentSubtitle = getContentSubtitle(item, secondaryMeta);
  const postPath = `/feed/${item.id}`;
  const isDetailMain = variant === "detailMain";
  const isThreadReply = variant === "threadReply";
  const isFlat = isDetailMain || isThreadReply;
  const quotedPost = item.quotedPost;
  const [likeCount, setLikeCount] = useState(item.stats?.likeCount ?? 0);
  const [hasLiked, setHasLiked] = useState(item.viewer?.hasLiked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(item.stats?.bookmarkCount ?? 0);
  const [hasBookmarked, setHasBookmarked] = useState(item.viewer?.hasBookmarked ?? false);
  const [deleting, setDeleting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canDelete = user?.id === item.actor.id;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const interactionProps = {
    onClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
  };

  useEffect(() => {
    setLikeCount(item.stats?.likeCount ?? 0);
    setHasLiked(item.viewer?.hasLiked ?? false);
    setBookmarkCount(item.stats?.bookmarkCount ?? 0);
    setHasBookmarked(item.viewer?.hasBookmarked ?? false);
  }, [
    item.id,
    item.stats?.likeCount,
    item.stats?.bookmarkCount,
    item.viewer?.hasLiked,
    item.viewer?.hasBookmarked,
  ]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const openPost = () => {
    if (disablePostNavigation) {
      return;
    }

    const state = location.state as ModalNavigationState | null;
    const backgroundLocation = state?.backgroundLocation ?? location;
    const modalDepth = (state?.modalDepth ?? 0) + 1;

    navigate(postPath, {
      state: {
        backgroundLocation,
        modalDepth,
      },
    });
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disablePostNavigation) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPost();
    }
  };

  const handleLikeToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const previousLiked = hasLiked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    setHasLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    try {
      const stats = nextLiked
        ? await feedApi.likePost(item.id)
        : await feedApi.unlikePost(item.id);

      setLikeCount(stats.likeCount);
      publishPostUpdate({
        postId: item.id,
        stats,
        viewer: { hasLiked: nextLiked },
      });
    } catch (error) {
      console.error("Post like state could not be updated", error);
      setHasLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!canDelete || deleting) {
      return;
    }

    const confirmed = window.confirm(t("post.delete_confirm"));
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      const result = await feedApi.deletePost(item.id);

      publishPostUpdate({
        postId: result.id,
        remove: true,
      });

      if (result.parentPostId && typeof result.parentReplyCount === "number") {
        publishPostUpdate({
          postId: result.parentPostId,
          stats: { replyCount: result.parentReplyCount },
        });
      }

      if (result.quotedPostId && typeof result.quotedPostQuoteCount === "number") {
        publishPostUpdate({
          postId: result.quotedPostId,
          stats: { quoteCount: result.quotedPostQuoteCount },
        });
      }

      onDeleted?.();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Post could not be deleted", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleBookmarkToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (bookmarking) {
      return;
    }

    const previousBookmarked = hasBookmarked;
    const previousCount = bookmarkCount;
    const nextBookmarked = !previousBookmarked;

    setHasBookmarked(nextBookmarked);
    setBookmarkCount((current) => Math.max(0, current + (nextBookmarked ? 1 : -1)));
    setBookmarking(true);

    try {
      const stats = nextBookmarked
        ? await feedApi.bookmarkPost(item.id)
        : await feedApi.removeBookmark(item.id);

      setBookmarkCount(stats.bookmarkCount);
      publishPostUpdate({
        postId: item.id,
        stats,
        viewer: { hasBookmarked: nextBookmarked },
      });
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Post bookmark state could not be updated", error);
      setHasBookmarked(previousBookmarked);
      setBookmarkCount(previousCount);
    } finally {
      setBookmarking(false);
    }
  };

  const handleQuote = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (onRequestQuote) {
      onRequestQuote();
      return;
    }

    const state = location.state as ModalNavigationState | null;
    const backgroundLocation = state?.backgroundLocation ?? location;
    const modalDepth = (state?.modalDepth ?? 0) + 1;

    navigate(postPath, {
      state: {
        backgroundLocation,
        modalDepth,
        composerMode: "quote",
      },
    });
  };

  const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMenuOpen((current) => !current);
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const shareUrl = `${window.location.origin}/feed/${item.id}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast.success(t("actions.share_copied"));
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Post link could not be copied", error);
      toast.error(t("actions.share_failed"));
    }
  };

  return (
    <article
      className={`${
        isFlat
          ? "relative p-0"
          : `relative ${
              isMenuOpen ? "z-20" : ""
            } rounded-3xl border border-skin-border/50 bg-skin-surface/90 p-5 shadow-sm backdrop-blur-sm transition hover:border-skin-primary/30 hover:shadow-lg hover:shadow-skin-primary/10`
      } ${disablePostNavigation ? "" : "cursor-pointer"}`}
      onClick={openPost}
      onKeyDown={handleCardKeyDown}
      role={disablePostNavigation ? undefined : "button"}
      tabIndex={disablePostNavigation ? undefined : 0}
    >
      <div className="flex items-start gap-4">
        <Link
          to={profilePath}
          className={`block shrink-0 overflow-hidden bg-skin-base transition hover:ring-2 hover:ring-skin-primary/30 focus:outline-none focus:ring-2 focus:ring-skin-primary/40 ${
            isFlat ? "h-11 w-11 rounded-full" : "h-12 w-12 rounded-2xl"
          }`}
          {...interactionProps}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={item.actor.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-skin-primary/20 to-skin-secondary/20 text-lg font-bold text-skin-primary">
              {item.actor.username.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              to={profilePath}
              className="text-[15px] font-semibold text-skin-text transition hover:text-skin-primary focus:outline-none focus:ring-2 focus:ring-skin-primary/40"
              {...interactionProps}
            >
              {item.actor.username}
            </Link>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isFlat
                  ? "rounded-full bg-skin-base px-2 py-1 text-skin-muted"
                  : "text-skin-muted/80"
              }`}
            >
              {getActivityLabel(item, activityType, hasActivity, t)}
            </span>
            <span className="text-xs text-skin-muted">
              {getRelativeTime(getFeedTimestamp(item), i18n.resolvedLanguage)}
            </span>
          </div>

          {description ? (
            <p
              className={`${shouldRenderContentPreview || quotedPost ? "mb-3" : ""} mt-2 text-skin-text/90 ${
                isFlat ? "text-base leading-8" : "text-sm leading-6"
              }`}
            >
              {renderDescription(description, title, targetPath)}
            </p>
          ) : null}

          {reviewSnippet ? (
            <blockquote
              className={`mt-4 border-l-2 border-skin-border/70 pl-4 italic text-skin-muted ${
                isFlat ? "text-base leading-8" : "text-sm"
              }`}
            >
              "{reviewSnippet}"
            </blockquote>
          ) : null}

          {shouldRenderContentPreview ? (
            <Link
              to={targetPath!}
              {...interactionProps}
              className={`mt-4 block overflow-hidden border border-skin-border/40 ${
                isFlat
                  ? "rounded-xl hover:border-skin-border/70"
                  : "rounded-xl bg-skin-surface px-3 py-3 transition hover:bg-skin-border/10"
              }`}
            >
              {isFlat ? (
                <FlatContentPreview
                  imageUrl={imageUrl}
                  title={title}
                  secondaryMeta={contentSubtitle}
                  fallbackType={getFallbackType(activityType)}
                />
              ) : (
                <CardContentPreview
                  imageUrl={imageUrl}
                  title={title}
                  secondaryMeta={contentSubtitle}
                  fallbackType={getFallbackType(activityType)}
                />
              )}
            </Link>
          ) : null}

          {quotedPost ? (
            <QuotedPostPreview item={quotedPost} isFlat={isFlat} />
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-skin-muted">
              <PostAction
                icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                label={t("actions.reply")}
                count={item.stats?.replyCount ?? 0}
              />
              <PostAction
                icon={<HeartSolidIcon className="h-4 w-4" />}
                label={t("actions.like")}
                count={likeCount}
                active={hasLiked}
                onClick={handleLikeToggle}
              />
              <PostAction
                icon={<ArrowPathRoundedSquareIcon className="h-4 w-4" />}
                label={t("actions.quote")}
                count={item.stats?.quoteCount ?? 0}
                onClick={handleQuote}
              />
            </div>

            <div className="relative flex items-center gap-3 text-skin-muted" ref={menuRef}>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium text-skin-muted"
                aria-label={t("actions.view")}
              >
                <EyeIcon className="h-4 w-4" />
                <span>{item.stats?.viewCount ?? 0}</span>
              </span>
              <button
                type="button"
                onClick={handleMenuToggle}
                className="inline-flex items-center justify-center rounded-full p-1 text-skin-muted transition hover:text-skin-text"
                aria-label={t("actions.more")}
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>

              {isMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-20 mt-2 min-w-[12rem] rounded-2xl border border-skin-border/60 bg-skin-surface p-2 shadow-lg shadow-black/10"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownAction
                    icon={<BookmarkIcon className="h-4 w-4" />}
                    label={t("actions.save")}
                    meta={bookmarkCount > 0 ? String(bookmarkCount) : undefined}
                    active={hasBookmarked}
                    disabled={bookmarking}
                    onClick={handleBookmarkToggle}
                  />
                  <DropdownAction
                    icon={<ShareIcon className="h-4 w-4" />}
                    label={t("actions.share")}
                    onClick={handleShare}
                  />
                  {canDelete ? (
                    <DropdownAction
                      icon={<TrashIcon className="h-4 w-4" />}
                      label={t("actions.delete")}
                      disabled={deleting}
                      onClick={handleDelete}
                      tone="danger"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CardContentPreview({
  imageUrl,
  title,
  secondaryMeta,
  fallbackType,
}: {
  imageUrl: string | null;
  title: string;
  secondaryMeta: string;
  fallbackType: "movie" | "tv" | "game" | "book" | "other";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-skin-base">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <UniversalCoverFallback
            title={title}
            type={fallbackType}
            variant="compact"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="truncate text-sm font-medium text-skin-text">{title}</h3>
        {secondaryMeta ? (
          <p className="mt-1 line-clamp-2 text-sm text-skin-muted">
            {secondaryMeta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FlatContentPreview({
  imageUrl,
  title,
  secondaryMeta,
  fallbackType,
}: {
  imageUrl: string | null;
  title: string;
  secondaryMeta: string;
  fallbackType: "movie" | "tv" | "game" | "book" | "other";
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-skin-surface px-3 py-3">
      <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-skin-base">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <UniversalCoverFallback
            title={title}
            type={fallbackType}
            variant="compact"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 text-base font-semibold text-skin-text">
          {title}
        </h3>
        {secondaryMeta ? (
          <p className="mt-1 line-clamp-2 text-sm text-skin-muted">
            {secondaryMeta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QuotedPostPreview({
  item,
  isFlat,
}: {
  item: FeedQuotedPostDto;
  isFlat: boolean;
}) {
  const { t } = useTranslation("feed");
  const imageUrl = getFeedImageUrl(item);
  const title = getFeedTitle(item);
  const targetPath = getFeedTargetPath(item);
  const activityType = getFeedActivityType(item);
  const fallbackType = getFallbackType(activityType);
  const quotedText = item.textContent?.trim() || title;

  return (
    <Link
      to={`/feed/${item.id}`}
      onClick={(event) => event.stopPropagation()}
      className={`mt-4 block rounded-2xl border border-skin-border/50 bg-skin-base/60 p-4 transition hover:border-skin-primary/30 ${
        isFlat ? "rounded-xl" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-skin-muted">
        <span className="font-semibold text-skin-text">{item.actor.username}</span>
        <span>·</span>
        <span>
          {item.type === FeedPostType.Quote
            ? t("actions.quote")
            : item.activity
              ? t("labels.shared_in_feed")
              : t("post.eyebrow")}
        </span>
      </div>

      {item.textContent ? (
        <p className="mt-2 text-sm leading-6 text-skin-text/90">{item.textContent}</p>
      ) : null}

      {targetPath ? (
        <div className="mt-3 rounded-xl border border-skin-border/40 bg-skin-surface px-3 py-3">
          <CardContentPreview
            imageUrl={imageUrl}
            title={quotedText}
            secondaryMeta=""
            fallbackType={fallbackType}
          />
        </div>
      ) : !item.textContent ? (
        <p className="mt-2 text-sm leading-6 text-skin-text/90">{quotedText}</p>
      ) : null}
    </Link>
  );
}

function PostAction({
  icon,
  label,
  count,
  active = false,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick ?? ((event) => event.stopPropagation())}
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition hover:text-skin-text disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "text-skin-primary" : "text-skin-muted"
      }`}
      aria-label={label}
    >
      {icon}
      {typeof count === "number" ? <span>{count}</span> : null}
    </button>
  );
}

function DropdownAction({
  icon,
  label,
  meta,
  active = false,
  disabled = false,
  tone = "default",
  onClick,
}: {
  icon: ReactNode;
  label: string;
  meta?: string;
  active?: boolean;
  disabled?: boolean;
  tone?: "default" | "danger";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-skin-base disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger"
          ? "text-rose-500 hover:text-rose-600"
          : active
            ? "text-skin-primary"
            : "text-skin-text"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {meta ? <span className="text-xs text-skin-muted">{meta}</span> : null}
    </button>
  );
}

function renderDescription(
  description: string,
  title: string,
  targetPath: string | null,
) {
  if (!targetPath || !title || !description.includes(title)) {
    return description;
  }

  const [before, ...afterParts] = description.split(title);
  const after = afterParts.join(title);

  return (
    <>
      {before}
      <Link
        to={targetPath}
        className="font-medium text-skin-primary transition hover:text-skin-secondary"
        onClick={(event) => event.stopPropagation()}
      >
        {title}
      </Link>
      {after}
    </>
  );
}

function getActivityLabel(
  item: FeedItemDto,
  type: FeedActivityType | null,
  hasActivity: boolean,
  t: ReturnType<typeof useTranslation<"feed">>["t"],
): string {
  if (item.type === FeedPostType.Reply) {
    return t("labels.reply");
  }

  if (item.type === FeedPostType.Quote) {
    return t("labels.quote");
  }

  if (!hasActivity || type === null) {
    return t("labels.shared_in_feed");
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
    case FeedActivityType.EpisodesWatchedBatch:
    case FeedActivityType.SeasonCompleted:
    case FeedActivityType.ShowCompleted:
      return t("labels.watching");
    case FeedActivityType.MovieWatched:
      return t("labels.movie");
    case FeedActivityType.MediaRated:
    case FeedActivityType.GameRated:
    case FeedActivityType.BookRated:
      return t("labels.rating");
    case FeedActivityType.MediaReviewAdded:
    case FeedActivityType.GameReviewAdded:
    case FeedActivityType.BookReviewAdded:
      return t("labels.review");
    case FeedActivityType.GameStarted:
    case FeedActivityType.GameCompleted:
      return t("labels.gaming");
    case FeedActivityType.BookStarted:
    case FeedActivityType.BookFinished:
      return t("labels.reading");
    default:
      return t("labels.library");
  }
}

function getSecondaryMeta(
  item: FeedItemDto,
  t: ReturnType<typeof useTranslation<"feed">>["t"],
): string {
  const payload = item.activity?.payload;
  const type = item.activity?.type;

  if (!payload || type == null) {
    return t("labels.shared_in_feed");
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
      return t("meta.season_episode", {
        season: getNumber(payload.seasonNumber),
        episode: getNumber(payload.episodeNumber),
      });
    case FeedActivityType.EpisodesWatchedBatch:
      return t("meta.season_count", {
        season: getNumber(payload.seasonNumber),
        count: getEpisodeCount(payload),
      });
    case FeedActivityType.SeasonCompleted:
      return t("meta.season_completed", {
        season: getNumber(payload.seasonNumber),
      });
    case FeedActivityType.MediaRated:
    case FeedActivityType.GameRated:
    case FeedActivityType.BookRated:
      return t("meta.rating", { rating: getNumber(payload.rating) });
    case FeedActivityType.MediaReviewAdded:
    case FeedActivityType.GameReviewAdded:
    case FeedActivityType.BookReviewAdded:
      return t("meta.review");
    default:
      return t("labels.shared_in_feed");
  }
}

function getContentSubtitle(item: FeedItemDto, fallback: string): string {
  const payload = item.activity?.payload;

  if (!payload) {
    return fallback;
  }

  const safeFallback =
    fallback === "Akışta paylaşıldı" || fallback === "Shared in feed" ? "" : fallback;

  const primary =
    getString(payload.studio) ??
    getString(payload.Studio) ??
    getString(payload.productionCompany) ??
    getString(payload.ProductionCompany) ??
    getString(payload.publisher) ??
    getString(payload.Publisher) ??
    getString(payload.developer) ??
    getString(payload.Developer) ??
    getString(payload.developers) ??
    getString(payload.Developers) ??
    getString(payload.author) ??
    getString(payload.Author) ??
    getString(payload.authors) ??
    getString(payload.Authors);

  const secondary =
    getString(payload.genre) ??
    getString(payload.Genre) ??
    getString(payload.genres) ??
    getString(payload.Genres) ??
    getString(payload.category);

  if (primary && secondary) {
    return `${primary} • ${secondary}`;
  }

  if (primary) {
    return primary;
  }

  if (secondary) {
    return secondary;
  }

  return safeFallback;
}

function getString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return items.length > 0 ? items.join(", ") : undefined;
  }

  return undefined;
}

function getFallbackType(
  type: FeedActivityType | null,
): "movie" | "tv" | "game" | "book" | "other" {
  if (type == null) {
    return "other";
  }

  switch (type) {
    case FeedActivityType.EpisodeWatched:
    case FeedActivityType.EpisodesWatchedBatch:
    case FeedActivityType.SeasonCompleted:
    case FeedActivityType.ShowCompleted:
      return "tv";
    case FeedActivityType.MovieWatched:
    case FeedActivityType.MediaRated:
    case FeedActivityType.MediaReviewAdded:
      return "movie";
    case FeedActivityType.GameStarted:
    case FeedActivityType.GameCompleted:
    case FeedActivityType.GameRated:
    case FeedActivityType.GameReviewAdded:
      return "game";
    case FeedActivityType.BookStarted:
    case FeedActivityType.BookFinished:
    case FeedActivityType.BookRated:
    case FeedActivityType.BookReviewAdded:
      return "book";
    default:
      return "other";
  }
}

function getNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function getEpisodeCount(payload: Record<string, unknown>): number {
  const episodeNumbers = payload.episodeNumbers;
  return Array.isArray(episodeNumbers) ? episodeNumbers.length : 0;
}
