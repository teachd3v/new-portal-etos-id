"use client";
import { useState, useEffect } from 'react';
import { Download, X, Share2, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Do not show if already in PWA app
    }

    // 2. Check if user already dismissed recently
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) return; // Wait 3 days before showing again
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('crios');
    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Small delay for smooth entry
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white rounded-3xl p-5 shadow-2xl flex items-start justify-between gap-4">
        
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              Install Portal Etos ID
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isIos ? (
                <>
                  Buka menu <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> lalu ketuk <span className="font-bold text-white">"Tambah ke Layar Utama"</span> untuk pengalaman native.
                </>
              ) : (
                "Akses portal lebih cepat dan praktis langsung dari layar utama HP kamu."
              )}
            </p>

            {!isIos && (
              <button
                onClick={handleInstallClick}
                className="mt-2 inline-flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Pasang Sekarang
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={handleDismiss} 
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
