"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Link as LinkIcon, User, Calendar, Download } from 'lucide-react';
import { isRunningStandalone } from '@/components/pwa/PwaInstallPrompt';

const ROLE_THEMES = {
  admin: {
    btnText: 'text-teal-700 hover:text-[#0F766E]',
    ring: 'focus:ring-teal-500/30 border-teal-200/80 text-teal-950 placeholder-teal-800/40',
    spinner: 'text-teal-600',
    hoverRow: 'hover:bg-teal-50/80 active:bg-teal-100/70',
    title: 'text-teal-950',
    sub: 'text-teal-700/70',
    icon: 'text-teal-600',
    installBtn: 'bg-teal-600/10 border-teal-300/70 text-teal-800',
  },
  fasil: {
    btnText: 'text-orange-700 hover:text-orange-600',
    ring: 'focus:ring-orange-500/30 border-orange-200/80 text-orange-950 placeholder-orange-800/40',
    spinner: 'text-orange-600',
    hoverRow: 'hover:bg-orange-50/80 active:bg-orange-100/70',
    title: 'text-orange-950',
    sub: 'text-orange-700/70',
    icon: 'text-orange-600',
    installBtn: 'bg-orange-500/10 border-orange-300/70 text-orange-800',
  },
  etoser: {
    btnText: 'text-sky-700 hover:text-sky-600',
    ring: 'focus:ring-sky-500/30 border-sky-200/80 text-sky-950 placeholder-sky-800/40',
    spinner: 'text-sky-600',
    hoverRow: 'hover:bg-sky-50/80 active:bg-sky-100/70',
    title: 'text-sky-950',
    sub: 'text-sky-700/70',
    icon: 'text-sky-600',
    installBtn: 'bg-sky-500/10 border-sky-300/70 text-sky-800',
  },
};

export default function MobileHeaderTools({ role = 'etoser', searchEndpoint = '/api/etoser/search' }) {
  const router = useRouter();
  const theme = ROLE_THEMES[role] || ROLE_THEMES.etoser;

  const [openSearch, setOpenSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [canShowInstall, setCanShowInstall] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkInstallVisibility = () => {
      setCanShowInstall(!isRunningStandalone());
    };
    checkInstallVisibility();

    window.addEventListener('etos-pwa-installed', checkInstallVisibility);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onMqChange = () => checkInstallVisibility();
    mq.addEventListener?.('change', onMqChange);

    return () => {
      window.removeEventListener('etos-pwa-installed', onMqChange);
      mq.removeEventListener?.('change', onMqChange);
    };
  }, []);

  useEffect(() => {
    if (openSearch) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [openSearch]);

  useEffect(() => {
    if (!openSearch || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [query, openSearch, searchEndpoint]);

  const triggerInstall = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('etos-open-install-prompt'));
    }
  };

  return (
    <>
      <div className="flex md:hidden items-center gap-1.5">
        {canShowInstall && (
          <button
            type="button"
            onClick={triggerInstall}
            title="Instal Aplikasi ke HP"
            aria-label="Instal Aplikasi"
            className={`w-8 h-8 rounded-full border backdrop-blur-md flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer ${theme.installBtn}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpenSearch(true)}
          title="Cari"
          aria-label="Buka Pencarian"
          className={`w-8 h-8 bg-white/60 backdrop-blur-md border border-white/70 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer ${theme.btnText}`}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {openSearch && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm md:hidden flex flex-col animate-in fade-in duration-150"
          onClick={() => setOpenSearch(false)}
        >
          <div
            className="w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 shadow-2xl px-4 pb-4 pt-[max(calc(env(safe-area-inset-top,0px)+0.75rem),1rem)] rounded-b-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 ${theme.icon}`} />
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik kata kunci pencarian..."
                  className={`w-full pl-10 pr-9 py-2.5 bg-slate-50 border rounded-2xl text-base font-medium focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpenSearch(false)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            </div>

            {query.trim().length >= 2 && (
              <div className="mt-3 max-h-[60dvh] overflow-y-auto native-scroll divide-y divide-slate-100">
                {searching ? (
                  <div className={`flex items-center justify-center py-8 ${theme.spinner}`}>
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-6 text-center text-xs font-medium text-slate-500">
                    Tidak ada hasil ditemukan untuk &quot;{query}&quot;
                  </div>
                ) : (
                  results.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOpenSearch(false);
                        router.push(res.url);
                      }}
                      className={`w-full flex flex-col items-start px-3 py-3 rounded-xl transition-colors text-left cursor-pointer ${theme.hoverRow}`}
                    >
                      <div className="flex items-center gap-2">
                        {res.type === 'Menu' ? (
                          <LinkIcon className={`w-3.5 h-3.5 ${theme.icon}`} />
                        ) : res.type === 'User' ? (
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Calendar className={`w-3.5 h-3.5 ${theme.icon}`} />
                        )}
                        <span className={`font-bold text-sm ${theme.title}`}>{res.title}</span>
                      </div>
                      {res.subtitle && (
                        <span className={`text-xs mt-0.5 ml-5 ${theme.sub}`}>{res.subtitle}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
