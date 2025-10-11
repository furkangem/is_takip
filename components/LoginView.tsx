import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Logo from './Logo';

// Props arayüzü, App.tsx'den gelen onLogin fonksiyonunun tipini belirtir.
interface LoginViewProps {
  onLogin: (loginRequest: { kullaniciAdi: string, sifre: string }) => Promise<true | string>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  // State'ler form alanlarını, hata mesajını ve yüklenme durumunu yönetir.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Form gönderildiğinde çalışacak asenkron fonksiyon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Yüklenmeyi başlat

    try {
      // App.tsx'den gelen ve API'ye istek atan onLogin fonksiyonunu çağır
      const result = await onLogin({ kullaniciAdi: email, sifre: password });

      if (result !== true) {
        // Eğer sonuç 'true' değilse, bu bir hata mesajıdır ve ekranda gösterilir.
        setError(result || 'Bilinmeyen bir hata oluştu.');
      }
      // Başarılıysa App.tsx zaten yönlendirmeyi yapacak.

    } catch (err: any) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        setIsLoading(false); // İşlem bitince (başarılı veya hatalı) yüklenmeyi durdur
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
                <label htmlFor="email-address" className="sr-only">Kullanıcı Adı</label>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Kullanıcı Adı"
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

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Beni Hatırla
              </label>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading} // Yüklenirken butonu devre dışı bırak
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300"
              >
                {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;