"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  Sparkles,
  Megaphone,
  Calendar,
  ClipboardCheck,
  Send,
  Loader2,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getCategoryMeta(category) {
  switch (category) {
    case 'UPDATE_FITUR':
      return {
        label: 'Update Fitur',
        icon: Sparkles,
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      };
    case 'REMINDER_MONEV':
      return {
        label: 'Reminder Evaluasi',
        icon: ClipboardCheck,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'INFO_AGENDA':
      return {
        label: 'Info Agenda',
        icon: Calendar,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    default:
      return {
        label: 'Pengumuman',
        icon: Megaphone,
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      };
  }
}

const SEEN_STORAGE_KEY = 'etos_seen_broadcast_ids_v1';

export default function NotificationBellPopover({ role = 'etoser', theme = 'teal' }) {
  const router = useRouter();
  const popoverRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState('');
  const [broadcasts, setBroadcasts] = useState([]);
  const [seenIds, setSeenIds] = useState([]);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const themeStyles = {
    teal: {
      buttonText: 'text-teal-700 hover:text-[#0F766E]',
      accentBg: 'bg-teal-700 hover:bg-teal-800',
      lightBg: 'bg-teal-50/80 border-teal-200/80 text-teal-900',
    },
    sky: {
      buttonText: 'text-sky-700 hover:text-sky-600',
      accentBg: 'bg-sky-600 hover:bg-sky-700',
      lightBg: 'bg-sky-50/80 border-sky-200/80 text-sky-900',
    },
    orange: {
      buttonText: 'text-orange-700 hover:text-orange-600',
      accentBg: 'bg-orange-600 hover:bg-orange-700',
      lightBg: 'bg-orange-50/80 border-orange-200/80 text-orange-900',
    },
  }[theme] || {
    buttonText: 'text-teal-700 hover:text-[#0F766E]',
    accentBg: 'bg-teal-700 hover:bg-teal-800',
    lightBg: 'bg-teal-50/80 border-teal-200/80 text-teal-900',
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setSeenIds(saved);
    } catch {
      // ignore
    }
  }, []);

  const syncNotificationState = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const isPushSupported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(isPushSupported);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    let currentEndpoint = '';
    if (isPushSupported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.pushManager) {
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            currentEndpoint = existingSub.endpoint;
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const qs = currentEndpoint
        ? `?endpoint=${encodeURIComponent(currentEndpoint)}`
        : '';
      const res = await fetch(`/api/push/subscription${qs}`);
      if (res.ok) {
        const data = await res.json();
        if (data.publicKey) setVapidPublicKey(data.publicKey);
        if (Array.isArray(data.broadcasts)) setBroadcasts(data.broadcasts);
        setIsSubscribed(Boolean(currentEndpoint && data.isSubscribed));

        // Auto-resync if browser has active PushSubscription but DB doesn't have it yet
        if (currentEndpoint && !data.isSubscribed && Notification.permission === 'granted') {
          const reg = await navigator.serviceWorker.getRegistration();
          const existingSub = await reg?.pushManager?.getSubscription();
          if (existingSub) {
            await fetch('/api/push/subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: existingSub.toJSON() }),
            });
            setIsSubscribed(true);
          }
        }
      }
    } catch {
      // ignore offline
    }
  }, []);

  useEffect(() => {
    syncNotificationState();

    // Listen for real-time incoming push messages from Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event) => {
        if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
          syncNotificationState();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [syncNotificationState]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleEnablePush = async () => {
    if (!supported) {
      toast.error('Browser ini belum mendukung Web Push Notification');
      return;
    }

    setLoadingToggle(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Izin notifikasi ditolak di pengaturan browser');
        return;
      }

      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;

      let pubKey = vapidPublicKey;
      if (!pubKey) {
        const cfgRes = await fetch('/api/push/subscription');
        const cfgJson = await cfgRes.json();
        pubKey = cfgJson.publicKey;
        setVapidPublicKey(pubKey);
      }

      const existingSub = await reg.pushManager.getSubscription();
      const pushSub =
        existingSub ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pubKey),
        }));

      const res = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: pushSub.toJSON(),
          sendTest: true,
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        toast.success('Notifikasi Push berhasil diaktifkan di perangkat ini!');
        window.dispatchEvent(new Event('etos-push-subscription-changed'));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal mengaktifkan notifikasi');
      }
    } catch (err) {
      console.error('Enable push error:', err);
      toast.error('Gagal mendaftarkan layanan Push di browser ini');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDisablePush = async () => {
    setLoadingToggle(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const existingSub = await reg?.pushManager?.getSubscription();
      const endpoint = existingSub?.endpoint || null;

      if (existingSub) {
        await existingSub.unsubscribe().catch(() => {});
      }

      await fetch('/api/push/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      setIsSubscribed(false);
      toast.success('Notifikasi Push dinonaktifkan di perangkat ini');
      window.dispatchEvent(new Event('etos-push-subscription-changed'));
    } catch {
      toast.error('Gagal menonaktifkan notifikasi');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleSendSelfTest = async () => {
    setTestingPush(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const existingSub = await reg?.pushManager?.getSubscription();
      if (!existingSub) {
        toast.error('Silakan aktifkan notifikasi terlebih dahulu');
        return;
      }

      const res = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: existingSub.toJSON(),
          sendTest: true,
        }),
      });

      if (res.ok) {
        toast.success('Notifikasi uji coba dikirim ke perangkatmu!');
      } else {
        toast.error('Gagal mengirim uji notifikasi');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setTestingPush(false);
    }
  };

  const markAllSeen = (items = broadcasts) => {
    const allIds = items.map((b) => b.id);
    const merged = Array.from(new Set([...seenIds, ...allIds]));
    setSeenIds(merged);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(merged.slice(-100)));
    } catch {
      // ignore
    }
  };

  const unreadCount = broadcasts.filter((b) => !seenIds.includes(b.id)).length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) {
            syncNotificationState();
          }
        }}
        title="Notifikasi & Pembaruan"
        className={`w-8 h-8 md:w-10 md:h-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-all relative cursor-pointer ${themeStyles.buttonText}`}
      >
        {isSubscribed ? (
          <BellRing className="w-4 h-4 md:w-5 md:h-5" />
        ) : (
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
        )}

        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : !isSubscribed ? (
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-amber-500 rounded-full border border-white" />
        ) : null}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-extrabold text-slate-900">
                Pusat Notifikasi & Update
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllSeen()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                Tandai Dibaca
              </button>
            )}
          </div>

          {/* Push Subscription Status Strip */}
          <div className="p-3 border-b border-slate-100 bg-white">
            {!supported ? (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200/70">
                <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Browser perangkat ini belum mendukung Web Push.</span>
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-start gap-2 text-[11px] text-rose-700 bg-rose-50/80 px-2.5 py-2 rounded-xl border border-rose-200/70">
                <BellOff className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Izin notifikasi diblokir di browser. Izinkan notifikasi pada ikon gembok address bar untuk mengaktifkan push.
                </span>
              </div>
            ) : isSubscribed ? (
              <div className="flex items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-2 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-emerald-950 truncate">
                      Push Aktif di Perangkat Ini
                    </p>
                    <p className="text-[10px] text-emerald-700 truncate">
                      Siap menerima notifikasi instan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={testingPush}
                    onClick={handleSendSelfTest}
                    className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingPush ? '...' : 'Uji'}
                  </button>
                  <button
                    type="button"
                    disabled={loadingToggle}
                    onClick={handleDisablePush}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Off
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-2.5 rounded-xl border ${themeStyles.lightBg} space-y-2`}>
                <p className="text-[11px] font-medium leading-snug">
                  Aktifkan <strong>Web Push Notification</strong> agar langsung mendapat kabar fitur baru, pengumuman, & jadwal di HP/perangkatmu.
                </p>
                <button
                  type="button"
                  disabled={loadingToggle}
                  onClick={handleEnablePush}
                  className={`w-full py-1.5 px-3 rounded-lg text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${themeStyles.accentBg}`}
                >
                  {loadingToggle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BellRing className="w-3.5 h-3.5" />
                  )}
                  Aktifkan Notifikasi Push
                </button>
              </div>
            )}
          </div>

          {/* Broadcast Feed List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {broadcasts.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  Belum ada pengumuman terbaru
                </p>
                <p className="text-[11px] text-slate-400">
                  Kabar pembaruan fitur & informasi penting akan tampil di sini.
                </p>
              </div>
            ) : (
              broadcasts.map((item) => {
                const isUnread = !seenIds.includes(item.id);
                const meta = getCategoryMeta(item.category);
                const IconComp = meta.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markAllSeen([item]);
                      setOpen(false);
                      if (item.url && item.url !== '/') {
                        router.push(item.url);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50/90 transition-colors flex items-start gap-2.5 cursor-pointer ${
                      isUnread ? 'bg-teal-50/30' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${meta.badgeClass}`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                      {item.url && item.url !== '/' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 mt-1">
                          Buka halaman <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Admin Quick Action Footer */}
          {role === 'admin' && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push('/admin/settings?tab=broadcast');
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Kelola & Kirim Broadcast Push
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
