import { useState, useEffect } from 'react';
import { Save, Loader2, Edit3, CheckCircle2, Clock, Calendar, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_T0_T4 = [
  { id: 'T0-2026', kode_periode: 'T0', label: 'T0 - Baseline (Awal Masuk Tahun 1)', start_date: '2026-09-01', end_date: '2026-09-30', tahun: '2026', is_open: true },
  { id: 'T1-2026', kode_periode: 'T1', label: 'T1 - Evaluasi Akhir Tahun 1 (Year 1 Endline)', start_date: '2027-06-01', end_date: '2027-06-30', tahun: '2026', is_open: false },
  { id: 'T2-2026', kode_periode: 'T2', label: 'T2 - Evaluasi Akhir Tahun 2 (Year 2 Endline)', start_date: '2028-06-01', end_date: '2028-06-30', tahun: '2026', is_open: false },
  { id: 'T3-2026', kode_periode: 'T3', label: 'T3 - Evaluasi Akhir Tahun 3 (Year 3 Endline)', start_date: '2029-06-01', end_date: '2029-06-30', tahun: '2026', is_open: false },
  { id: 'T4-2026', kode_periode: 'T4', label: 'T4 - Final Endline (Kelulusan Pembinaan)', start_date: '2030-06-01', end_date: '2030-06-30', tahun: '2026', is_open: false },
];

export default function SystemSettingsTab() {
  const [settings, setSettings] = useState({
    'variabel_instrumen': 'Value Resilience, Self Resilience, Social Resilience, Change Resilience',
    'daftar_wilayah': 'Jakarta, Bogor, Depok, Tangerang, Bekasi, Palu, Makassar, Aceh, Padang',
    'role_fasil': 'Reguler, Team Leader, Adminkeu, Double Job',
    'label_ipk_kurang': 'Level 1 - Emerging Leader',
    'label_ipk_cukup': 'Level 2 - Developing Leader',
    'label_ipk_baik': 'Level 3 - Transformative Leader',
    'label_ipk_sangat_baik': 'Level 4 - Resilient Leader'
  });
  
  const [periodes, setPeriodes] = useState(DEFAULT_T0_T4);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editingPeriode, setEditingPeriode] = useState(null);
  const [editForm, setEditForm] = useState({
    label: '',
    start_date: '',
    end_date: '',
    tahun: '',
    is_open: false
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Settings
      const resSet = await fetch('/api/admin/settings');
      if (resSet.ok) {
        const dataSet = await resSet.json();
        const s = { ...settings };
        dataSet.forEach(item => { s[item.key] = item.value; });
        setSettings(s);
      }

      // Fetch Periodes
      const resPer = await fetch('/api/admin/periode');
      if (resPer.ok) {
        const dataPer = await resPer.json();
        if (dataPer.success && dataPer.data && dataPer.data.length > 0) {
          setPeriodes(dataPer.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };


  const handleSaveSettings = async () => {
    setSaving(true);
    const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) toast.success('Pengaturan sistem berhasil disimpan!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePeriode = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/periode/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !currentStatus })
      });
      if (res.ok) {
        toast.success(`Akses periode ${!currentStatus ? 'dibuka' : 'ditutup'}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleOpenEdit = (periode) => {
    setEditingPeriode(periode);
    setEditForm({
      label: periode.label || '',
      start_date: periode.start_date || '',
      end_date: periode.end_date || '',
      tahun: periode.tahun || new Date().getFullYear().toString(),
      is_open: periode.is_open || false
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPeriode) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/periode/${editingPeriode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Detail periode berhasil diperbarui!');
        setEditingPeriode(null);
        fetchData();
      } else {
        toast.error(data.error || 'Gagal memperbarui periode');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl pb-20">
      
      {/* 1. Manajemen Periode RELI */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3 md:pb-4">
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900">Manajemen Periode RELI</h3>
            <p className="hidden md:block text-xs md:text-sm text-slate-600 font-medium mt-0.5">
              Atur jadwal tanggal mulai, tanggal selesai, dan buka/tutup akses instrumen RELI untuk setiap fase pembinaan (T0 – T4).
            </p>
          </div>
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-700 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-black">Fase & Label Periode</th>
                <th className="py-3.5 px-4 font-black">Masa Input Data (Jadwal)</th>
                <th className="py-3.5 px-4 font-black">Tahun</th>
                <th className="py-3.5 px-4 font-black text-center">Status Akses</th>
                <th className="py-3.5 px-4 font-black text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {periodes.map((p) => {
                const hasDates = p.start_date && p.end_date;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-black text-sm flex items-center justify-center">
                          {p.kode_periode}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.label}</p>
                          <p className="text-[11px] text-slate-400 font-medium">Kode: {p.kode_periode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {hasDates ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 w-fit">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{p.start_date}</span>
                          <span className="text-slate-400">s/d</span>
                          <span>{p.end_date}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum diatur</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-700 text-sm">
                      {p.tahun}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleTogglePeriode(p.id, p.is_open)}
                          className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            p.is_open ? 'bg-emerald-500' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              p.is_open ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold w-16 text-left ${p.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {p.is_open ? 'DIBUKA' : 'DITUTUP'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (< md) */}
        <div className="block md:hidden space-y-3">
          {periodes.map((p) => {
            const hasDates = p.start_date && p.end_date;
            return (
              <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs space-y-3">
                {/* Header row: Kode badge, label, and edit button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-black text-xs flex items-center justify-center shrink-0">
                      {p.kode_periode}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{p.label}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Tahun: {p.tahun}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenEdit(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-colors shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Schedule Date */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  {hasDates ? (
                    <span>{p.start_date} s/d {p.end_date}</span>
                  ) : (
                    <span className="text-slate-400 italic">Jadwal belum diatur</span>
                  )}
                </div>

                {/* Access Status & Toggle Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Status Akses:</span>
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleTogglePeriode(p.id, p.is_open)}
                      className={`relative inline-flex h-5 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        p.is_open ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          p.is_open ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-extrabold ${p.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {p.is_open ? 'DIBUKA' : 'DITUTUP'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Edit Periode Modal */}
      {editingPeriode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 p-8 space-y-6">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  {editingPeriode.kode_periode}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">Edit Pengaturan Periode</h3>
              </div>
              <button 
                onClick={() => setEditingPeriode(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Label / Keterangan Periode
                </label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  placeholder="e.g. T0 - Baseline (Awal Masuk Tahun 1)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tanggal Mulai Input
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tanggal Selesai Input
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tahun Kalender
                  </label>
                  <input
                    type="number"
                    value={editForm.tahun}
                    onChange={(e) => setEditForm({ ...editForm, tahun: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Status Akses
                  </label>
                  <select
                    value={editForm.is_open ? 'open' : 'closed'}
                    onChange={(e) => setEditForm({ ...editForm, is_open: e.target.value === 'open' })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  >
                    <option value="open">DIBUKA (Aktif)</option>
                    <option value="closed">DITUTUP (Nonaktif)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPeriode(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updating}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Manajemen Periode Monitoring Bulanan */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
        <div className="border-b border-slate-100 pb-3 md:pb-4">
          <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] md:text-xs uppercase tracking-wider mb-1.5 border border-orange-200">
            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> Rutin Bulanan
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900">Manajemen Periode Monitoring Bulanan</h3>
          <p className="hidden md:block text-sm text-slate-600 font-medium mt-1">
            Atur rentang tanggal pengisian rutin setiap bulannya untuk <strong>Penilaian Mandiri Fasilitator</strong> dan <strong>Monitoring Capaian Etoser</strong> (misal: Tanggal 25 s.d Tanggal 5 bulan berikutnya).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          
          {/* Monitoring Fasilitator */}
          <div className="p-4 md:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-500"></span>
                Monitoring Mandiri Fasilitator
              </h4>
              <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                Bulanan
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500">Rentang tanggal pengisian formulir refleksi & evaluasi mandiri Fasilitator setiap bulan.</p>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai Buka</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.periode_fasil_start || '25'}
                    onChange={e => setSettings({ ...settings, periode_fasil_start: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai Tutup</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.periode_fasil_end || '5'}
                    onChange={e => setSettings({ ...settings, periode_fasil_end: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Etoser */}
          <div className="p-4 md:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-sky-500"></span>
                Monitoring Mandiri Etoser
              </h4>
              <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Bulanan
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500">Rentang tanggal pengisian evaluasi capaian mandiri Etoser setiap bulan.</p>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai Buka</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.periode_etoser_start || '25'}
                    onChange={e => setSettings({ ...settings, periode_etoser_start: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai Tutup</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.periode_etoser_end || '5'}
                    onChange={e => setSettings({ ...settings, periode_etoser_end: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Jadwal Monitoring
          </button>
        </div>
      </div>


      {/* 3. Konfigurasi Lanjutan */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
        <h3 className="text-lg md:text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Konfigurasi Lanjutan</h3>

        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            4 Dimensi Utama RELI (Pisahkan dengan koma)
          </label>
          <input 
            type="text" 
            value={settings.variabel_instrumen} 
            onChange={e => setSettings({...settings, variabel_instrumen: e.target.value})} 
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            placeholder="Value Resilience, Self Resilience, Social Resilience, Change Resilience" 
          />
          <p className="hidden md:block text-xs text-slate-500 mt-1.5">Dimensi baku yang digunakan dalam radar chart dan rekapitulasi penilaian RELI.</p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Daftar Wilayah Asal (Pisahkan dengan koma)
          </label>
          <input 
            type="text" 
            value={settings.daftar_wilayah} 
            onChange={e => setSettings({...settings, daftar_wilayah: e.target.value})} 
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            placeholder="Bogor, Jakarta, Padang, Aceh, Makassar, dll." 
          />
          <p className="hidden md:block text-xs text-slate-500 mt-1.5">Daftar ini digunakan sebagai pilihan dropdown wilayah pada manajemen user dan filter dashboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Bobot Penilaian Fasilitator (%)
            </label>
            <input 
              type="number" 
              value={settings.bobot_fasil || '50'} 
              onChange={e => setSettings({...settings, bobot_fasil: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
            <p className="hidden md:block text-xs text-slate-500 mt-1">Standar RELI: 50%</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Bobot Self-Assessment Etoser (%)
            </label>
            <input 
              type="number" 
              value={settings.bobot_etoser || '50'} 
              onChange={e => setSettings({...settings, bobot_etoser: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
            <p className="hidden md:block text-xs text-slate-500 mt-1">Standar RELI: 50%</p>
          </div>
        </div>
      </div>

      {/* 4. Label Kematangan RELI */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 border-b border-slate-100 pb-2">Label Kematangan RELI</h3>
          <p className="hidden md:block text-xs text-slate-500 font-medium mt-1">
            Penamaan 4 tingkatan kematangan kepemimpinan (skala 1.00 – 4.00) berdasarkan konsep Resilient Leaders Index.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skor 1.00 – 1.74 (Level 1)
            </label>
            <input 
              type="text" 
              value={settings.label_ipk_kurang || 'Emerging Leader'} 
              onChange={e => setSettings({...settings, label_ipk_kurang: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skor 1.75 – 2.49 (Level 2)
            </label>
            <input 
              type="text" 
              value={settings.label_ipk_cukup || 'Developing Leader'} 
              onChange={e => setSettings({...settings, label_ipk_cukup: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skor 2.50 – 3.24 (Level 3)
            </label>
            <input 
              type="text" 
              value={settings.label_ipk_baik || 'Transformative Leader'} 
              onChange={e => setSettings({...settings, label_ipk_baik: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skor 3.25 – 4.00 (Level 4)
            </label>
            <input 
              type="text" 
              value={settings.label_ipk_sangat_baik || 'Resilient Leader'} 
              onChange={e => setSettings({...settings, label_ipk_sangat_baik: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button 
          onClick={handleSaveSettings} 
          disabled={saving} 
          className="w-full sm:w-auto bg-teal-800 hover:bg-teal-900 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 text-xs md:text-sm cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
          Simpan Semua Konfigurasi
        </button>
      </div>
    </div>
  );
}

