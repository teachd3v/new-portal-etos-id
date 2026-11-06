"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function resolveThemeColor(pathname) {
  if (!pathname) return '#F0FDFA';
  if (pathname.startsWith('/fasil')) return '#FFF7ED';
  if (pathname.startsWith('/etoser')) return '#F0F9FF';
  return '#F0FDFA';
}

export default function PwaRegister() {
  const pathname = usePathname();

  // Dynamically sync mobile browser / standalone status-bar color per role theme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const color = resolveThemeColor(pathname);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Capture beforeinstallprompt globally as early as possible so no component misses it
    const captureInstallPrompt = (e) => {
      e.preventDefault();
      window.__etosDeferredPrompt = e;
      window.dispatchEvent(new Event('etos-pwa-installable'));
    };

    const handleAppInstalled = () => {
      window.__etosDeferredPrompt = null;
      window.dispatchEvent(new Event('etos-pwa-installed'));
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 2. Register Service Worker immediately (avoid missing window 'load' after React hydration)
    const registerSw = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          };
        };
      } catch (error) {
        console.error('PWA Service Worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerSw();
    } else {
      window.addEventListener('load', registerSw, { once: true });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
