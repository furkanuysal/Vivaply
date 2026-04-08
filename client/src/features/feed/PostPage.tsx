import {
  ArrowLeftIcon,
  FaceSmileIcon,
  MapPinIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Location, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/features/auth/context/AuthContext";
import PostCard from "@/features/feed/components/PostCard";
import { feedService, getActorAvatarUrl } from "@/features/feed/services/feedService";
import {
  applyPostUpdate,
  publishPostUpdate,
  subscribeToPostUpdates,
} from "@/features/feed/services/postUpdateEvents";
import type { FeedItemDto } from "@/features/feed/types";

interface PostPageProps {
  isModal?: boolean;
}

interface ModalNavigationState {
  backgroundLocation?: Location;
  modalDepth?: number;
}

export default function PostPage({ isModal = false }: PostPageProps) {
  const { t } = useTranslation("feed");
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [item, setItem] = useState<FeedItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isReplyComposerOpen, setIsReplyComposerOpen] = useState(false);
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
        const response = await feedService.getPostById(postId);
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

  const handleReplySubmit = async () => {
    const value = replyText.trim();

    if (!postId || !value) {
      return;
    }

    try {
      setSubmittingReply(true);
      const reply = await feedService.replyToPost(postId, value);
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

      setReplyText("");
      setIsReplyComposerOpen(false);
    } catch (error) {
      console.error("Reply could not be created", error);
      toast.error(t("post.errors.reply"));
    } finally {
      setSubmittingReply(false);
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

      <section className="rounded-xl border border-skin-border/20 bg-skin-surface px-4 py-4 shadow-sm">
        <PostCard item={item} disablePostNavigation variant="detailMain" />
      </section>

      <section className="mt-4 rounded-xl border border-skin-border/20 bg-skin-surface px-4 py-4 shadow-sm">
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
            {!isReplyComposerOpen ? (
              <button
                type="button"
                onClick={() => setIsReplyComposerOpen(true)}
                className="w-full px-0 py-1 text-left text-[15px] text-skin-muted transition hover:text-skin-text"
              >
                {t("post.reply_compact_placeholder")}
              </button>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder={t("post.reply_placeholder")}
                  className="w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 text-skin-text outline-none placeholder:text-skin-muted focus:ring-0"
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-skin-muted">
                    <button
                      type="button"
                      className="rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
                      aria-label={t("actions.media")}
                    >
                      <PhotoIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
                      aria-label={t("actions.emoji")}
                    >
                      <FaceSmileIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 text-skin-muted transition hover:bg-skin-base hover:text-skin-text"
                      aria-label={t("actions.location")}
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-skin-muted">
                      {t("post.reply_count_hint", { count: replyText.trim().length })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplyComposerOpen(false);
                        setReplyText("");
                      }}
                      className="text-sm font-medium text-skin-muted transition hover:text-skin-text"
                    >
                      {t("post.reply_cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReplySubmit()}
                      disabled={submittingReply || !replyText.trim() || !user}
                      className="inline-flex items-center justify-center rounded-full bg-skin-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingReply
                        ? t("post.reply_submitting")
                        : t("post.reply_submit")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
  const leftTime = new Date(left.updatedAt || left.publishedAt).getTime();
  const rightTime = new Date(right.updatedAt || right.publishedAt).getTime();

  if (leftTime === rightTime) {
    return left.id.localeCompare(right.id);
  }

  return leftTime - rightTime;
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
