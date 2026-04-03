import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import FeedItemCard from "@/features/feed/components/FeedItemCard";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedItemDto } from "@/features/feed/types";

export default function FeedPage() {
  const { t } = useTranslation("feed");
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    void loadFeed();
  }, []);

  const loadFeed = async (cursor?: string | null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await feedService.getFeed(cursor);

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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 md:px-6">
      <div className="space-y-2">
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
            <FeedItemCard key={item.id} item={item} />
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
