// React - Routing - i18n
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Services - Types
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import type { DashboardSummaryDto } from "@/features/dashboard/types";

// UI - Utils
import { toast } from "react-toastify";
import {
  TvIcon,
  FilmIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

// Components
import {
  DashboardCard,
  DashboardListCard,
  StatCard,
  DashboardEmptyState,
} from "@/features/dashboard/components";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["dashboard", "common"]);
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (error) {
        console.error("Dashboard couldn't be loaded", error);
        toast.error(t("common:messages.content_not_found"));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text animate-pulse">
        {t("common:loading")}
      </div>
    );
  if (!data) return null;

  // Check if there is any data
  const hasAnyData =
    data.continueWatching.length > 0 ||
    data.continueReading.length > 0 ||
    data.continuePlaying.length > 0;

  return (
    <div className="animate-fade-in text-skin-text pb-20 max-w-7xl mx-auto px-6 lg:px-8 pt-8 space-y-10">
      {/* Header & Stats */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-skin-text">
          {t("dashboard:titles.welcome")}
        </h1>
        <p className="text-skin-muted text-lg">
          {t("dashboard:titles.welcome_subtitle")}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={t("dashboard:stats.total_episodes")}
          value={data.stats.totalEpisodes}
          icon={<TvIcon />}
        />
        <StatCard
          label={t("dashboard:stats.total_movies")}
          value={data.stats.totalMovies}
          icon={<FilmIcon />}
        />
        <StatCard
          label={t("dashboard:stats.total_books")}
          value={data.stats.totalBooks}
          icon={<BookOpenIcon />}
        />
        <StatCard
          label={t("dashboard:stats.total_games")}
          value={data.stats.totalGames}
          icon={<PuzzlePieceIcon />}
        />
      </div>

      {/* --- Main Content --- */}

      {!hasAnyData ? (
        <DashboardEmptyState />
      ) : (
        <>
          {/* Recently Watched */}
          {data.continueWatching.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-2xl font-bold tracking-tight text-skin-text">
                  {t("dashboard:titles.last_watched")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.continueWatching.map((item) => (
                  <DashboardCard
                    key={item.id}
                    item={item}
                    navigate={navigate}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM SPLIT SECTION (Books & Games) - List Style Applied */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reading List */}
            <div className="bg-skin-surface p-6 rounded-2xl border border-skin-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-skin-text">
                  {t("dashboard:titles.last_read")}
                </h3>
                <button
                  onClick={() => navigate("/knowledge")}
                  className="text-skin-primary hover:bg-skin-primary/10 p-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {data.continueReading.length > 0 ? (
                  data.continueReading.map((item) => (
                    <DashboardListCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                      t={t}
                    />
                  ))
                ) : (
                  <p className="text-skin-muted text-sm">
                    {t("dashboard:empty_state.no_books_yet")}
                  </p>
                )}
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-skin-surface p-6 rounded-2xl border border-skin-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-skin-text">
                  {t("dashboard:titles.last_played")}
                </h3>
                <button
                  onClick={() => navigate("/entertainment/library")}
                  className="text-skin-primary hover:bg-skin-primary/10 p-2 rounded-lg transition-colors"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {data.continuePlaying.length > 0 ? (
                  data.continuePlaying.map((item) => (
                    <DashboardListCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                      t={t}
                    />
                  ))
                ) : (
                  <p className="text-skin-muted text-sm">
                    {t("dashboard:empty_state.no_games_yet")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
