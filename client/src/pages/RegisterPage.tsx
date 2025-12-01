import { Link } from 'react-router-dom';
import RegisterForm from '../features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        
        <h2 className="text-3xl font-bold text-center mb-6 text-green-500">
          Vivaply <span className="text-white">Kayıt</span>
        </h2>
        
        <RegisterForm />

        <p className="mt-6 text-center text-gray-400 text-sm">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}