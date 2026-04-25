import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  EyeSlashIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import PostCard from "@/features/feed/components/PostCard";
import ComposerMediaPreview from "@/features/feed/components/ComposerMediaPreview";
import { feedApi, getActorAvatarUrl } from "@/features/feed/api/feedApi";
import {
  applyPostUpdateToList,
  subscribeToPostUpdates,
} from "@/features/feed/services/postUpdateEvents";
import type { FeedItemDto } from "@/features/feed/types";
import { getApiErrorMessage } from "@/shared/lib/api";

export default function FeedPage() {
  const { t } = useTranslation(["feed", "search"]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const currentUserAvatarUrl = getActorAvatarUrl(user?.avatarUrl);

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
      const createdPost = await feedApi.createPost(value, selectedFiles, isSpoiler);
      setItems((current) => [createdPost, ...current]);
      setPostText("");
      setSelectedFiles([]);
      setIsSpoiler(false);
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
    navigate(trimmed.length > 0 ? `/search?q=${encodeURIComponent(trimmed)}&tab=users` : "/search");
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

        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-xl lg:w-[360px] lg:shrink-0"
        >
          <label className="relative block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-skin-muted" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
            <textarea
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              rows={3}
              maxLength={4000}
              placeholder={t("page.composer.placeholder")}
              className="w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 text-skin-text outline-none placeholder:text-skin-muted focus:ring-0"
            />

            <div className="mt-3">
              <ComposerMediaPreview
                files={selectedFiles}
                onRemove={(index) =>
                  setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            </div>

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
