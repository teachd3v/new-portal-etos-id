"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FolderKanban, Settings, 
  ClipboardCheck, UserCircle, Calendar, Trophy 
} from 'lucide-react';

const ROLE_NAV_ITEMS = {
  admin: [
    { label: 'Beranda', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'User', href: '/admin/users', icon: Users },
    { label: 'Agenda', href: '/admin/agendas', icon: FolderKanban },
    { label: 'Setting', href: '/admin/settings', icon: Settings },
  ],
  fasil: [
    { label: 'Beranda', href: '/fasil', icon: LayoutDashboard, exact: true },
    { label: 'Presensi', href: '/fasil/presensi', icon: Users },
    { label: 'Penilaian', href: '/fasil/penilaian', icon: ClipboardCheck },
    { label: 'Profil', href: '/fasil/profil', icon: UserCircle },
  ],
  etoser: [
    { label: 'Beranda', href: '/etoser', icon: LayoutDashboard, exact: true },
    { label: 'Presensi', href: '/etoser/presensi', icon: Calendar },
    { label: 'Monitoring', href: '/etoser/monev-bulanan', icon: Trophy },
    { label: 'Profil', href: '/etoser/profil', icon: UserCircle },
  ]
};

const THEME_STYLES = {
  admin: {
    activeText: 'text-teal-600',
    activeBg: 'bg-teal-50',
    activeIndicator: 'bg-teal-600',
  },
  fasil: {
    activeText: 'text-orange-600',
    activeBg: 'bg-orange-50',
    activeIndicator: 'bg-orange-500',
  },
  etoser: {
    activeText: 'text-sky-600',
    activeBg: 'bg-sky-50',
    activeIndicator: 'bg-sky-500',
  }
};

export default function MobileBottomNav({ role = 'etoser' }) {
  const pathname = usePathname();
  const items = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.etoser;
  const theme = THEME_STYLES[role] || THEME_STYLES.etoser;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {items.map((item, index) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={index}
              href={item.href}
              scroll={false}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] transition-all relative ${
                isActive 
                  ? `${theme.activeText} font-bold` 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {/* Active Indicator Top Bar */}
              {isActive && (
                <span className={`absolute -top-1.5 w-6 h-1 rounded-full ${theme.activeIndicator}`}></span>
              )}

              {/* Icon */}
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? theme.activeBg : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Short Label */}
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
