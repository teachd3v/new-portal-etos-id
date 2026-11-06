"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share, PlusSquare, MoreVertical } from 'lucide-react';

export function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean(window.navigator.standalone) ||
    document.referrer.includes('android-app://')
  );
}

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platformMode, setPlatformMode] = useState('chromium'); // 'chromium' | 'ios-safari' | 'ios-other' | 'android-manual'

  const hasBottomNav =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/fasil') ||
    pathname?.startsWith('/etoser');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isRunningStandalone()) {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isIosChromeOrEdge = isIosDevice && /crios|edgios|fxios/.test(ua);
    const isIosSafari = isIosDevice && !isIosChromeOrEdge && /safari/.test(ua);

    if (isIosSafari) {
      setPlatformMode('ios-safari');
    } else if (isIosDevice) {
      setPlatformMode('ios-other');
    } else if (window.__etosDeferredPrompt) {
      setDeferredPrompt(window.__etosDeferredPrompt);
      setPlatformMode('chromium');
    } else if (isAndroid) {
      setPlatformMode('android-manual');
    }

    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    const recentlyDismissed =
      dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24) < 3;

    let autoShowTimer = null;

    if (!recentlyDismissed) {
      if (isIosDevice) {
        autoShowTimer = setTimeout(() => setShowPrompt(true), 2500);
      } else if (window.__etosDeferredPrompt) {
        setDeferredPrompt(window.__etosDeferredPrompt);
        setPlatformMode('chromium');
        autoShowTimer = setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    const onInstallable = () => {
      if (isRunningStandalone()) return;
      if (window.__etosDeferredPrompt) {
        setDeferredPrompt(window.__etosDeferredPrompt);
        setPlatformMode('chromium');
        const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
        const skipAuto =
          lastDismissed && (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24) < 3;
        if (!skipAuto) {
          setShowPrompt(true);
        }
      }
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    const onManualOpen = async () => {
      if (isRunningStandalone()) return;
      if (window.__etosDeferredPrompt) {
        try {
          window.__etosDeferredPrompt.prompt();
          const { outcome } = await window.__etosDeferredPrompt.userChoice;
          if (outcome === 'accepted') {
            window.__etosDeferredPrompt = null;
            setDeferredPrompt(null);
            setShowPrompt(false);
          }
          return;
        } catch (err) {
          console.error('Install prompt error:', err);
        }
      }
      setShowPrompt(true);
    };

    window.addEventListener('etos-pwa-installable', onInstallable);
    window.addEventListener('etos-pwa-installed', onInstalled);
    window.addEventListener('etos-open-install-prompt', onManualOpen);

    return () => {
      if (autoShowTimer) clearTimeout(autoShowTimer);
      window.removeEventListener('etos-pwa-installable', onInstallable);
      window.removeEventListener('etos-pwa-installed', onInstalled);
      window.removeEventListener('etos-open-install-prompt', onManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__etosDeferredPrompt : null);
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      if (typeof window !== 'undefined') {
        window.__etosDeferredPrompt = null;
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div
      className={`fixed left-3 right-3 md:left-auto md:right-8 md:w-[25rem] z-[60] animate-in fade-in slide-in-from-bottom-5 duration-400 select-none ${
        hasBottomNav
          ? 'bottom-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),0.5rem))] md:bottom-6'
          : 'bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] md:bottom-6'
      }`}
    >
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 text-white rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 p-1.5 shadow-md overflow-hidden">
            <img
              src="/icons/icon-192x192.png"
              alt="Portal Etos ID"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <h4 className="font-extrabold text-sm text-white leading-tight">
              Pasang Aplikasi Etos Portal
            </h4>

            {platformMode === 'ios-safari' ? (
              <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                <p>
                  1. Ketuk tombol <span className="inline-flex items-center gap-0.5 font-bold text-sky-400"><Share className="w-3.5 h-3.5 inline" /> Bagikan</span> di bar bawah Safari.
                </p>
                <p>
                  2. Pilih <span className="inline-flex items-center gap-1 font-bold text-white"><PlusSquare className="w-3.5 h-3.5 inline text-teal-400" /> Tambah ke Layar Utama</span>.
                </p>
              </div>
            ) : platformMode === 'ios-other' ? (
              <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                <p>
                  1. Ketuk ikon <span className="inline-flex items-center gap-0.5 font-bold text-sky-400"><Share className="w-3.5 h-3.5 inline" /> Bagikan</span> di kanan atas kolom alamat.
                </p>
                <p>
                  2. Ketuk <span className="inline-flex items-center gap-1 font-bold text-white"><PlusSquare className="w-3.5 h-3.5 inline text-teal-400" /> Tambah ke Layar Utama</span>.
                </p>
              </div>
            ) : platformMode === 'android-manual' && !deferredPrompt ? (
              <p className="text-xs text-slate-300 leading-relaxed">
                Ketuk menu <MoreVertical className="w-3.5 h-3.5 inline text-teal-400" /> di pojok kanan atas Chrome lalu pilih <span className="font-bold text-white">&quot;Instal aplikasi&quot;</span> atau <span className="font-bold text-white">&quot;Tambahkan ke layar utama&quot;</span>.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Akses penuh layar seperti aplikasi native langsung dari layar utama HP kamu.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="mt-1.5 inline-flex items-center gap-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instal Sekarang</span>
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Tutup panduan instalasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
