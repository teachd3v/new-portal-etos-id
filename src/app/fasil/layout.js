"use client";
import { useEffect, useState } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import FasilSidebar from '@/components/fasil/FasilSidebar';
import FasilHeader from '@/components/fasil/FasilHeader';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function FasilLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Reset content area scroll on route change cleanly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const area = document.getElementById('fasil-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);


  useEffect(() => {
    // Validate auth and role
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not authenticated');
        const userData = await res.json();
        
        const userRole = userData.role ? userData.role.toUpperCase() : '';
        if (!userRole.includes('FASIL')) {
          router.push('/');
        } else {
          setUser(userData);
        }
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-orange-50 via-slate-50 to-amber-50 font-sans flex text-[#1E1E2D] overflow-hidden select-none">
      <Toaster position="top-right" toastOptions={{ className: 'font-sans font-medium text-orange-900 rounded-xl shadow-lg backdrop-blur-md bg-white/90 border border-orange-100' }} />
      
      {/* Decorative background blobs to enhance glassmorphism */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Sidebar */}
      <FasilSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <FasilHeader 
          userInitial={user.name ? user.name.charAt(0).toUpperCase() : 'F'} 
          onLogout={handleLogout} 
        />
        
        <main id="fasil-content-area" key={pathname} className="flex-1 overflow-y-auto px-4 pb-24 md:px-8 md:pb-8 custom-scrollbar relative z-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="fasil" />
    </div>
  );
}


