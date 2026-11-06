"use client";
import { Bell, LogOut, Search, Loader2, Link as LinkIcon, Calendar, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MobileHeaderTools from '@/components/navigation/MobileHeaderTools';

function getMenuSubtitle(pathname) {
  if (pathname?.startsWith('/etoser/presensi')) return 'Presensi & Agenda';
  if (pathname?.startsWith('/etoser/monev-bulanan')) return 'Monitoring Bulanan';
  if (pathname?.startsWith('/etoser/penilaian-mandiri')) return 'Asesmen RELI';
  return 'Beranda Etoser';
}

export default function EtoserHeader({ handleLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'profil';

  const [userName, setUserName] = useState('Etoser');
  const [userId, setUserId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.name) setUserName(data.name);
          if (data.id) setUserId(data.id);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
    window.addEventListener('etoser-profile-updated', fetchUser);
    return () => window.removeEventListener('etoser-profile-updated', fetchUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/etoser/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const initial = userName.charAt(0).toUpperCase() || 'E';
  const isProfil = pathname === '/etoser/profil';
  const activeClass = 'text-[#1E1E2D] border-b-2 border-[#1E1E2D] pb-1';
  const inactiveClass = 'hover:text-[#1E1E2D] transition-colors';
  const menuSubtitle = getMenuSubtitle(pathname);

  return (
    <header className="pt-[env(safe-area-inset-top,0px)] min-h-[calc(4rem+env(safe-area-inset-top,0px))] md:min-h-[6rem] px-4 md:px-8 flex items-center justify-between gap-2 shrink-0 bg-white/40 md:bg-white/20 backdrop-blur-md border-b border-white/30 sticky top-0 z-30 transition-all select-none">
      {/* Left Area: Etoser Name on Beranda/Presensi/Monitoring/RELI, or Sub-Tab Switcher on Profil */}
      {isProfil ? (
        <>
          <div className="md:hidden">
            <div className="relative">
              <select
                value={`/etoser/profil?tab=${tab}`}
                onChange={(e) => router.push(e.target.value)}
                className="header-pill-select bg-white/90 backdrop-blur-md border border-sky-200/90 text-sky-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer max-w-[165px] sm:max-w-[210px] truncate"
              >
                <option value="/etoser/profil?tab=profil">Profil Saya</option>
                <option value="/etoser/profil?tab=portofolio">Portofolio Karya</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-sky-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-[#8B92A5]">
            <Link
              href="/etoser/profil?tab=profil"
              scroll={false}
              className={tab === 'profil' ? activeClass : inactiveClass}
            >
              Profil Saya
            </Link>
            <Link
              href="/etoser/profil?tab=portofolio"
              scroll={false}
              className={tab === 'portofolio' ? activeClass : inactiveClass}
            >
              Portofolio Karya
            </Link>
          </div>
        </>
      ) : (
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-wider text-sky-600 leading-none mb-0.5 truncate">
            {menuSubtitle}
          </span>
          <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 truncate max-w-[165px] sm:max-w-[240px] md:max-w-md leading-tight">
            {userName}
          </span>
        </div>
      )}

      <div className="flex items-center gap-6 shrink-0">
        {/* Desktop Searchbox Command Palette */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 text-sky-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowPalette(true)}
            placeholder="Search or type command"
            className="pl-12 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium focus:ring-2 focus:ring-sky-500/30 w-72 shadow-[0_4px_15px_rgba(0,0,0,0.03)] focus:outline-none transition-all placeholder-sky-800/40 text-sky-900"
          />

          {showPalette && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              {isSearching ? (
                <div className="flex items-center justify-center p-6 text-sky-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-center text-sky-800/60">Tidak ada hasil ditemukan</div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowPalette(false);
                        setSearchQuery('');
                        router.push(res.url);
                      }}
                      className="w-full flex flex-col items-start px-4 py-3 hover:bg-sky-50/80 rounded-xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {res.type === 'Menu' ? (
                          <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        )}
                        <span className="font-bold text-sm text-sky-950">{res.title}</span>
                      </div>
                      <span className="text-xs text-sky-700/70 mt-0.5 ml-5">{res.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-4 border-l border-sky-200/50 pl-2.5 md:pl-6 ml-0.5 md:ml-2">
          <MobileHeaderTools role="etoser" searchEndpoint="/api/etoser/search" />
          <button className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-sky-700 hover:bg-white hover:text-sky-600 shadow-sm transition-all relative">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              type="button"
              onClick={() => router.push('/etoser/profil')}
              title={userId ? `${userName} (${userId})` : userName}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-400 border-2 border-white/80 shadow-md overflow-hidden flex justify-center items-center text-white font-bold text-xs md:text-sm cursor-pointer hover:scale-105 transition-transform"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-red-400 hover:bg-white hover:text-red-600 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
