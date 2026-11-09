"use client";
import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Megaphone,
  Smartphone,
  Users,
  Trash2,
  RotateCcw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_TEMPLATES = [
  {
    label: '🚀 Update Fitur',
    category: 'UPDATE_FITUR',
    targetRole: 'ALL',
    title: 'Pembaruan Fitur Portal Etos ID 🚀',
    body: 'Tampilan & fitur baru telah hadir di Portal Etos ID untuk mempermudah aktivitas pembinaanmu. Tap untuk melihat pembaruan!',
    url: '/',
  },
  {
    label: '📋 Reminder Monev',
    category: 'REMINDER_MONEV',
    targetRole: 'ETOSER',
    title: 'Pengingat Pengisian Monitoring Bulanan 📋',
    body: 'Jangan lupa lengkapi laporan Monitoring Bulanan (Monev) sebelum batas waktu berakhir ya!',
    url: '/etoser/monev-bulanan',
  },
  {
    label: '🎯 Asesmen RELI',
    category: 'REMINDER_MONEV',
    targetRole: 'ETOSER',
    title: 'Periode Asesmen RELI Telah Dibuka 🎯',
    body: 'Silakan isi penilaian mandiri Resilient Leaders Index (RELI) pada menu Penilaian Mandiri.',
    url: '/etoser/penilaian-mandiri',
  },
  {
    label: '📅 Info Agenda',
    category: 'INFO_AGENDA',
    targetRole: 'ALL',
    title: 'Agenda Pembinaan & Presensi 📅',
    body: 'Agenda pembinaan segera berlangsung. Pastikan mengisi presensi kehadiran dan mengerjakan Pre/Post Test tepat waktu.',
    url: '/etoser/presensi',
  },
];

const DEEP_LINK_OPTIONS = [
  { label: 'Beranda Utama', value: '/' },
  { label: 'Etoser — Monitoring Bulanan', value: '/etoser/monev-bulanan' },
  { label: 'Etoser — Penilaian Mandiri RELI', value: '/etoser/penilaian-mandiri' },
  { label: 'Etoser — Presensi & Agenda', value: '/etoser/presensi' },
  { label: 'Etoser — Profil & Portofolio', value: '/etoser/profil' },
  { label: 'Fasilitator — Monitoring Binaan', value: '/fasil/penilaian/binaan' },
  { label: 'Fasilitator — Presensi & Agenda', value: '/fasil/presensi' },
  { label: 'Admin — Dashboard Utama', value: '/admin' },
];

function parseDeviceLabel(ua = '') {
  if (!ua) return 'Perangkat Web';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh|Mac OS/i.test(ua);
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /Chrome\//i.test(ua)
    ? 'Chrome'
    : /Firefox\//i.test(ua)
    ? 'Firefox'
    : /Safari\//i.test(ua)
    ? 'Safari'
    : 'Browser';

  if (isAndroid) return `Android • ${browser}`;
  if (isIOS) return `iOS • ${browser}`;
  if (isWindows) return `Windows • ${browser}`;
  if (isMac) return `macOS • ${browser}`;
  return browser;
}

const UNIFIED_FIELD_CLASS =
  'w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] font-semibold text-slate-700 placeholder:text-[11px] placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all';

export default function BroadcastPushTab() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    uniqueUsers: 0,
    etoserDevices: 0,
    fasilDevices: 0,
    adminDevices: 0,
  });
  const [broadcasts, setBroadcasts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [rightTab, setRightTab] = useState('history');

  // Form states
  const [category, setCategory] = useState('UPDATE_FITUR');
  const [targetRole, setTargetRole] = useState('ALL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [testingSelf, setTestingSelf] = useState(false);

  const fetchBroadcastData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/push/broadcast');
      if (res.ok) {
        const json = await res.json();
        if (json.stats) setStats(json.stats);
        if (Array.isArray(json.broadcasts)) setBroadcasts(json.broadcasts);
        if (Array.isArray(json.subscriptions)) setSubscriptions(json.subscriptions);
      }
    } catch {
      toast.error('Gagal memuat data broadcast push');
    }
  }, []);

  useEffect(() => {
    fetchBroadcastData();
    const handleSubChange = () => fetchBroadcastData();
    window.addEventListener('etos-push-subscription-changed', handleSubChange);
    return () => {
      window.removeEventListener('etos-push-subscription-changed', handleSubChange);
    };
  }, [fetchBroadcastData]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Judul dan isi pesan wajib diisi');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          category,
          targetRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const b = data.broadcast;
        toast.success(
          `Broadcast terkirim (${b.total_success}/${b.total_targeted} perangkat)`
        );
        setTitle('');
        setBody('');
        fetchBroadcastData();
        window.dispatchEvent(new Event('etos-push-subscription-changed'));
      } else {
        toast.error(data.error || 'Gagal mengirim broadcast');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSending(false);
    }
  };

  const handleTestToMyDevice = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Isi judul dan pesan terlebih dahulu');
      return;
    }

    setTestingSelf(true);
    try {
      const res = await fetch('/api/admin/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_self',
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          category,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Preview dikirim ke ${data.sent} perangkat Admin`);
      } else {
        toast.error(data.error || 'Gagal mengirim preview');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setTestingSelf(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    try {
      const res = await fetch(`/api/admin/push/broadcast?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Riwayat dihapus');
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      toast.error('Gagal menghapus riwayat');
    }
  };

  const handleDeleteSubscription = async (subId) => {
    try {
      const res = await fetch(
        `/api/admin/push/broadcast?subscriptionId=${encodeURIComponent(subId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Perangkat dihapus');
        fetchBroadcastData();
      }
    } catch {
      toast.error('Gagal menghapus perangkat');
    }
  };

  return (
    <div className="space-y-3.5 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shrink-0">
          <Radio className="w-4 h-4" />
        </div>
        <h2 className="text-sm md:text-base font-extrabold text-slate-900">
          Broadcast & Web Push Notification
        </h2>
      </div>

      {/* 4 Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Perangkat Aktif
            </p>
            <p className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
              {stats.totalDevices}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Etoser
            </p>
            <p className="text-lg md:text-xl font-black text-sky-700 mt-0.5">
              {stats.etoserDevices}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fasil
            </p>
            <p className="text-lg md:text-xl font-black text-orange-600 mt-0.5">
              {stats.fasilDevices}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin
            </p>
            <p className="text-lg md:text-xl font-black text-teal-700 mt-0.5">
              {stats.adminDevices}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Broadcast Composer */}
        <form
          onSubmit={handleSendBroadcast}
          className="lg:col-span-5 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3.5 md:p-4 space-y-3 shadow-2xs"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">
              Buat Broadcast Baru
            </h3>
          </div>

          {/* Quick Templates */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Template
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCategory(tpl.category);
                    setTargetRole(tpl.targetRole);
                    setTitle(tpl.title);
                    setBody(tpl.body);
                    setUrl(tpl.url);
                    setCustomUrlMode(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200/80 hover:border-teal-200 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Target Role */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Kategori Info
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={UNIFIED_FIELD_CLASS}
              >
                <option value="UPDATE_FITUR">🚀 Update Fitur</option>
                <option value="PENGUMUMAN">📢 Pengumuman</option>
                <option value="REMINDER_MONEV">📋 Reminder Evaluasi</option>
                <option value="INFO_AGENDA">📅 Info Agenda</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Penerima
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={UNIFIED_FIELD_CLASS}
              >
                <option value="ALL">Semua ({stats.totalDevices})</option>
                <option value="ETOSER">Etoser ({stats.etoserDevices})</option>
                <option value="FASIL">Fasil ({stats.fasilDevices})</option>
                <option value="ADMIN">Admin ({stats.adminDevices})</option>
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Judul Notifikasi
            </label>
            <input
              type="text"
              maxLength={90}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembaruan Fitur Monitoring Bulanan"
              className={UNIFIED_FIELD_CLASS}
            />
          </div>

          {/* Body Textarea */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Isi Pesan
            </label>
            <textarea
              rows={3}
              maxLength={280}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tuliskan isi pesan notifikasi..."
              className={`${UNIFIED_FIELD_CLASS} resize-none`}
            />
          </div>

          {/* Target Deep Link */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Halaman Tujuan
            </label>
            <select
              value={
                !customUrlMode && DEEP_LINK_OPTIONS.some((o) => o.value === url)
                  ? url
                  : '__custom__'
              }
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomUrlMode(true);
                } else {
                  setCustomUrlMode(false);
                  setUrl(e.target.value);
                }
              }}
              className={UNIFIED_FIELD_CLASS}
            >
              {DEEP_LINK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
              <option value="__custom__">URL Kustom...</option>
            </select>

            {customUrlMode && (
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/etoser/monev-bulanan"
                className={UNIFIED_FIELD_CLASS}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={testingSelf || sending}
              onClick={handleTestToMyDevice}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {testingSelf ? 'Mengirim...' : 'Uji ke Saya'}
            </button>
            <button
              type="submit"
              disabled={sending || testingSelf}
              className="flex-1 py-2 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Kirim Broadcast
            </button>
          </div>
        </form>

        {/* Right Column: Broadcast History & Subscribed Devices */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3.5 md:p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setRightTab('history')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  rightTab === 'history'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat ({broadcasts.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab('devices')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  rightTab === 'devices'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Perangkat ({subscriptions.length})
              </button>
            </div>
          </div>

          {rightTab === 'history' ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {broadcasts.length === 0 ? (
                <div className="py-10 text-center space-y-1">
                  <Megaphone className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-[11px] font-semibold text-slate-500">
                    Belum ada riwayat broadcast
                  </p>
                </div>
              ) : (
                broadcasts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {item.category || 'PENGUMUMAN'}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.target_role || 'ALL'}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.total_success ?? 0}/{item.total_targeted ?? 0} terkirim
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(item.category || 'PENGUMUMAN');
                            setTargetRole(item.target_role || 'ALL');
                            setTitle(item.title || '');
                            setBody(item.body || '');
                            setUrl(item.url || '/');
                            setCustomUrlMode(
                              !DEEP_LINK_OPTIONS.some((o) => o.value === (item.url || '/'))
                            );
                            toast.success('Disalin ke form');
                          }}
                          title="Gunakan Ulang"
                          className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcast(item.id)}
                          title="Hapus"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-slate-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <ExternalLink className="w-2.5 h-2.5" /> {item.url || '/'}
                      </span>
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {subscriptions.length === 0 ? (
                <div className="py-10 text-center space-y-1">
                  <Smartphone className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-[11px] font-semibold text-slate-500">
                    Belum ada perangkat terdaftar
                  </p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {sub.user_name || sub.user_id}
                        </span>
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                          {sub.user_id}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            sub.role === 'ADMIN'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : sub.role === 'FASIL'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}
                        >
                          {sub.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {parseDeviceLabel(sub.user_agent)}
                        {sub.wilayah ? ` • ${sub.wilayah}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubscription(sub.id)}
                      title="Hapus Perangkat"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
