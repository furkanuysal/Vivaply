import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardLayout from "./components/DashboardLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EntertainmentPage from "./pages/EntertainmentPage";
import EntertainmentDetailPage from "./pages/EntertainmentDetailPage";
import EntertainmentLibraryPage from "./pages/EntertainmentLibraryPage";
import BookLibraryPage from "./pages/BookLibraryPage";
import BookDetailPage from "./pages/BookDetailPage";
import KnowledgePage from "./pages/KnowledgePage";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || "en";
  }, [i18n.resolvedLanguage]);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        {/* Public Routes (No layout) */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes (Sidebar layout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route
            path="/entertainment/:type/:id"
            element={<EntertainmentDetailPage />}
          />
          <Route
            path="/entertainment/library"
            element={<EntertainmentLibraryPage />}
          />
          <Route path="/knowledge/books" element={<KnowledgePage />} />
          <Route
            path="/knowledge/books/library"
            element={<BookLibraryPage />}
          />
          <Route path="/knowledge/books/:id" element={<BookDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
