"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Reset content area scroll on route change cleanly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const area = document.getElementById('admin-content-area');
    if (area) {
      area.scrollTop = 0;
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

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Manajemen User", href: "/admin/users" },
    { icon: FolderKanban, label: "Manajemen Agenda", href: "/admin/agendas" },
    { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
  ];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 font-sans flex text-[#1E1E2D] overflow-hidden select-none">
      <Toaster position="top-right" toastOptions={{ className: 'font-sans font-medium text-teal-900 rounded-xl shadow-lg backdrop-blur-md bg-white/90 border border-teal-100' }} />

      {/* Decorative background blobs to enhance glassmorphism */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Sidebar Container with drop-shadow for seamless shadow across SVG and div */}
      <div className="hidden md:flex w-24 h-screen flex-col py-8 shrink-0 z-20 drop-shadow-[10px_0_15px_rgba(15,118,110,0.2)] relative">
        
        {/* Top Organic S-Curve */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-24 h-24 text-[#0F766E] fill-current shrink-0 -mb-[1px]">
          <path d="M0,0 C0,50 100,50 100,100 L0,100 Z" />
        </svg>

        {/* Main Body */}
        <aside className="flex-1 w-24 bg-[#0F766E] text-white flex flex-col items-center justify-center relative z-10">
          
          <nav className="flex flex-col gap-6 items-center w-full">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={index} 
                  href={item.href}
                  scroll={false}
                  title={item.label}
                  className={`flex items-center justify-center w-14 h-14 rounded-[1.25rem] transition-all duration-300 ${
                    isActive 
                    ? 'bg-white/90 backdrop-blur-md text-[#0F766E] shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-110' 
                    : 'text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
                  }`}
                >
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              )
            })}
          </nav>

        </aside>

        {/* Bottom Organic S-Curve */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-24 h-24 text-[#0F766E] fill-current shrink-0 scale-y-[-1] -mt-[1px]">
          <path d="M0,0 C0,50 100,50 100,100 L0,100 Z" />
        </svg>

      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative">
        <AdminHeader handleLogout={handleLogout} />

        {/* Page Content Scrollable */}
        <div id="admin-content-area" key={pathname} className="flex-1 overflow-y-auto px-4 pb-24 md:px-8 md:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="admin" />
    </div>
  );
}

