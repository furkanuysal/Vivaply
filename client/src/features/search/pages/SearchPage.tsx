import { type FormEvent, useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import PostCard from "@/features/feed/components/PostCard";
import { searchApi } from "@/features/search/api/searchApi";
import SearchUserCard from "@/features/search/components/SearchUserCard";
import type { SearchResponseDto, SearchTab } from "@/features/search/types";
import { getApiErrorMessage } from "@/shared/lib/api";

const DEFAULT_RESULTS: SearchResponseDto = {
  users: [],
  posts: [],
};

function getValidTab(value: string | null): SearchTab {
  return value === "users" || value === "posts" ? value : "users";
}

export default function SearchPage() {
  const { t } = useTranslation("search");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const tab = getValidTab(searchParams.get("tab"));
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<SearchResponseDto>(DEFAULT_RESULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    if (query.length < 2) {
      setResults(DEFAULT_RESULTS);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      try {
        setLoading(true);
        const response = await searchApi.search(query);
        if (!cancelled) {
          setResults(response);
        }
      } catch (error) {
        if (!cancelled) {
          setResults(DEFAULT_RESULTS);
          toast.error(getApiErrorMessage(error) ?? t("errors.load"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [query, t]);

  const tabs = useMemo(
    () => [
      { key: "users" as const, label: t("tabs.users"), count: results.users.length },
      { key: "posts" as const, label: t("tabs.posts"), count: results.posts.length },
    ],
    [results.posts.length, results.users.length, t],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    navigate(
      trimmed.length > 0
        ? `/search?q=${encodeURIComponent(trimmed)}&tab=${tab}`
        : "/search",
    );
  };

  const handleTabChange = (nextTab: SearchTab) => {
    const nextQuery = query.length > 0 ? `?q=${encodeURIComponent(query)}&tab=${nextTab}` : `?tab=${nextTab}`;
    navigate(`/search${nextQuery}`);
  };

  const showPrompt = query.length === 0;
  const showMinLength = query.length > 0 && query.length < 2;
  const showTabs = !showPrompt && !showMinLength;
  const activeItems = tab === "users" ? results.users : results.posts;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-6 md:px-6">
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

      <section className="rounded-3xl border border-skin-border/50 bg-skin-surface/90 p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-skin-muted" />
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={t("page.search_placeholder")}
              className="h-12 w-full rounded-2xl border border-skin-border/60 bg-skin-base pl-12 pr-4 text-sm text-skin-text outline-none transition focus:border-skin-primary/40"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-skin-primary px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t("page.search_button")}
          </button>
        </form>

        {showTabs ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((item) => {
              const isActive = item.key === tab;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabChange(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-skin-primary text-white"
                      : "bg-skin-base text-skin-muted hover:text-skin-text"
                  }`}
                >
                  {item.label}{" "}
                  <span className={isActive ? "text-white/80" : "text-skin-muted"}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {showPrompt ? (
        <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface/70 px-8 py-14 text-center">
          <h2 className="text-xl font-semibold text-skin-text">{t("states.idle_title")}</h2>
          <p className="mt-3 text-sm leading-6 text-skin-muted">{t("states.idle_subtitle")}</p>
        </div>
      ) : showMinLength ? (
        <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface/70 px-8 py-14 text-center">
          <h2 className="text-xl font-semibold text-skin-text">{t("states.min_length_title")}</h2>
          <p className="mt-3 text-sm leading-6 text-skin-muted">{t("states.min_length_subtitle")}</p>
        </div>
      ) : loading ? (
        <div className="flex h-[40vh] items-center justify-center text-skin-text">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-skin-border/60 bg-skin-surface/70 px-8 py-14 text-center">
          <h2 className="text-xl font-semibold text-skin-text">{t("states.empty_title")}</h2>
          <p className="mt-3 text-sm leading-6 text-skin-muted">
            {tab === "users" ? t("states.empty_users") : t("states.empty_posts")}
          </p>
        </div>
      ) : tab === "users" ? (
        <div className="space-y-3">
          {results.users.map((user) => (
            <SearchUserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {results.posts.map((post) => (
            <PostCard key={post.id} item={post} />
          ))}
        </div>
      )}
    </div>
  );
}
