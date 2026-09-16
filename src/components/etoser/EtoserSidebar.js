"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, FileText, UserCircle, LogOut } from 'lucide-react';

export default function EtoserSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/etoser" },
    { icon: CalendarCheck, label: "Presensi", href: "/etoser/presensi" },
    { icon: FileText, label: "Monitoring & Penilaian", href: "/etoser/monev-bulanan", isActive: (p) => p.startsWith('/etoser/penilaian-mandiri') || p.startsWith('/etoser/monev-bulanan') },

    { icon: UserCircle, label: "Profil & Portofolio", href: "/etoser/profil" },
  ];

  return (
    <div className="hidden md:flex w-24 h-screen flex-col py-8 shrink-0 z-20 drop-shadow-[10px_0_15px_rgba(14,165,233,0.2)] relative">
      
      {/* Top Organic S-Curve */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-24 h-24 text-sky-600 fill-current shrink-0 -mb-[1px]">
        <path d="M0,0 C0,50 100,50 100,100 L0,100 Z" />
      </svg>

      {/* Main Body */}
      <aside className="flex-1 w-24 bg-sky-600 text-white flex flex-col items-center justify-center relative z-10">
        
        <nav className="flex flex-col gap-6 items-center w-full">
          {navItems.map((item, index) => {
            const isActive = item.isActive ? item.isActive(pathname) : pathname === item.href;
            return (
              <Link 
                key={index} 
                href={item.href}
                scroll={false}
                title={item.label}

                className={`flex items-center justify-center w-14 h-14 rounded-[1.25rem] transition-all duration-300 ${
                  isActive 
                  ? 'bg-white/90 backdrop-blur-md text-sky-600 shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-110' 
                  : 'text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
                }`}
              >
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </Link>

            );
          })}
        </nav>

      </aside>

      {/* Bottom Organic S-Curve */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-24 h-24 text-sky-600 fill-current shrink-0 scale-y-[-1] -mt-[1px]">
        <path d="M0,0 C0,50 100,50 100,100 L0,100 Z" />
      </svg>

    </div>
  );
}
