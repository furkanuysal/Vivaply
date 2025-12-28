import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages and Components
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import DashboardLayout from "./components/DashboardLayout";

// Entertainment
import EntertainmentPage from "./pages/entertainment/EntertainmentPage";
import EntertainmentDetailPage from "./pages/entertainment/EntertainmentDetailPage";
import EntertainmentLibraryPage from "./pages/entertainment/EntertainmentLibraryPage";

// Knowledge
import BookLibraryPage from "./pages/knowledge/BookLibraryPage";
import BookDetailPage from "./pages/knowledge/BookDetailPage";
import KnowledgePage from "./pages/knowledge/KnowledgePage";

// Context
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";

// Simple Loading Screen (Shown while checking token)
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-skin-base">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-skin-primary"></div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for "Token valid?" answer from Backend
  // If you don't wait, the user will see the Dashboard when they have the right permissions but are on the Landing Page (flicker).
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
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
      {/* Using DashboardLayout as a security barrier */}
      <Route
        element={
          isAuthenticated ? (
            <DashboardLayout />
          ) : (
            <Navigate to="/" replace /> // Can't access protected routes
          )
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

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
      </Route>
    </Routes>
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
