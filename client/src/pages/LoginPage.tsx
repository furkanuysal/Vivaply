import LoginForm from '../features/auth/components/LoginForm';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-500">
          Vivaply <span className="text-white">Giriş</span>
        </h2>
        
        {/* Tüm form mantığı burada */}
        <LoginForm />

        <p className="mt-6 text-center text-gray-400 text-sm">
          Hesabın yok mu?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}