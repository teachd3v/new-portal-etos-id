"use client";
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Search, Bell, LogOut, Loader2, Link as LinkIcon, User, Calendar, ChevronDown, ArrowLeft } from 'lucide-react';
import { Suspense, useState, useEffect, useRef } from 'react';

function HeaderContent({ handleLogout }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || (pathname.startsWith('/admin/settings') ? 'system' : pathname.startsWith('/admin/agendas') ? 'agenda' : 'etoser');
  const role = searchParams.get('role') || 'All Roles';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const searchRef = useRef(null);

  const isSettings = pathname.startsWith('/admin/settings');
  const isUsers = pathname.startsWith('/admin/users');
  const isAgendas = pathname.startsWith('/admin/agendas');
  const isDetailPage = pathname.startsWith('/admin/etoser/') || pathname.startsWith('/admin/fasil/') || pathname === '/admin/dashboard/sanksi';

  const activeClass = "text-[#1E1E2D] border-b-2 border-[#1E1E2D] pb-1";
  const inactiveClass = "hover:text-[#1E1E2D] transition-colors";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
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

  return (
    <header className="h-16 md:h-24 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/40 md:bg-white/20 backdrop-blur-md border-b border-white/30 sticky top-0 z-30 transition-all">
      {/* Back Button for Detail Pages */}
      {isDetailPage ? (
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 bg-white/80 hover:bg-white border border-teal-200/90 rounded-full shadow-sm text-teal-950 font-bold text-xs md:text-sm transition-all active:scale-95 cursor-pointer hover:border-teal-400"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-700" />
            <span>Kembali</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Navigation Dropdown (< md) */}
          <div className="md:hidden">
            {pathname === '/admin' ? (
              <div className="relative">
                <select
                  value={`/admin?tab=${tab}`}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-teal-200/90 text-teal-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/admin?tab=etoser">RELI Etoser</option>
                  <option value="/admin?tab=etoser-bulanan">Monitoring Etoser</option>
                  <option value="/admin?tab=fasil-bulanan">Monitoring Fasil</option>
                  <option value="/admin?tab=fasil">Leaderboard Fasil</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : isSettings ? (
              <div className="relative">
                <select
                  value={`/admin/settings?tab=${tab}`}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-teal-200/90 text-teal-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/admin/settings?tab=system">Sistem & Periode</option>
                  <option value="/admin/settings?tab=reli">Instrumen RELI</option>
                  <option value="/admin/settings?tab=fasil">Instrumen Fasil</option>
                  <option value="/admin/settings?tab=etoser">Instrumen Etoser</option>
                  <option value="/admin/settings?tab=sanksi">Katalog Sanksi</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : isAgendas ? (
              <div className="relative">
                <select
                  value={`/admin/agendas?tab=${tab}`}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-teal-200/90 text-teal-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/admin/agendas?tab=agenda">Daftar Agenda</option>
                  <option value="/admin/agendas?tab=presensi">Presensi Kehadiran</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : isUsers ? (
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    const params = new URLSearchParams(searchParams.toString());
                    if (selectedRole === 'All Roles' || !selectedRole) {
                      params.delete('role');
                    } else {
                      params.set('role', selectedRole);
                    }
                    params.set('page', '1');
                    const qs = params.toString();
                    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
                  }}
                  className="bg-white/90 backdrop-blur-md border border-teal-200/90 text-teal-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="All Roles">Semua Role</option>
                  <option value="Etoser">Etoser</option>
                  <option value="Fasilitator">Fasilitator</option>
                  <option value="Admin">Admin</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : null}
          </div>

          {/* Desktop Navigation Tabs (>= md) */}
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-[#8B92A5]">
            {isSettings ? (
              <>
                <Link href="/admin/settings?tab=system" scroll={false} className={tab === 'system' ? activeClass : inactiveClass}>Sistem & Periode</Link>
                <Link href="/admin/settings?tab=reli" scroll={false} className={tab === 'reli' ? activeClass : inactiveClass}>Instrumen RELI</Link>
                <Link href="/admin/settings?tab=fasil" scroll={false} className={tab === 'fasil' ? activeClass : inactiveClass}>Instrumen Fasil</Link>
                <Link href="/admin/settings?tab=etoser" scroll={false} className={tab === 'etoser' ? activeClass : inactiveClass}>Instrumen Etoser</Link>
                <Link href="/admin/settings?tab=sanksi" scroll={false} className={tab === 'sanksi' ? activeClass : inactiveClass}>Katalog Sanksi</Link>
              </>
            ) : isUsers ? (
              <>
                <Link href="/admin/users" scroll={false} className={role === 'All Roles' ? activeClass : inactiveClass}>Semua Role</Link>
                <Link href="/admin/users?role=Etoser" scroll={false} className={role === 'Etoser' ? activeClass : inactiveClass}>Etoser</Link>
                <Link href="/admin/users?role=Fasilitator" scroll={false} className={role === 'Fasilitator' ? activeClass : inactiveClass}>Fasilitator</Link>
                <Link href="/admin/users?role=Admin" scroll={false} className={role === 'Admin' ? activeClass : inactiveClass}>Admin</Link>
              </>
            ) : isAgendas ? (
              <>
                <Link href="/admin/agendas?tab=agenda" scroll={false} className={tab === 'agenda' ? activeClass : inactiveClass}>Daftar Agenda</Link>
                <Link href="/admin/agendas?tab=presensi" scroll={false} className={tab === 'presensi' ? activeClass : inactiveClass}>Presensi Kehadiran</Link>
              </>
            ) : pathname === '/admin' ? (
              <>
                <Link href="/admin?tab=etoser" scroll={false} className={tab === 'etoser' ? activeClass : inactiveClass}>RELI Etoser</Link>
                <Link href="/admin?tab=etoser-bulanan" scroll={false} className={tab === 'etoser-bulanan' ? activeClass : inactiveClass}>Monitoring Etoser</Link>
                <Link href="/admin?tab=fasil-bulanan" scroll={false} className={tab === 'fasil-bulanan' ? activeClass : inactiveClass}>Monitoring Fasil</Link>
                <Link href="/admin?tab=fasil" scroll={false} className={tab === 'fasil' ? activeClass : inactiveClass}>Leaderboard Fasil</Link>
              </>
            ) : null}
          </div>
        </>
      )}

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 text-teal-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowPalette(true)}
            placeholder="Search or type command" 
            className="pl-12 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium focus:ring-2 focus:ring-teal-500/30 w-72 shadow-[0_4px_15px_rgba(0,0,0,0.03)] focus:outline-none transition-all placeholder-teal-800/40 text-teal-900"
          />

          {showPalette && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              {isSearching ? (
                <div className="flex items-center justify-center p-6 text-teal-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-center text-teal-800/60">Tidak ada hasil ditemukan</div>
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
                      className="w-full flex flex-col items-start px-4 py-3 hover:bg-teal-50/80 rounded-xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {res.type === 'Menu' ? <LinkIcon className="w-3.5 h-3.5 text-teal-600" /> : res.type === 'User' ? <User className="w-3.5 h-3.5 text-blue-600" /> : <Calendar className="w-3.5 h-3.5 text-emerald-600" />}
                        <span className="font-bold text-sm text-teal-950">{res.title}</span>
                      </div>
                      <span className="text-xs text-teal-700/70 mt-0.5 ml-5">{res.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 border-l border-teal-200/50 pl-3 md:pl-6 ml-1 md:ml-2">
          <button className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-teal-700 hover:bg-white hover:text-[#0F766E] shadow-sm transition-all">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[#0F766E] to-teal-400 border-2 border-white/80 shadow-md overflow-hidden flex justify-center items-center text-white font-bold text-xs md:text-sm cursor-pointer hover:scale-105 transition-transform">
              A
            </div>
            <button onClick={handleLogout} title="Logout" className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-red-400 hover:bg-white hover:text-red-600 shadow-sm transition-all">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminHeader({ handleLogout }) {
  return (
    <Suspense fallback={<header className="h-16 md:h-24 px-4 md:px-8 shrink-0 bg-transparent"></header>}>
      <HeaderContent handleLogout={handleLogout} />
    </Suspense>
  );
}
