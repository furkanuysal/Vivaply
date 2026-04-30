import type { ReactNode } from "react";
import {
  BookOpenIcon,
  BellIcon,
  BookmarkIcon,
  FilmIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export interface NavigationChild {
  name: string;
  path: string;
}

export interface NavigationItem {
  key: string;
  name: string;
  icon: ReactNode;
  path?: string;
  badgeCount?: number;
  children?: NavigationChild[];
}

export function getMainNavigation(
  user: { username?: string } | null | undefined,
  t: any,
  unreadNotificationCount = 0,
): NavigationItem[] {
  return [
    {
      key: "dashboard",
      name: t("menu.dashboard") || "Dashboard",
      path: "/dashboard",
      icon: <Squares2X2Icon className="h-5 w-5 shrink-0" />,
    },
    {
      key: "feed",
      name: t("menu.feed"),
      path: "/feed",
      icon: <NewspaperIcon className="h-5 w-5 shrink-0" />,
    },
    {
      key: "profile",
      name: t("menu.profile"),
      path: user?.username ? `/${user.username}` : "/dashboard",
      icon: <HomeIcon className="h-5 w-5 shrink-0" />,
    },
    {
      key: "bookmarks",
      name: t("menu.bookmarks"),
      path: "/bookmarks",
      icon: <BookmarkIcon className="h-5 w-5 shrink-0" />,
    },
    {
      key: "notifications",
      name: t("menu.notifications"),
      path: "/notifications",
      icon: <BellIcon className="h-5 w-5 shrink-0" />,
      badgeCount: unreadNotificationCount,
    },
    {
      key: "search",
      name: t("menu.search"),
      path: "/search",
      icon: <MagnifyingGlassIcon className="h-5 w-5 shrink-0" />,
    },
    {
      key: "entertainment",
      name: t("menu.entertainment"),
      icon: <FilmIcon className="h-5 w-5 shrink-0" />,
      children: [
        {
          name: t("menu.discover"),
          path: "/entertainment",
        },
        {
          name: t("menu.library"),
          path: "/entertainment/library",
        },
      ],
    },
    {
      key: "knowledge",
      name: t("menu.knowledge"),
      icon: <BookOpenIcon className="h-5 w-5 shrink-0" />,
      children: [
        {
          name: t("menu.discover_books"),
          path: "/knowledge",
        },
        {
          name: t("menu.books_library"),
          path: "/knowledge/library/book",
        },
      ],
    },
  ];
}
