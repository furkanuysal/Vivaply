import { useEffect, useState } from "react";
import { authService } from "../features/auth/services/authService";
import type { UserProfileDto } from "../features/auth/types";
import { toast } from "react-toastify";

export default function ProfilePage() {
  // const navigate = useNavigate(); <-- Artık buna gerek kalmadı, Layout hallediyor
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setUser(data);
      } catch (error) {
        toast.error("Oturum süresi doldu.");
        // Hata yönetimi authService içinde de yapılabilir ama burası kalsın şimdilik
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-skin-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Başlık yerine Avatar Kartı */}
      <div className="bg-skin-surface rounded-2xl shadow-xl p-8 border border-skin-border">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-skin-primary to-skin-secondary flex items-center justify-center text-4xl font-bold shadow-lg mb-4 text-white">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-skin-text">
              {user?.username}
            </h2>
            <p className="text-skin-muted">{user?.email}</p>
            <div className="mt-2 px-3 py-1 bg-skin-primary/20 text-skin-primary rounded-full text-xs font-bold border border-skin-primary/30">
              Level {user?.level}
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-skin-surface/50 p-5 rounded-xl border border-skin-border/50 hover:bg-skin-surface/70 transition">
              <div className="text-skin-muted text-sm mb-1">Cüzdan</div>
              <div className="text-2xl font-bold text-skin-secondary">
                {user?.money}{" "}
                <span className="text-xs text-skin-muted">LifeCoin</span>
              </div>
            </div>

            <div className="bg-skin-surface/50 p-5 rounded-xl border border-skin-border/50 hover:bg-skin-surface/70 transition">
              <div className="text-skin-muted text-sm mb-1">Zincir</div>
              <div className="text-2xl font-bold text-skin-primary flex items-center gap-2">
                🔥 {user?.currentStreak}{" "}
                <span className="text-sm text-skin-muted">Gün</span>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 bg-skin-surface/50 p-5 rounded-xl border border-skin-border/50 hover:bg-skin-surface/70 transition">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-skin-muted">XP İlerlemesi</span>
                <span className="text-skin-primary font-bold">
                  {user?.xp} / 100 XP
                </span>
              </div>
              <div className="w-full bg-skin-base rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-skin-primary h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(user?.xp || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-skin-muted mt-2 text-right">
                Toplam: {user?.totalXp} XP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
