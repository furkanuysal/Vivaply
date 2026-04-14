import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { LanguageSelector } from "@/shared/ui";
import type { NavigationItem } from "./navigation";

interface LayoutMobileDrawerProps {
  isOpen: boolean;
  expandedMenus: string[];
  locationPathname: string;
  menuItems: NavigationItem[];
  brandLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  onClose: () => void;
  onToggleMenu: (key: string) => void;
  onLogout: () => void;
}

export default function LayoutMobileDrawer({
  isOpen,
  expandedMenus,
  locationPathname,
  menuItems,
  brandLabel,
  settingsLabel,
  logoutLabel,
  onClose,
  onToggleMenu,
  onLogout,
}: LayoutMobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-skin-border/10 bg-skin-surface shadow-2xl md:hidden"
          >
            <div className="flex h-20 items-center justify-between border-b border-skin-border/5 px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-skin-primary to-skin-secondary text-lg font-bold text-white shadow-lg shadow-skin-primary/20">
                  V
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                  {brandLabel}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-skin-muted transition-colors hover:bg-skin-text/5 hover:text-skin-text"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-2 overflow-y-auto px-4">
              {menuItems.map((item) => {
                if (item.children) {
                  const isExpanded = expandedMenus.includes(item.key);
                  const isActiveGroup = item.children.some(
                    (child) => locationPathname === child.path,
                  );

                  return (
                    <div key={item.key} className="space-y-1">
                      <button
                        onClick={() => onToggleMenu(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${
                          isActiveGroup
                            ? "bg-skin-primary/10 text-skin-primary"
                            : "text-skin-muted hover:bg-skin-text/5 hover:text-skin-text"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronRightIcon
                          className={`h-4 w-4 transition-transform ${
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
                            <div className="space-y-1 pb-2 pl-4 pt-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  onClick={onClose}
                                  className={`block rounded-lg px-4 py-2.5 text-sm transition-colors ${
                                    locationPathname === child.path
                                      ? "border-l-2 border-skin-primary bg-skin-primary/5 font-medium text-skin-primary"
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
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                      locationPathname === item.path
                        ? "bg-skin-primary text-white shadow-lg shadow-skin-primary/40"
                        : "text-skin-muted hover:bg-skin-text/5 hover:text-skin-text"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-skin-border/5 p-4">
              <LanguageSelector isCollapsed={false} />
              <Link
                to="/settings"
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-skin-muted transition-colors hover:bg-skin-text/5 hover:text-skin-text"
              >
                <Cog6ToothIcon className="h-6 w-6 shrink-0" />
                <span className="font-medium">{settingsLabel}</span>
              </Link>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-400 transition-colors hover:bg-red-500/10"
              >
                <ArrowRightStartOnRectangleIcon className="h-6 w-6 shrink-0" />
                <span className="font-medium">{logoutLabel}</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
