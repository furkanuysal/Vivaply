import { Outlet, Link, useLocation } from "react-router-dom";
import { authService } from "../features/auth/services/authService";
import {
  HomeIcon,
  FilmIcon,
  BookOpenIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSelector from "./LanguageSelector";

export default function DashboardLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "entertainment",
    "knowledge",
  ]);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation("layout");

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (key: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus([key]);
    } else {
      setExpandedMenus((prev) =>
        prev.includes(key)
          ? prev.filter((item) => item !== key)
          : [...prev, key]
      );
    }
  };

  const menuItems = [
    {
      key: "profile",
      name: t("menu.profile"),
      path: "/profile",
      icon: <HomeIcon className="w-5 h-5 shrink-0" />,
    },
    {
      key: "entertainment",
      name: t("menu.entertainment"),
      icon: <FilmIcon className="w-5 h-5 shrink-0" />,
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
      icon: <BookOpenIcon className="w-5 h-5 shrink-0" />,
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

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/";
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 88 },
  };

  const mainVariants = {
    expanded: { marginLeft: 280 },
    collapsed: { marginLeft: 88 },
    mobile: { marginLeft: 0 },
  };

  return (
    <div className="min-h-screen bg-skin-surface text-skin-text flex font-sans selection:bg-skin-primary/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-skin-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-skin-secondary/10 rounded-full blur-[128px]" />
      </div>

      {/* 🟢 SIDEBAR (Desktop) */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed h-full z-20 hidden md:flex flex-col border-r border-skin-border/20 bg-skin-surface/80 backdrop-blur-xl"
      >
        <div
          className={`h-20 flex items-center ${
            isCollapsed ? "justify-center" : "px-6 gap-4"
          } relative`}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-skin-primary to-skin-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-skin-primary/25 shrink-0 z-10 p-[1px]">
            <div className="w-full h-full bg-skin-surface rounded-[11px] flex items-center justify-center">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-skin-primary to-skin-secondary text-xl">
                V
              </span>
            </div>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {t("brand")}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-skin-surface border border-skin-border text-skin-muted hover:text-skin-text rounded-full p-1.5 shadow-xl hover:bg-skin-border/20 transition-all z-20"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-3 h-3" />
            ) : (
              <ChevronLeftIcon className="w-3 h-3" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const hasChildren = !!item.children;

            if (hasChildren) {
              const isExpanded = expandedMenus.includes(item.key);
              const isActiveGroup = item.children?.some(
                (child) => location.pathname === child.path
              );

              return (
                <div key={item.key} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`nav-item w-full flex items-center relative group transition-all duration-200 ${
                      isCollapsed
                        ? "justify-center px-2 py-3"
                        : "justify-between px-3 py-3"
                    } rounded-xl ${
                      isActiveGroup
                        ? "bg-skin-primary/10 text-skin-primary"
                        : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isCollapsed ? "justify-center" : "gap-3"
                      }`}
                    >
                      <span
                        className={`transition-colors ${
                          isActiveGroup
                            ? "text-skin-primary"
                            : "group-hover:text-skin-text"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {!isCollapsed && (
                      <ChevronRightIcon
                        className={`w-3.5 h-3.5 text-skin-muted transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {!isCollapsed && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-0.5 pt-1 pb-2">
                          {item.children?.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`block py-2.5 pl-11 pr-4 rounded-lg text-sm transition-all duration-200 ${
                                location.pathname === child.path
                                  ? "text-skin-primary bg-skin-primary/5 font-medium"
                                  : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center relative group transition-all duration-200 ${
                  isCollapsed ? "justify-center px-2 py-3" : "px-3 py-3 gap-3"
                } rounded-xl ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-skin-primary to-skin-secondary text-white shadow-lg shadow-skin-primary/20"
                    : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                }`}
              >
                {item.icon}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-skin-border/20 backdrop-blur-md">
          <div className="space-y-1">
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "px-3 gap-3"
              }`}
            >
              <ThemeToggle />
              <LanguageSelector isCollapsed={isCollapsed} />
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center w-full transition-all duration-200 ${
                isCollapsed ? "justify-center px-2 py-3" : "px-3 py-3 gap-3"
              } rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10`}
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {t("buttons.logout")}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* 🔵 CONTENT AREA */}
      <motion.main
        animate={isMobile ? "mobile" : isCollapsed ? "collapsed" : "expanded"}
        variants={mainVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 min-h-screen bg-skin-base relative z-10"
      >
        {/* Mobile Header */}
        <header className="md:hidden h-16 px-4 flex items-center justify-between border-b border-skin-border/20 bg-skin-surface/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-skin-muted hover:text-skin-text active:bg-skin-text/5"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-skin-primary to-skin-secondary">
              {t("brand")}
            </span>
          </div>
          {/* Header Right */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* 📱 MOBILE SIDEBAR OVERLAY */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />

              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-skin-surface border-r border-skin-border/10 z-50 md:hidden flex flex-col shadow-2xl"
              >
                <div className="h-20 flex items-center justify-between px-6 border-b border-skin-border/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-skin-primary to-skin-secondary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-skin-primary/20">
                      V
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">
                      {t("brand")}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 -mr-2 rounded-full text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                  {/* Mobile Menu Items Reuse Logic */}
                  {menuItems.map((item) => {
                    if (item.children) {
                      const isExpanded = expandedMenus.includes(item.key);
                      const isActiveGroup = item.children.some(
                        (child) => location.pathname === child.path
                      );

                      return (
                        <div key={item.key} className="space-y-1">
                          <button
                            onClick={() => toggleMenu(item.key)}
                            className={`flex items-center w-full justify-between px-4 py-3 rounded-xl transition-all ${
                              isActiveGroup
                                ? "bg-skin-primary/10 text-skin-primary"
                                : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronRightIcon
                              className={`w-4 h-4 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 space-y-1 pb-2 pt-1">
                                  {item.children.map((child) => (
                                    <Link
                                      key={child.path}
                                      to={child.path}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className={`block py-2.5 px-4 rounded-lg text-sm transition-colors ${
                                        location.pathname === child.path
                                          ? "text-skin-primary bg-skin-primary/5 font-medium border-l-2 border-skin-primary"
                                          : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                                      }`}
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.key}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          location.pathname === item.path
                            ? "bg-skin-primary text-white shadow-lg shadow-skin-primary/40"
                            : "text-skin-muted hover:text-skin-text hover:bg-skin-text/5"
                        }`}
                      >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-skin-border/5 space-y-2">
                  <LanguageSelector isCollapsed={false} />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 w-full py-3 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    <ArrowRightStartOnRectangleIcon className="w-6 h-6 shrink-0" />
                    <span className="font-medium">{t("buttons.logout")}</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="relative p-4 md:p-8 max-w-7xl mx-auto">
          {/* Subtle fade-in for content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
