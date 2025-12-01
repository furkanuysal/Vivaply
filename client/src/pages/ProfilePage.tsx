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
      <div className="flex items-center justify-center h-[50vh] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Başlık yerine Avatar Kartı */}
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-lg mb-4 text-white">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <div className="mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
              Level {user?.level}
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition">
              <div className="text-gray-400 text-sm mb-1">Cüzdan</div>
              <div className="text-2xl font-bold text-green-400">
                {user?.money}{" "}
                <span className="text-xs text-gray-500">LifeCoin</span>
              </div>
            </div>

            <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition">
              <div className="text-gray-400 text-sm mb-1">Zincir</div>
              <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                🔥 {user?.currentStreak}{" "}
                <span className="text-sm text-gray-500">Gün</span>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 bg-gray-700/30 p-5 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">XP İlerlemesi</span>
                <span className="text-blue-400 font-bold">
                  {user?.xp} / 100 XP
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(user?.xp || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                Toplam: {user?.totalXp} XP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
