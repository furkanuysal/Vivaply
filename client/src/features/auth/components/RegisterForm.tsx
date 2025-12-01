import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.register(formData);
      toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz. 🎉');
      
      // Kayıt olduktan sonra direkt Login'e atalım
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error: any) {
      const message = error.response?.data || 'Kayıt başarısız.';
      toast.error(typeof message === 'string' ? message : 'Bir hata oluştu.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Kullanıcı Adı</label>
        <input
          type="text"
          required
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
          placeholder="kullaniciadi"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
        <input
          type="email"
          required
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
          placeholder="ornek@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Şifre</label>
        <input
          type="password"
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition transform hover:scale-[1.02]"
      >
        Kayıt Ol
      </button>
    </form>
  );
}