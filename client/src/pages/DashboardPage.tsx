import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../features/dashboard/services/dashboardService";
import type {
  DashboardSummaryDto,
  DashboardItemDto,
} from "../features/dashboard/types";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (error) {
        console.error("Dashboard yüklenemedi", error);
        toast.error("Veriler alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading)
    return <div className="text-white text-center mt-20">Yükleniyor...</div>;
  if (!data) return null;

  const hasData =
    data.continueWatching.length > 0 ||
    data.continueReading.length > 0 ||
    data.continuePlaying.length > 0;

  return (
    <div className="space-y-10 animate-fade-in text-white pb-20">
      {/* 1. İSTATİSTİK KARTLARI (HEADER) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="İzlenen Bölüm"
          value={data.stats.totalEpisodes}
          icon="📺"
          color="text-blue-400"
        />
        <StatCard
          label="Bitirilen Film"
          value={data.stats.totalMovies}
          icon="🎬"
          color="text-green-400"
        />
        <StatCard
          label="Okunan Kitap"
          value={data.stats.totalBooks}
          icon="📚"
          color="text-yellow-400"
        />
        <StatCard
          label="Bitirilen Oyun"
          value={data.stats.totalGames}
          icon="🎮"
          color="text-purple-400"
        />
      </div>

      {!hasData && (
        <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <p className="text-gray-400 text-lg mb-4">
            Henüz aktif bir içeriğin yok. Keşfetmeye başla!
          </p>
          <div className="flex justify-center gap-4 text-sm font-bold">
            <button
              onClick={() => navigate("/entertainment")}
              className="text-blue-400 hover:underline"
            >
              Dizi/Film Ekle
            </button>
            <button
              onClick={() => navigate("/books")}
              className="text-yellow-400 hover:underline"
            >
              Kitap Ekle
            </button>
            <button
              onClick={() => navigate("/games")}
              className="text-purple-400 hover:underline"
            >
              Oyun Ekle
            </button>
          </div>
        </div>
      )}

      {/* 2. İZLEMEYE DEVAM ET (TV) */}
      {data.continueWatching.length > 0 && (
        <Section title="İzlemeye Devam Et" icon="📺">
          {data.continueWatching.map((item) => (
            <DashboardCard key={item.id} item={item} navigate={navigate} />
          ))}
        </Section>
      )}

      {/* 3. OKUMAYA DEVAM ET (BOOK) */}
      {data.continueReading.length > 0 && (
        <Section title="Okumaya Devam Et" icon="📖">
          {data.continueReading.map((item) => (
            <DashboardCard key={item.id} item={item} navigate={navigate} />
          ))}
        </Section>
      )}

      {/* 4. OYNAMAYA DEVAM ET (GAME) */}
      {data.continuePlaying.length > 0 && (
        <Section title="Oynamaya Devam Et" icon="🎮">
          {data.continuePlaying.map((item) => (
            <DashboardCard key={item.id} item={item} navigate={navigate} />
          ))}
        </Section>
      )}
    </div>
  );
}

// --- ALT BİLEŞENLER ---

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center hover:bg-gray-750 transition hover:scale-105 duration-200 shadow-lg">
      <div className="text-3xl mb-2 filter drop-shadow-md">{icon}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-200 border-b border-gray-700 pb-2">
        <span>{icon}</span> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

function DashboardCard({
  item,
  navigate,
}: {
  item: DashboardItemDto;
  navigate: any;
}) {
  // Dinamik Bilgi Metni Oluşturma (Backend'den gelen ham verileri kullanarak)
  let infoDisplay = "";

  if (item.type === "tv" && item.season && item.episode) {
    infoDisplay = `${item.season}. Sezon ${item.episode}. Bölüm`;
  } else if (item.type === "book" && item.currentValue && item.maxValue) {
    infoDisplay = `${item.currentValue} / ${item.maxValue} Sayfa`;
  } else if (item.type === "game" && item.currentValue) {
    infoDisplay = `${item.currentValue} Saat`;
  }

  return (
    <div
      onClick={() => navigate(item.routePath)}
      className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4 cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition group shadow-md"
    >
      {/* Resim */}
      <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-inner">
        <img
          src={
            item.imageUrl?.replace("http:", "https:") ||
            "https://via.placeholder.com/200x300"
          }
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          alt={item.title}
        />
      </div>

      {/* Bilgi */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <h4 className="font-bold text-gray-100 truncate mb-1 text-lg group-hover:text-blue-400 transition">
          {item.title}
        </h4>

        {/* Alt Metin (S3 E4 veya 120 Sayfa) */}
        <p className="text-sm text-gray-400 font-medium mb-3 flex items-center gap-2">
          {item.type === "tv" && <span className="text-green-500">▶</span>}
          {infoDisplay}
        </p>

        {/* Progress Bar (Kitaplar için) */}
        {item.type === "book" && item.progressPercent !== undefined && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-yellow-500 h-1.5 rounded-full"
              style={{ width: `${item.progressPercent}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
