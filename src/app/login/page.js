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
        const userRole = data.role ? data.role.toUpperCase() : '';
        if (userRole === 'ADMIN') {
          router.push('/admin');
        } else if (userRole.includes('FASIL')) {
          router.push('/fasil');
        } else {
          router.push('/etoser');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md mx-auto z-10 p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/60 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-teal-900/5 mx-auto mb-6 border border-white/80 p-3">
            <img 
              src="/favicon.png" 
              alt="Logo Etos ID" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>
          <h1 className="text-3xl font-black text-teal-950 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-teal-800/70 font-medium">Masuk ke Portal Etos ID</p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] p-8 border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 text-sm font-semibold text-center animate-in shake">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-teal-900 mb-2 ml-1">User ID</label>
              <div className="relative">
                <User className="w-5 h-5 text-teal-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  required
                  placeholder="PM-001" 
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 placeholder-teal-800/40 shadow-inner transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-teal-900 mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-teal-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-3.5 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 placeholder-teal-800/40 shadow-inner transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600/50 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
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
        
        <p className="text-center text-teal-800/50 text-sm font-medium mt-8">
          © {new Date().getFullYear()} Dompet Dhuafa Pendidikan
        </p>
      </div>
    </div>
  );
}
