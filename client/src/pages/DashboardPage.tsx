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
} from "@heroicons/react/24/outline";

// Components
import {
  ActionButton,
  DashboardCard,
  DashboardSection,
  StatCard,
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
        toast.error(t("common:errors.content_not_found"));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex h-[50vh] items-center justify-center text-skin-text">
        <div className="animate-pulse text-xl font-medium">
          {t("common:loading")}
        </div>
      </div>
    );
  if (!data) return null;

  const hasData =
    data.continueWatching.length > 0 ||
    data.continueReading.length > 0 ||
    data.continuePlaying.length > 0;

  return (
    <div className="animate-fade-in text-skin-text pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* HERO & STATS HEADER */}
      <div className="py-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-skin-primary to-skin-secondary bg-clip-text text-transparent">
          {t("dashboard:titles.welcome")}
        </h1>
        <p className="text-skin-muted text-lg mb-10">
          {t("dashboard:titles.welcome_subtitle")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            label={t("dashboard:stats.total_episodes")}
            value={data.stats.totalEpisodes}
            icon={<TvIcon className="w-8 h-8" />}
            color="text-skin-secondary"
            bg="bg-skin-secondary/20"
            borderColor="border-skin-secondary/50"
          />
          <StatCard
            label={t("dashboard:stats.total_movies")}
            value={data.stats.totalMovies}
            icon={<FilmIcon className="w-8 h-8" />}
            color="text-skin-primary"
            bg="bg-skin-primary/20"
            borderColor="border-skin-primary/50"
          />
          <StatCard
            label={t("dashboard:stats.total_books")}
            value={data.stats.totalBooks}
            icon={<BookOpenIcon className="w-8 h-8" />}
            color="text-skin-accent"
            bg="bg-skin-accent/20"
            borderColor="border-skin-accent/50"
          />
          <StatCard
            label={t("dashboard:stats.total_games")}
            value={data.stats.totalGames}
            icon={<PuzzlePieceIcon className="w-8 h-8" />}
            color="text-skin-rating-90"
            bg="bg-skin-rating-90/20"
            borderColor="border-skin-rating-90/50"
          />
        </div>
      </div>

      {/* EMPTY STATE */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center py-20 bg-skin-surface/30 rounded-3xl border border-dashed border-skin-border/50">
          <p className="text-skin-muted text-xl mb-6 font-medium">
            {t("dashboard:empty_state.message")}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <ActionButton
              label={t("dashboard:empty_state.add_tv_show")}
              onClick={() => navigate("/entertainment")}
              color="text-skin-secondary border-skin-secondary/30 hover:bg-skin-secondary/10"
            />
            <ActionButton
              label={t("dashboard:empty_state.add_book")}
              onClick={() => navigate("/books")}
              color="text-skin-accent border-skin-accent/30 hover:bg-skin-accent/10"
            />
            <ActionButton
              label={t("dashboard:empty_state.add_game")}
              onClick={() => navigate("/games")}
              color="text-skin-rating-90 border-skin-rating-90/30 hover:bg-skin-rating-90/10"
            />
          </div>
        </div>
      )}

      {/* CONTENT SECTIONS */}
      <div className="space-y-12">
        {data.continueWatching.length > 0 && (
          <DashboardSection
            title={t("dashboard:titles.last_watched")}
            icon={<TvIcon className="w-6 h-6" />}
          >
            {data.continueWatching.map((item) => (
              <DashboardCard
                key={item.id}
                item={item}
                navigate={navigate}
                t={t}
              />
            ))}
          </DashboardSection>
        )}

        {data.continueReading.length > 0 && (
          <DashboardSection
            title={t("dashboard:titles.last_read")}
            icon={<BookOpenIcon className="w-6 h-6" />}
          >
            {data.continueReading.map((item) => (
              <DashboardCard
                key={item.id}
                item={item}
                navigate={navigate}
                t={t}
              />
            ))}
          </DashboardSection>
        )}

        {data.continuePlaying.length > 0 && (
          <DashboardSection
            title={t("dashboard:titles.last_played")}
            icon={<PuzzlePieceIcon className="w-6 h-6" />}
          >
            {data.continuePlaying.map((item) => (
              <DashboardCard
                key={item.id}
                item={item}
                navigate={navigate}
                t={t}
              />
            ))}
          </DashboardSection>
        )}
      </div>
    </div>
  );
}
