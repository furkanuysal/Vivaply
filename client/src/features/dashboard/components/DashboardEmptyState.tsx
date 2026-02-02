import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TvIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function DashboardEmptyState() {
  const navigate = useNavigate();
  const { t } = useTranslation(["dashboard", "common"]);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="max-w-4xl w-full flex flex-col gap-10 rounded-2xl border-2 border-dashed border-skin-border/40 bg-skin-surface/30 px-6 py-12 md:px-12 md:py-16 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6 text-center mx-auto max-w-lg">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-skin-primary/10 text-skin-primary border-4 border-skin-primary/5 animate-pulse-slow">
            <SparklesIcon className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-skin-text">
              {t("dashboard:empty_state.title")}
            </h2>
            <p className="text-base text-skin-muted leading-relaxed">
              {t("dashboard:empty_state.subtitle")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="h-px flex-1 bg-skin-border/40"></div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-skin-muted/70">
            {t("dashboard:empty_state.quick_add", "Hızlı Ekle")}
          </span>
          <div className="h-px flex-1 bg-skin-border/40"></div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Movie/TV Card */}
          <div
            onClick={() => navigate("/entertainment")}
            className="group relative flex flex-col items-center gap-4 p-6 bg-skin-surface rounded-xl border border-skin-border/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-skin-primary/50 cursor-pointer hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-skin-primary group-hover:text-skin-base transition-colors duration-300">
              <TvIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-skin-text">
                {t("dashboard:empty_state.add_movie_tv")}
              </h3>
              <p className="text-sm text-skin-muted">
                {t("dashboard:empty_state.add_movie_tv_desc")}
              </p>
            </div>
          </div>

          {/* Book Card */}
          <div
            onClick={() => navigate("/knowledge")}
            className="group relative flex flex-col items-center gap-4 p-6 bg-skin-surface rounded-xl border border-skin-border/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-skin-primary/50 cursor-pointer hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-skin-primary group-hover:text-skin-base transition-colors duration-300">
              <BookOpenIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-skin-text">
                {t("dashboard:empty_state.add_book")}
              </h3>
              <p className="text-sm text-skin-muted">
                {t("dashboard:empty_state.add_book_desc")}
              </p>
            </div>
          </div>

          {/* Game Card */}
          <div
            onClick={() => navigate("/entertainment")}
            className="group relative flex flex-col items-center gap-4 p-6 bg-skin-surface rounded-xl border border-skin-border/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-skin-primary/50 cursor-pointer hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-skin-primary group-hover:text-skin-base transition-colors duration-300">
              <PuzzlePieceIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-skin-text">
                {t("dashboard:empty_state.add_game")}
              </h3>
              <p className="text-sm text-skin-muted">
                {t("dashboard:empty_state.add_game_desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/entertainment")}
            className="flex items-center gap-2 px-8 h-12 bg-skin-primary text-skin-base font-bold rounded-xl shadow-lg shadow-skin-primary/20 hover:shadow-xl hover:bg-skin-primary/90 transition-all hover:scale-105"
          >
            <span>{t("common:buttons.explore", "Keşfetmeye Başla")}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
