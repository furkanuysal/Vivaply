import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { toast } from "react-toastify";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(formData);
      toast.success("Giriş başarılı! 🚀");

      // Giriş yapınca Profile sayfasına yönlendir
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error: any) {
      // Backend'den gelen hatayı (veya genel hatayı) göster
      const message = error.response?.data || "Giriş başarısız.";
      toast.error(typeof message === "string" ? message : "Bir hata oluştu.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Kullanıcı Adı veya Email
        </label>
        <input
          type="text"
          required
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          placeholder="ör: furkan"
          value={formData.identifier}
          onChange={(e) =>
            setFormData({ ...formData, identifier: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Şifre
        </label>
        <input
          type="password"
          required
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 transform hover:scale-[1.02]"
      >
        Giriş Yap
      </button>
    </form>
  );
}
