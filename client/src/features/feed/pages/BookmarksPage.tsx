import { useEffect, useState } from "react";
import { ArrowPathIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import PostCard from "@/features/feed/components/PostCard";
import { feedApi } from "@/features/feed/api/feedApi";
import {
  applyPostUpdateToList,
  subscribeToPostUpdates,
  type PostUpdatePayload,
} from "@/features/feed/services/postUpdateEvents";
import type { FeedItemDto } from "@/features/feed/types";

function applyBookmarkPageUpdate(items: FeedItemDto[], update: PostUpdatePayload) {
  let nextItems = applyPostUpdateToList(items, update);

  if (update.postId && update.viewer?.hasBookmarked === false) {
    nextItems = nextItems.filter((item) => item.id !== update.postId);
  }

  return nextItems;
}

export default function BookmarksPage() {
  const { t } = useTranslation("feed");
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    void loadBookmarks();
  }, []);

  useEffect(
    () =>
      subscribeToPostUpdates((update) => {
        setItems((current) => applyBookmarkPageUpdate(current, update));
      }),
    [],
  );

  const loadBookmarks = async (cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await feedApi.getBookmarks(cursor);

      setItems((prev) => (cursor ? [...prev, ...response.items] : response.items));
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("Bookmarks could not be loaded", error);
      toast.error(t("bookmarks.empty_title"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 md:px-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-skin-primary/80">
          {t("bookmarks.eyebrow")}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-skin-text">
          {t("bookmarks.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-skin-muted">
          {t("bookmarks.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface/70 px-8 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-skin-base text-skin-muted">
            <BookmarkIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-skin-text">
            {t("bookmarks.empty_title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-skin-muted">
            {t("bookmarks.empty_subtitle")}
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
            onClick={() => void loadBookmarks(nextCursor)}
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
