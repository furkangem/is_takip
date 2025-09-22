import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError('Geçersiz e-posta veya şifre.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800 rounded-t-lg p-4">
          <Logo />
        </div>
        <div className="p-8 space-y-8 bg-white rounded-b-2xl shadow-lg">
          <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz</h1>
              <p className="mt-2 text-sm text-gray-600">Personel Takip Sistemine giriş yapın</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">E-posta Adresi</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="E-posta adresi"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Şifre</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Şifre"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Giriş Yap
              </button>
            </div>
          </form>
           <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p className="font-semibold">Test Bilgileri:</p>
              <p>Admin: admin@example.com / password123</p>
              <p>Ustabaşı: mehmet@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;