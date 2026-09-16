import fs from 'fs';

const content = `"use client";
import { useState, useEffect } from 'react';
import { Compass, Search, Loader2, Plus, Edit3, Trash2, X, Save, ShieldCheck, UserCheck, Users, Zap, AlertTriangle } from 'lucide-react';
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

  // Delete Confirm State
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
      const url = editingItem ? \`/api/reli/instrumen/\${editingItem.id}\` : '/api/reli/instrumen';
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
      const res = await fetch(\`/api/reli/instrumen/\${id}\`, { method: 'DELETE' });
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
      <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-teal-600" />
            Master Butir Resilient Leaders Index (BAR)
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            Total {items.length} butir instrumen standar terintegrasi untuk seluruh tahun pembinaan (T0 - T4).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari butir atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Butir
          </button>
        </div>
      </div>

      {/* Dimension Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dimensionTabs.map(dim => (
          <button
            key={dim}
            onClick={() => setSelectedDim(dim)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedDim === dim
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
            }`}
          >
            {dim} {dim !== 'ALL' && `(${items.filter(i => i.dimensi === dim).length})`}
          </button>
        ))}
      </div>

      {/* Item Cards List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            Tidak ada butir instrumen yang sesuai dengan pencarian atau filter.
          </div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:border-teal-300/80 transition-colors">
            
            {/* Header Item & Action Buttons */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3 items-center">
                <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 font-black text-xs flex items-center justify-center border border-teal-200 shrink-0">
                  {item.order_num}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {item.kode}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {item.dimensi} &bull; {item.subdimensi}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.judul}</h3>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-colors"
                  title="Edit Butir"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors disabled:opacity-50"
                  title="Hapus Butir"
                >
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Hapus
                </button>
              </div>
            </div>

            {/* Statements comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-teal-800 uppercase tracking-wider mb-1">Pernyataan Self (Etoser):</p>
                <p className="text-slate-700 italic leading-relaxed">"{item.pernyataan_self}"</p>
              </div>
              <div>
                <p className="font-bold text-indigo-800 uppercase tracking-wider mb-1">Pernyataan Fasilitator:</p>
                <p className="text-slate-700 italic leading-relaxed">"{item.pernyataan_fasil}"</p>
              </div>
            </div>

            {/* 4 Levels BAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="font-bold text-slate-600 mb-1">Level 1 - Emerging</p>
                <p className="text-slate-700 leading-relaxed text-[11px]">{item.bar_level_1}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="font-bold text-slate-600 mb-1">Level 2 - Developing</p>
                <p className="text-slate-700 leading-relaxed text-[11px]">{item.bar_level_2}</p>
              </div>
              <div className="p-3 bg-teal-50/60 border border-teal-200/60 rounded-xl">
                <p className="font-bold text-teal-800 mb-1">Level 3 - Transformative</p>
                <p className="text-teal-950 leading-relaxed text-[11px]">{item.bar_level_3}</p>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                <p className="font-bold text-emerald-800 mb-1">Level 4 - Resilient</p>
                <p className="text-emerald-950 leading-relaxed text-[11px]">{item.bar_level_4}</p>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Add / Edit Butir */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-slate-200 p-8 space-y-6">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  {editingItem ? `Edit Butir: ${editingItem.kode}` : 'Tambah Butir Baru'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {editingItem ? 'Edit Instrumen RELI' : 'Formulir Butir Instrumen Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Dimensi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.dimensi}
                    onChange={e => setFormData({ ...formData, dimensi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {DIMENSIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Subdimensi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spirituality, Integrity"
                    value={formData.subdimensi}
                    onChange={e => setFormData({ ...formData, subdimensi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kode Butir (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VR-S1"
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Judul / Nama Butir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Menjaga ibadah di tengah kesibukan"
                  value={formData.judul}
                  onChange={e => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                    Pernyataan Self (Etoser) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Saya ..."
                    value={formData.pernyataan_self}
                    onChange={e => setFormData({ ...formData, pernyataan_self: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">
                    Pernyataan Fasilitator <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Etoser ..."
                    value={formData.pernyataan_fasil}
                    onChange={e => setFormData({ ...formData, pernyataan_fasil: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Deskripsi Perilaku BAR (Level 1 – 4):
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
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
`;

fs.writeFileSync('src/components/admin/settings/InstrumenReliTab.js', content, 'utf8');
console.log('Successfully updated InstrumenReliTab.js with full CRUD in UTF8');
