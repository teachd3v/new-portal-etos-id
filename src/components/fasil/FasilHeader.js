"use client";
import { User, Bell, LogOut, Search, Loader2, Link as LinkIcon, Calendar, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function FasilHeader({ userInitial = 'F', onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("Fasilitator");
  const [userId, setUserId] = useState("");
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
          setUserName(data.name);
          setUserId(data.id);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

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
        const res = await fetch(`/api/fasil/search?q=${encodeURIComponent(searchQuery)}`);
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


  const initial = userName.charAt(0).toUpperCase() || 'F';

  const isPresensi = pathname === '/fasil/presensi';
  const isPenilaian = pathname.startsWith('/fasil/penilaian');
  const isProfil = pathname.startsWith('/fasil/profil');
  const isDetailPage = pathname.startsWith('/fasil/penilaian/') && pathname !== '/fasil/penilaian' && pathname !== '/fasil/penilaian/mandiri' && pathname !== '/fasil/penilaian/binaan';
  
  const tab = searchParams.get('tab') || 'self';
  
  const activeClass = "text-[#1E1E2D] border-b-2 border-[#1E1E2D] pb-1";
  const inactiveClass = "hover:text-[#1E1E2D] transition-colors";

  return (
    <header className="h-16 md:h-24 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/40 md:bg-white/20 backdrop-blur-md border-b border-white/30 sticky top-0 z-30 transition-all">
      {/* Back Button for Detail Pages */}
      {isDetailPage ? (
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 bg-white/80 hover:bg-white border border-orange-200/90 rounded-full shadow-sm text-orange-950 font-bold text-xs md:text-sm transition-all active:scale-95 cursor-pointer hover:border-orange-400"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-700" />
            <span>Kembali</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Navigation Dropdown (< md) */}
          <div className="md:hidden">
            {isPresensi ? (
              <div className="relative">
                <select
                  value={`/fasil/presensi?tab=${tab}`}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-orange-200/90 text-orange-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/fasil/presensi?tab=self">Presensi Mandiri</option>
                  <option value="/fasil/presensi?tab=monitoring">Pemantauan Binaan</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-orange-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : isPenilaian ? (
              <div className="relative">
                <select
                  value={pathname}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-orange-200/90 text-orange-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/fasil/penilaian">Asesmen RELI Binaan</option>
                  <option value="/fasil/penilaian/binaan">Monitoring Bulanan Binaan</option>
                  <option value="/fasil/penilaian/mandiri">Penilaian Mandiri Fasil</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-orange-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : isProfil ? (
              <div className="relative">
                <select
                  value={pathname}
                  onChange={(e) => router.push(e.target.value)}
                  className="bg-white/90 backdrop-blur-md border border-orange-200/90 text-orange-950 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer max-w-[210px] truncate"
                >
                  <option value="/fasil/profil">Profil Saya</option>
                  <option value="/fasil/profil/portofolio">Portofolio</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-orange-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : null}
          </div>

          {/* Desktop Navigation Tabs (>= md) */}
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-[#8B92A5]">
            {isPresensi && (
              <>
                <Link href="/fasil/presensi?tab=self" className={tab === 'self' ? activeClass : inactiveClass}>Presensi Mandiri</Link>
                <Link href="/fasil/presensi?tab=monitoring" className={tab === 'monitoring' ? activeClass : inactiveClass}>Pemantauan Binaan</Link>
              </>
            )}
            {isPenilaian && (
              <>
                <Link href="/fasil/penilaian" className={pathname === '/fasil/penilaian' ? activeClass : inactiveClass}>Asesmen RELI Binaan</Link>
                <Link href="/fasil/penilaian/binaan" className={pathname === '/fasil/penilaian/binaan' ? activeClass : inactiveClass}>Monitoring Bulanan Binaan</Link>
                <Link href="/fasil/penilaian/mandiri" className={pathname === '/fasil/penilaian/mandiri' ? activeClass : inactiveClass}>Penilaian Mandiri Fasil</Link>
              </>
            )}
            {isProfil && (
              <>
                <Link href="/fasil/profil" className={pathname === '/fasil/profil' ? activeClass : inactiveClass}>Profil Saya</Link>
                <Link href="/fasil/profil/portofolio" className={pathname === '/fasil/profil/portofolio' ? activeClass : inactiveClass}>Portofolio</Link>
              </>
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-6">
        
        {/* Searchbox Command Palette */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 text-orange-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowPalette(true)}
            placeholder="Search or type command" 
            className="pl-12 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium focus:ring-2 focus:ring-orange-500/30 w-72 shadow-[0_4px_15px_rgba(0,0,0,0.03)] focus:outline-none transition-all placeholder-orange-800/40 text-orange-900"
          />

          {showPalette && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              {isSearching ? (
                <div className="flex items-center justify-center p-6 text-orange-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-center text-orange-800/60">Tidak ada hasil ditemukan</div>
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
                      className="w-full flex flex-col items-start px-4 py-3 hover:bg-orange-50/80 rounded-xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {res.type === 'Menu' ? <LinkIcon className="w-3.5 h-3.5 text-orange-600" /> : <Calendar className="w-3.5 h-3.5 text-orange-600" />}
                        <span className="font-bold text-sm text-orange-950">{res.title}</span>
                      </div>
                      <span className="text-xs text-orange-700/70 mt-0.5 ml-5">{res.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4 border-l border-orange-200/50 pl-3 md:pl-6 ml-1 md:ml-2">
          <button className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-orange-700 hover:bg-white hover:text-orange-600 shadow-sm transition-all relative">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 border-2 border-white/80 shadow-md overflow-hidden flex justify-center items-center text-white font-bold text-xs md:text-sm cursor-pointer hover:scale-105 transition-transform">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <button onClick={onLogout} title="Logout" className="w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center text-red-400 hover:bg-white hover:text-red-600 shadow-sm transition-all">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
