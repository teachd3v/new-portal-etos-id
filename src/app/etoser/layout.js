"use client";
import { useEffect, Suspense } from 'react';
import EtoserSidebar from '@/components/etoser/EtoserSidebar';
import EtoserHeader from '@/components/etoser/EtoserHeader';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { Toaster } from 'react-hot-toast';
import { useRouter, usePathname } from 'next/navigation';

export default function EtoserLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Reset content area scroll on route change cleanly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const area = document.getElementById('etoser-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 font-sans flex text-[#1E1E2D] overflow-hidden select-none">
      <Toaster position="top-right" toastOptions={{ className: 'font-sans font-medium text-sky-900 rounded-xl shadow-lg backdrop-blur-md bg-white/90 border border-sky-100' }} />
      
      {/* Decorative background blobs to enhance glassmorphism */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Sidebar */}
      <EtoserSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <Suspense fallback={<div className="h-16 md:h-24 shrink-0 bg-white/40 md:bg-white/20 backdrop-blur-md border-b border-white/30" />}>
          <EtoserHeader handleLogout={handleLogout} />
        </Suspense>
        
        <main id="etoser-content-area" key={pathname} className="flex-1 overflow-y-auto px-4 pb-24 md:px-8 md:pb-8 custom-scrollbar relative z-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="etoser" />
    </div>
  );
}


