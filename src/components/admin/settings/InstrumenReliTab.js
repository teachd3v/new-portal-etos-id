"use client";
import { useState, useEffect } from 'react';
import { Compass, Search, Loader2, Plus, Edit3, Trash2, X, Save, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DIMENSIONS = [
  'Value Resilience',
  'Self Resilience',
  'Social Resilience',
  'Change Resilience'
];

const INITIAL_FORM = {
  dimensi: 'Value Resilience',
  subdimensi: '',
  kode: '',
  judul: '',
  pernyataan_self: '',
  pernyataan_fasil: '',
  bar_level_1: '',
  bar_level_2: '',
  bar_level_3: '',
  bar_level_4: ''
};

export default function InstrumenReliTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDim, setSelectedDim] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Add, object = Edit
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/reli/instrumen');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat instrumen RELI');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      dimensi: item.dimensi || 'Value Resilience',
      subdimensi: item.subdimensi || '',
      kode: item.kode || '',
      judul: item.judul || '',
      pernyataan_self: item.pernyataan_self || '',
      pernyataan_fasil: item.pernyataan_fasil || '',
      bar_level_1: item.bar_level_1 || '',
      bar_level_2: item.bar_level_2 || '',
      bar_level_3: item.bar_level_3 || '',
      bar_level_4: item.bar_level_4 || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dimensi || !formData.subdimensi || !formData.judul || !formData.pernyataan_self || !formData.pernyataan_fasil) {
      toast.error('Mohon lengkapi seluruh field wajib');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem ? `/api/reli/instrumen/${editingItem.id}` : '/api/reli/instrumen';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (res.ok && (json.success || !json.error)) {
        toast.success(editingItem ? 'Butir berhasil diperbarui!' : 'Butir berhasil ditambahkan!');
        setShowModal(false);
        fetchItems();
      } else {
        toast.error(json.error || 'Gagal menyimpan butir');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus butir instrumen ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reli/instrumen/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && (json.success || !json.error)) {
        toast.success('Butir instrumen berhasil dihapus');
        fetchItems();
      } else {
        toast.error(json.error || 'Gagal menghapus butir');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  const dimensionTabs = ['ALL', ...DIMENSIONS];

  const filteredItems = items.filter(item => {
    const matchesDim = selectedDim === 'ALL' || item.dimensi === selectedDim;
    const matchesQuery = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subdimensi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDim && matchesQuery;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-20 animate-in fade-in duration-300">
      
      {/* Header & Filter Bar */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-3.5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-sm sm:text-base md:text-xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 md:w-5 md:h-5 text-teal-600 shrink-0" />
            <span>Master Butir Resilient Leaders Index</span>
          </h2>
          <p className="hidden md:block text-slate-500 font-medium text-xs md:text-sm mt-0.5">
            Total {items.length} butir instrumen standar terintegrasi untuk seluruh tahun pembinaan (T0 - T4).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari butir atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-3 md:px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Butir</span>
          </button>
        </div>
      </div>

      {/* Dimension Filter Buttons */}
      <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {dimensionTabs.map(dim => (
          <button
            key={dim}
            onClick={() => setSelectedDim(dim)}
            className={`px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedDim === dim
                ? 'bg-teal-800 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
            }`}
          >
            {dim} {dim !== 'ALL' && `(${items.filter(i => i.dimensi === dim).length})`}
          </button>
        ))}
      </div>

      {/* Item Cards */}
      <div className="space-y-3 md:space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200 p-8 md:p-12 text-center text-slate-400 font-medium text-xs md:text-sm">
            Tidak ada butir instrumen yang sesuai dengan pencarian atau filter.
          </div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-3.5 md:p-6 shadow-sm space-y-3 md:space-y-4 hover:border-teal-300/80 transition-colors">
            
            {/* Top Bar: Order, Badges & Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-teal-50 text-teal-800 font-black text-xs flex items-center justify-center border border-teal-200 shrink-0">
                  {item.order_num}
                </span>
                <span className="font-mono text-[10px] md:text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 shrink-0">
                  {item.kode}
                </span>
                <span className="text-[11px] md:text-xs font-bold text-slate-500 truncate">
                  {item.dimensi} &bull; {item.subdimensi}
                </span>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] md:text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                  title="Edit Butir"
                >
                  <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] md:text-xs font-bold border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Hapus Butir"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  )}
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* Title / Nama Butir: Spans full width of the card */}
            <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 leading-snug">
              {item.judul}
            </h3>

            {/* Statements comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs bg-slate-50/90 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/70">
              <div>
                <p className="font-bold text-[10px] md:text-xs text-teal-900 uppercase tracking-wider mb-0.5">
                  Pernyataan Self (Etoser):
                </p>
                <p className="text-slate-700 italic text-[11px] md:text-xs leading-relaxed">
                  "{item.pernyataan_self}"
                </p>
              </div>
              <div>
                <p className="font-bold text-[10px] md:text-xs text-indigo-900 uppercase tracking-wider mb-0.5">
                  Pernyataan Fasilitator:
                </p>
                <p className="text-slate-700 italic text-[11px] md:text-xs leading-relaxed">
                  "{item.pernyataan_fasil}"
                </p>
              </div>
            </div>

            {/* 4 Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-0.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                <p className="font-bold text-slate-700 text-[11px] mb-0.5">Level 1 - Emerging</p>
                <p className="text-slate-600 leading-relaxed text-[10px] md:text-[11px]">{item.bar_level_1}</p>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                <p className="font-bold text-slate-700 text-[11px] mb-0.5">Level 2 - Developing</p>
                <p className="text-slate-600 leading-relaxed text-[10px] md:text-[11px]">{item.bar_level_2}</p>
              </div>
              <div className="p-2.5 bg-teal-50/70 border border-teal-200/70 rounded-xl">
                <p className="font-bold text-teal-900 text-[11px] mb-0.5">Level 3 - Transformative</p>
                <p className="text-teal-950 leading-relaxed text-[10px] md:text-[11px]">{item.bar_level_3}</p>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                <p className="font-bold text-emerald-900 text-[11px] mb-0.5">Level 4 - Resilient</p>
                <p className="text-emerald-950 leading-relaxed text-[10px] md:text-[11px]">{item.bar_level_4}</p>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Add / Edit Butir */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col border border-slate-200 overflow-hidden">
            
            {/* Modal Header (Fixed at top) */}
            <div className="px-5 py-4 md:px-7 md:py-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
              <div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
                  {editingItem ? `Edit Butir: ${editingItem.kode}` : 'Tambah Butir Baru'}
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 mt-1">
                  {editingItem ? 'Edit Instrumen RELI' : 'Formulir Butir Instrumen Baru'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 md:p-7 overflow-y-auto flex-1 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Dimensi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.dimensi}
                      onChange={e => setFormData({ ...formData, dimensi: e.target.value })}
                      className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {DIMENSIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Subdimensi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spirituality, Integrity"
                      value={formData.subdimensi}
                      onChange={e => setFormData({ ...formData, subdimensi: e.target.value })}
                      className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Kode Butir (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VR-S1"
                      value={formData.kode}
                      onChange={e => setFormData({ ...formData, kode: e.target.value })}
                      className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Judul / Nama Butir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Menjaga ibadah di tengah kesibukan"
                    value={formData.judul}
                    onChange={e => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                      Pernyataan Self (Etoser) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Saya ..."
                      value={formData.pernyataan_self}
                      onChange={e => setFormData({ ...formData, pernyataan_self: e.target.value })}
                      className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] md:text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">
                      Pernyataan Fasilitator <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Etoser ..."
                      value={formData.pernyataan_fasil}
                      onChange={e => setFormData({ ...formData, pernyataan_fasil: e.target.value })}
                      className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[11px] md:text-xs font-black uppercase tracking-wider text-slate-800">
                    Deskripsi Level Perilaku (Level 1 – 4):
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Level 1 - Emerging</label>
                      <textarea
                        rows={2}
                        value={formData.bar_level_1}
                        onChange={e => setFormData({ ...formData, bar_level_1: e.target.value })}
                        placeholder="Perilaku tahap awal / reaktif..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Level 2 - Developing</label>
                      <textarea
                        rows={2}
                        value={formData.bar_level_2}
                        onChange={e => setFormData({ ...formData, bar_level_2: e.target.value })}
                        placeholder="Perilaku mulai konsisten secara mandiri..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-800 mb-1">Level 3 - Transformative</label>
                      <textarea
                        rows={2}
                        value={formData.bar_level_3}
                        onChange={e => setFormData({ ...formData, bar_level_3: e.target.value })}
                        placeholder="Perilaku teruji dalam tekanan & berdampak..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Level 4 - Resilient</label>
                      <textarea
                        rows={2}
                        value={formData.bar_level_4}
                        onChange={e => setFormData({ ...formData, bar_level_4: e.target.value })}
                        placeholder="Perilaku menjadi teladan & menginspirasi..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="px-5 py-3.5 md:px-7 md:py-4 border-t border-slate-100 bg-slate-50/90 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 md:px-5 md:py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs md:text-sm hover:bg-white transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 md:px-6 md:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Butir'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

