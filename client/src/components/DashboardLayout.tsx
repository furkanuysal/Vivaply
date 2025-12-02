import { Outlet, Link, useLocation } from "react-router-dom";
import { authService } from "../features/auth/services/authService";
import {
  HomeIcon,
  FilmIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Profil",
      path: "/profile",
      icon: <HomeIcon className="w-6 h-6" />,
    },

    // ✅ DÜZELTME: App.tsx'teki rota ile aynı yaptık (/entertainment)
    // İsmini de "Keşfet" yaptık çünkü hem Dizi hem Film var.
    {
      name: "Keşfet",
      path: "/entertainment",
      icon: <FilmIcon className="w-6 h-6" />,
    },

    {
      name: "Kitaplar",
      path: "/books",
      icon: <BookOpenIcon className="w-6 h-6" />,
    },
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans">
      {/* 🟢 SIDEBAR (Masaüstü) */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-xl">
            V
          </div>
          <h1 className="text-xl font-bold tracking-wide text-gray-100">
            Vivaply
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white hover:translate-x-1"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* 🔵 CONTENT AREA */}
      <main className="flex-1 md:ml-64 bg-gray-900 min-h-screen relative">
        <header className="md:hidden p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              V
            </div>
            <span className="font-bold text-gray-100 text-lg">Vivaply</span>
          </div>
          <button onClick={handleLogout} className="text-red-400 p-2">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
