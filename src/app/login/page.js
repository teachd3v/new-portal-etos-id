"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectTarget = params?.get('redirect');
        if (redirectTarget && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//') && redirectTarget !== '/login') {
          router.replace(redirectTarget);
          return;
        }

        const userRole = data.role ? data.role.toUpperCase() : '';
        if (userRole === 'ADMIN') {
          router.replace('/admin');
        } else if (userRole.includes('FASIL')) {
          router.replace('/fasil');
        } else {
          router.replace('/etoser');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Koneksi bermasalah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 overflow-y-auto native-scroll font-sans">
      {/* Decorative background blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="min-h-full w-full flex flex-col justify-center px-5 pt-[max(env(safe-area-inset-top,0px),1.5rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1.5rem),2rem)] relative z-10">
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="text-center mb-8 sm:mb-10 select-none">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-teal-900/10 mx-auto mb-5 border border-white p-3">
              <img
                src="/icons/icon-192x192.png"
                alt="Logo Etos ID"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-teal-950 tracking-tight mb-1.5">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-teal-800/70 font-medium">
              Masuk ke Portal Etos ID
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-2xl rounded-[2.25rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] p-6 sm:p-8 border border-white/70">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 text-sm font-semibold text-center animate-in shake">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-2 ml-1 select-none">
                  User ID
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-teal-600/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                    placeholder="Contoh: E2026001"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/70 rounded-2xl text-base md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950 placeholder-teal-800/40 shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-2 ml-1 select-none">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-teal-600/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/70 backdrop-blur-md border border-white/70 rounded-2xl text-base md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950 placeholder-teal-800/40 shadow-inner transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-teal-600/60 hover:text-teal-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer select-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-teal-800/50 text-xs sm:text-sm font-medium mt-7 select-none">
            © {new Date().getFullYear()} TEACH GREAT Edunesia
          </p>
        </div>
      </div>
    </div>
  );
}
