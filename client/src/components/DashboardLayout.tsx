import { Outlet, Link, useLocation } from "react-router-dom";
import { authService } from "../features/auth/services/authService";
import {
  HomeIcon,
  FilmIcon,
  BookOpenIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Ana Sayfa",
      path: "/profile",
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      name: "Diziler",
      path: "/movies",
      icon: <FilmIcon className="w-6 h-6" />,
    }, // Yakında
    {
      name: "Kitaplar",
      path: "/books",
      icon: <BookOpenIcon className="w-6 h-6" />,
    }, // Yakında
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* 🟢 SIDEBAR (Sol Menü) */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-500 tracking-wider">
            Vivaply
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* 🔵 CONTENT AREA (Orta Alan) */}
      <main className="flex-1 overflow-y-auto h-screen">
        {/* Mobil Header (İleride buraya hamburger menü gelir) */}
        <header className="md:hidden p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <span className="font-bold text-blue-500">Vivaply</span>
          <button onClick={handleLogout} className="text-red-400">
            Çıkış
          </button>
        </header>

        {/* Sayfaların değiştiği yer burası */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
