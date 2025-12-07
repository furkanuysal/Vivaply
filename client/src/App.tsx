import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
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

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        {/* Public Routes (Layoutsuz) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes (Sidebarlı Layout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
          {/* İleride buraya /movies, /books gelecek */}
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
