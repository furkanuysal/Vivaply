import {
  BrowserRouter,
  Navigate,
  type Location,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages and Components
import { LandingPage } from "@/app/pages";
import { ProfilePage, SettingsPage } from "@/features/account/pages";
import { DashboardPage } from "@/features/dashboard/pages";
import PostModal from "@/features/feed/components/PostModal";
import { BookmarksPage, FeedPage, PostPage } from "@/features/feed";
import { SearchPage } from "@/features/search";
import MainLayout from "@/app/layouts/MainLayout";

// Entertainment
import {
  EntertainmentDetailPage,
  EntertainmentLibraryPage,
  EntertainmentPage,
} from "@/features/entertainment/pages";

// Knowledge
import {
  BookLibraryPage,
  BookDetailPage,
  KnowledgePage,
} from "@/features/knowledge/pages";

// Context
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";

// Simple Loading Screen (Shown while checking token)
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-skin-base">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  // Wait for "Token valid?" answer from Backend
  // If you don't wait, the user will see the Dashboard when they have the right permissions but are on the Landing Page (flicker).
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes location={backgroundLocation || location}>
        {/* Public Routes (Only for non-logged in users) */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace /> // Can't access public routes
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Protected Routes (Only for logged in users) */}
        {/* Using MainLayout as a security barrier */}
        <Route
          element={
            isAuthenticated ? (
              <MainLayout />
            ) : (
              <Navigate to="/" replace /> // Can't access protected routes
            )
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/feed/:postId" element={<PostPage />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/:username" element={<ProfilePage />} />

          {/* Entertainment */}
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route
            path="/entertainment/:type/:id"
            element={<EntertainmentDetailPage />}
          />
          <Route
            path="/entertainment/library"
            element={<EntertainmentLibraryPage />}
          />

          {/* Knowledge */}
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/library/book" element={<BookLibraryPage />} />
          <Route path="/knowledge/book/:id" element={<BookDetailPage />} />
          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route path="/feed/:postId" element={<PostModal />} />
          <Route path="/post/:postId" element={<PostModal />} />
        </Routes>
      ) : null}
    </>
  );
}

// Main App Component (Provider Wrapper)
function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || "en";
  }, [i18n.resolvedLanguage]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" theme="dark" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
