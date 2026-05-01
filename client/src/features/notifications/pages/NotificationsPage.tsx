import { useEffect, useMemo, useState } from "react";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { accountApi } from "@/features/account/api/accountApi";
import { getActorAvatarUrl, getRelativeTime } from "@/features/feed/api/feedApi";
import { notificationsApi } from "@/features/notifications/api/notificationsApi";
import type {
  NotificationItemDto,
  NotificationListDto,
  NotificationTab,
} from "@/features/notifications/types";
import { getApiErrorMessage } from "@/shared/lib/api";

const EMPTY_RESULTS: NotificationListDto = {
  items: [],
  unreadCount: 0,
};

function getValidTab(value: string | null): NotificationTab {
  return value === "unread" ? "unread" : "all";
}

function buildTargetPath(item: NotificationItemDto): string | null {
  if (item.postId) {
    return `/post/${item.postId}`;
  }

  if (item.actor?.username) {
    return `/${item.actor.username}`;
  }

  return null;
}

function dispatchNotificationsChanged() {
  window.dispatchEvent(new Event("notifications:changed"));
}

function dispatchFollowRequestAccepted(requesterId: string) {
  window.dispatchEvent(
    new CustomEvent("follow-request:accepted", {
      detail: { requesterId },
    }),
  );
}

function getNotificationTypeLabel(
  type: NotificationItemDto["type"],
  t: ReturnType<typeof useTranslation<"notifications">>["t"],
) {
  switch (type) {
    case "follow":
      return t("items.follow");
    case "like":
      return t("items.like");
    case "reply":
      return t("items.reply");
    case "quote":
      return t("items.quote");
    case "mention":
      return t("items.mention");
    case "followrequest":
      return t("items.follow_request");
    case "followaccepted":
      return t("items.follow_accepted");
    default:
      return t("items.mention");
  }
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation("notifications");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = getValidTab(searchParams.get("tab"));
  const [results, setResults] = useState<NotificationListDto>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await notificationsApi.getNotifications(activeTab === "unread");
        if (!cancelled) {
          setResults(response);
        }
      } catch (error) {
        if (!cancelled) {
          if (showLoader) {
            setResults(EMPTY_RESULTS);
            toast.error(getApiErrorMessage(error) ?? t("errors.load"));
          }
        }
      } finally {
        if (!cancelled && showLoader) {
          setLoading(false);
        }
      }
    };

    void load(true);

    const handleWindowFocus = () => {
      void load(false);
    };

    const handleNotificationsChanged = () => {
      void load(false);
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("notifications:changed", handleNotificationsChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
    };
  }, [activeTab, t]);

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: t("tabs.all") },
      { key: "unread" as const, label: t("tabs.unread"), count: results.unreadCount },
    ],
    [results.unreadCount, t],
  );

  const handleTabChange = (tab: NotificationTab) => {
    navigate(tab === "all" ? "/notifications" : `/notifications?tab=${tab}`);
  };

  const handleOpen = async (item: NotificationItemDto) => {
    const targetPath = buildTargetPath(item);
    if (!targetPath) {
      return;
    }

    try {
      setProcessingId(item.id);

      if (!item.isRead) {
        await notificationsApi.markAsRead(item.id);
        setResults((current) => ({
          unreadCount: Math.max(0, current.unreadCount - 1),
          items:
            activeTab === "unread"
              ? current.items.filter((entry) => entry.id !== item.id)
              : current.items.map((entry) =>
                  entry.id === item.id ? { ...entry, isRead: true } : entry,
                ),
        }));
        dispatchNotificationsChanged();
      }

      navigate(targetPath);
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? t("errors.mark_read"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const updatedCount = await notificationsApi.markAllAsRead();
      if (updatedCount === 0) {
        return;
      }

      setResults((current) => ({
        unreadCount: 0,
        items:
          activeTab === "unread"
            ? []
            : current.items.map((item) => ({ ...item, isRead: true })),
      }));
      dispatchNotificationsChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? t("errors.mark_all_read"));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleFollowRequestAction = async (
    item: NotificationItemDto,
    action: "accept" | "reject",
  ) => {
    if (!item.actor?.id) {
      return;
    }

    try {
      setActioningId(item.id);

      if (action === "accept") {
        await accountApi.acceptFollowRequest(item.actor.id);
      } else {
        await accountApi.rejectFollowRequest(item.actor.id);
      }

      setResults((current) => ({
        unreadCount: item.isRead ? current.unreadCount : Math.max(0, current.unreadCount - 1),
        items: current.items.filter((entry) => entry.id !== item.id),
      }));
      dispatchNotificationsChanged();
      if (action === "accept" && item.actor?.id) {
        dispatchFollowRequestAccepted(item.actor.id);
      }
      toast.success(
        action === "accept"
          ? t("actions.follow_request_accepted")
          : t("actions.follow_request_rejected"),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? t("errors.follow_request_action"));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-6 md:px-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-skin-border/50 bg-skin-surface/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
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

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={results.unreadCount === 0 || markingAll}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-skin-border/60 bg-skin-base px-4 text-sm font-medium text-skin-text transition hover:border-skin-primary/30 hover:text-skin-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckIcon className="mr-2 h-4 w-4" />
          {t("actions.mark_all_read")}
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-skin-border/50 bg-skin-surface/90 shadow-sm">
        <div className="border-b border-skin-border/40">
          <div className="grid grid-cols-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`border-b-2 px-4 py-4 text-sm font-medium transition ${
                    isActive
                      ? "border-skin-primary text-skin-primary"
                      : "border-transparent text-skin-muted hover:text-skin-text"
                  }`}
                >
                  <span>{tab.label}</span>
                  {"count" in tab && tab.count ? (
                    <span className="ml-2 text-xs text-skin-muted">{tab.count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center text-skin-text">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-skin-primary"></div>
          </div>
        ) : results.items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-skin-base text-skin-muted">
              <BellIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-skin-text">
              {activeTab === "unread" ? t("states.empty_unread_title") : t("states.empty_title")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-skin-muted">
              {activeTab === "unread" ? t("states.empty_unread_subtitle") : t("states.empty_subtitle")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-skin-border/30">
            {results.items.map((item) => {
              const avatarUrl = getActorAvatarUrl(item.actor?.avatarUrl ?? undefined);
              const isBusy = processingId === item.id;
              const isFollowRequest = item.type === "followrequest";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleOpen(item)}
                  disabled={isBusy || actioningId === item.id}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-skin-base/50 ${
                    isFollowRequest
                      ? "border-l-2 border-l-skin-primary/50 bg-skin-primary/[0.07]"
                      : item.isRead
                        ? ""
                        : "bg-skin-primary/5"
                  }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-skin-border/40 bg-skin-base">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={item.actor?.username ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-skin-text">
                        {item.actor?.username?.slice(0, 1).toUpperCase() ?? "?"}
                      </div>
                    )}
                    {!item.isRead ? (
                      <span className="absolute -right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-skin-surface bg-skin-primary" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                      <p className="min-w-0 text-sm leading-6 text-skin-text">
                        <span className="font-semibold text-skin-text">
                          {item.actor?.username ?? t("content.someone")}
                        </span>{" "}
                        <span className="text-skin-muted">
                          {getNotificationTypeLabel(item.type, t)}
                        </span>
                      </p>
                      <span className="shrink-0 text-xs text-skin-muted">
                        {getRelativeTime(item.createdAt, i18n.resolvedLanguage)}
                      </span>
                    </div>

                    {item.postPreview ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-skin-muted">
                        {item.postPreview}
                      </p>
                    ) : null}

                    {isFollowRequest ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-skin-primary/20 bg-skin-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-skin-primary">
                          {t("badges.request")}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleFollowRequestAction(item, "accept");
                          }}
                          disabled={actioningId === item.id}
                          className="inline-flex items-center justify-center rounded-full bg-skin-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-skin-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t("actions.accept")}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleFollowRequestAction(item, "reject");
                          }}
                          disabled={actioningId === item.id}
                          className="inline-flex items-center justify-center rounded-full border border-skin-border/60 bg-skin-base px-3.5 py-2 text-xs font-semibold text-skin-text transition hover:border-skin-primary/30 hover:text-skin-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t("actions.reject")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
