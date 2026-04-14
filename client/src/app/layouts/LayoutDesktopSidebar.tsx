import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { LanguageSelector, ThemeToggle } from "@/shared/ui";
import type { NavigationItem } from "./navigation";

interface LayoutDesktopSidebarProps {
  isCollapsed: boolean;
  expandedMenus: string[];
  locationPathname: string;
  menuItems: NavigationItem[];
  brandLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  onToggleCollapsed: () => void;
  onToggleMenu: (key: string) => void;
  onLogout: () => void;
}

export default function LayoutDesktopSidebar({
  isCollapsed,
  expandedMenus,
  locationPathname,
  menuItems,
  brandLabel,
  settingsLabel,
  logoutLabel,
  onToggleCollapsed,
  onToggleMenu,
  onLogout,
}: LayoutDesktopSidebarProps) {
  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 88 },
  };

  return (
    <motion.aside
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass-sidebar fixed z-20 hidden h-full flex-col md:flex"
    >
      <div
        className={`relative flex h-20 items-center ${
          isCollapsed ? "justify-center" : "gap-4 px-6"
        }`}
      >
        <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-skin-primary to-skin-secondary p-[1px] text-white shadow-lg shadow-skin-primary/25">
          <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-skin-surface">
            <span className="bg-gradient-to-r from-skin-primary to-skin-secondary bg-clip-text text-xl font-bold text-transparent">
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
              <h1 className="leading-none text-lg font-bold tracking-tight text-white">
                {brandLabel}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggleCollapsed}
          className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-skin-border bg-skin-surface p-1.5 text-skin-muted shadow-xl transition-all hover:bg-skin-border/20 hover:text-skin-text"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-3 w-3" />
          ) : (
            <ChevronLeftIcon className="h-3 w-3" />
          )}
        </button>
      </div>

      <nav className="custom-scrollbar mt-2 flex-1 space-y-2 overflow-y-auto px-3">
        {menuItems.map((item) => {
          const hasChildren = !!item.children;

          if (hasChildren) {
            const isExpanded = expandedMenus.includes(item.key);
            const isActiveGroup = item.children?.some(
              (child) => locationPathname === child.path,
            );

            return (
              <div key={item.key} className="space-y-1">
                <button
                  onClick={() => onToggleMenu(item.key)}
                  className={`nav-item group relative flex w-full items-center rounded-xl transition-all duration-200 ${
                    isCollapsed
                      ? "justify-center px-2 py-3"
                      : "justify-between px-3 py-3"
                  } ${
                    isActiveGroup
                      ? "bg-skin-primary/10 text-skin-primary"
                      : "text-skin-muted hover:bg-skin-text/5 hover:text-skin-text"
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
                          className="overflow-hidden whitespace-nowrap text-sm font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!isCollapsed && (
                    <ChevronRightIcon
                      className={`h-3.5 w-3.5 text-skin-muted transition-transform duration-200 ${
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
                      <div className="space-y-0.5 pb-2 pt-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block rounded-lg py-2.5 pl-11 pr-4 text-sm transition-all duration-200 ${
                              locationPathname === child.path
                                ? "bg-skin-primary/5 font-medium text-skin-primary"
                                : "text-skin-muted hover:bg-skin-text/5 hover:text-skin-text"
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
              to={item.path!}
              className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
              } ${
                locationPathname === item.path
                  ? "bg-gradient-to-r from-skin-primary to-skin-secondary text-white shadow-lg shadow-skin-primary/20"
                  : "text-skin-muted hover:bg-skin-text/5 hover:text-skin-text"
              }`}
            >
              {item.icon}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap text-sm font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-skin-border/20 p-4 backdrop-blur-md">
        <div className="space-y-1">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "gap-3 px-3"
            }`}
          >
            <ThemeToggle />
            <LanguageSelector isCollapsed={isCollapsed} />
          </div>
          <Link
            to="/settings"
            className={`flex w-full items-center rounded-xl text-skin-muted transition-all duration-200 hover:bg-skin-text/5 hover:text-skin-text ${
              isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm font-medium"
                >
                  {settingsLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={onLogout}
            className={`flex w-full items-center rounded-xl text-red-400/80 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 ${
              isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
            }`}
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm font-medium"
                >
                  {logoutLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
