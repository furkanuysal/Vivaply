import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/shared/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import LayoutDesktopSidebar from "./LayoutDesktopSidebar";
import LayoutMobileDrawer from "./LayoutMobileDrawer";
import { getMainNavigation } from "./navigation";

export default function MainLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t } = useTranslation("layout");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "entertainment",
    "knowledge",
  ]);
  const [isMobile, setIsMobile] = useState(false);

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
          : [...prev, key],
      );
    }
  };

  const menuItems = getMainNavigation(user, t);

  const mainVariants = {
    expanded: { marginLeft: 280 },
    collapsed: { marginLeft: 88 },
    mobile: { marginLeft: 0 },
  };

  return (
    <div className="flex min-h-screen bg-skin-surface font-sans text-skin-text selection:bg-skin-primary/30">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-skin-primary/10 blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-skin-secondary/10 blur-[128px]" />
      </div>

      <LayoutDesktopSidebar
        isCollapsed={isCollapsed}
        expandedMenus={expandedMenus}
        locationPathname={location.pathname}
        menuItems={menuItems}
        brandLabel={t("brand")}
        settingsLabel={t("buttons.settings") || "Settings"}
        logoutLabel={t("buttons.logout")}
        onToggleCollapsed={() => setIsCollapsed((prev) => !prev)}
        onToggleMenu={toggleMenu}
        onLogout={logout}
      />

      <motion.main
        animate={isMobile ? "mobile" : isCollapsed ? "collapsed" : "expanded"}
        variants={mainVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 min-h-screen min-w-0 flex-1 bg-skin-base"
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-skin-border/20 bg-skin-surface/80 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="-ml-2 rounded-lg p-2 text-skin-muted hover:text-skin-text active:bg-skin-text/5"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <span className="bg-gradient-to-r from-skin-primary to-skin-secondary bg-clip-text text-lg font-bold text-transparent">
              {t("brand")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <LayoutMobileDrawer
          isOpen={isMobileMenuOpen}
          expandedMenus={expandedMenus}
          locationPathname={location.pathname}
          menuItems={menuItems}
          brandLabel={t("brand")}
          settingsLabel={t("buttons.settings") || "Settings"}
          logoutLabel={t("buttons.logout")}
          onClose={() => setIsMobileMenuOpen(false)}
          onToggleMenu={toggleMenu}
          onLogout={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
        />

        <div className="relative mx-auto max-w-7xl p-4 md:p-8">
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
