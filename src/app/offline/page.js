"use client";
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-teal-100 rounded-[2rem] p-8 shadow-xl shadow-teal-900/5">
        <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-md mx-auto mb-5 p-3 flex items-center justify-center">
          <img
            src="/icons/icon-192x192.png"
            alt="Portal Etos ID"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-4">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline</span>
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Koneksi Internet Terputus
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          Pastikan Wi-Fi atau data seluler HP kamu aktif untuk memuat data terbaru dari Portal Etos ID.
        </p>

        <button
          onClick={handleRetry}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#0F766E] hover:bg-teal-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-teal-700/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    </div>
  );
}
