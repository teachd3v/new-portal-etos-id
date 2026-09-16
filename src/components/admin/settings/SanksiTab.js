import ConfirmModal from '../../ui/ConfirmModal';
import { toast } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, UploadCloud } from 'lucide-react';
import CsvImportModal from './CsvImportModal';

export default function SanksiTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsImportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/sanksi');
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const url = isEdit ? `/api/admin/sanksi/${formData.id}` : '/api/admin/sanksi';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "Hapus Data",
      message: "Yakin ingin menghapus data ini?",
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/sanksi/${id}`, { method: 'DELETE' });
          fetchData();
          toast.success("Berhasil dihapus!");
        } catch (e) {
          toast.error("Gagal menghapus data.");
        }
      }
    });
  };


  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkDelete = () => {
    setConfirmConfig({
      title: "Hapus Massal",
      message: "Yakin ingin menghapus " + selectedIds.length + " data terpilih?",
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/sanksi', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          if (res.ok) {
            setSelectedIds([]);
            fetchData();
            toast.success("Berhasil menghapus data massal!");
          } else {
            toast.error('Gagal menghapus data massal.');
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg md:text-xl font-bold text-teal-950">Master Katalog Sanksi</h2>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-bold py-2 px-3 md:px-4 rounded-xl shadow-sm text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-1.5 bg-white text-teal-800 border border-teal-200 hover:bg-teal-50 font-bold py-2 px-3 md:px-4 rounded-xl shadow-sm text-xs transition-all cursor-pointer">
            <UploadCloud className="w-4 h-4 text-teal-700" /> Bulk Import
          </button>
          <button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="bg-teal-800 hover:bg-teal-900 text-white px-3 md:px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-md transition-all text-xs cursor-pointer">
            <Plus className="w-4 h-4" /> + Tambah
          </button>
        </div>
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-teal-900/5 text-teal-800 text-sm">
            <tr>
              <th className="p-4 font-semibold w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={data.length > 0 && selectedIds.length === data.length} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Pelanggaran</th>
              <th className="p-4 font-semibold">Masa Perbaikan</th>
              <th className="p-4 font-semibold">Poin</th>
              <th className="p-4 font-semibold">Credit Perform</th>
              <th className="p-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-900/5">
            {loading ? <tr><td colSpan="10" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" /></td></tr> : data.map((row, i) => (
              <tr key={i} className="hover:bg-white/40">
                <td className="p-4 text-center"><input type="checkbox" onChange={(e) => handleSelectOne(row.id, e.target.checked)} checked={selectedIds.includes(row.id)} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></td>
                <td className="p-4 text-sm text-teal-900">{row.kategori}</td>
                <td className="p-4 text-sm text-teal-900">{row.detail_pelanggaran}</td>
                <td className="p-4 text-sm text-teal-900">{row.masa_perbaikan}</td>
                <td className="p-4 text-sm text-teal-900">{row.poin}</td>
                <td className="p-4 text-sm text-teal-900">{row.credit_perform}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setFormData(row); setIsModalOpen(true); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(row.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" /></div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-teal-800/60 font-medium bg-white/40 rounded-2xl">Belum ada data sanksi.</div>
        ) : (
          data.map((row, i) => {
            const isSelected = selectedIds.includes(row.id);
            return (
              <div key={i} className={`p-3.5 rounded-2xl border transition-all bg-white/90 backdrop-blur-md shadow-xs space-y-2.5 ${isSelected ? 'border-teal-500 bg-teal-50/40' : 'border-slate-200/80'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(row.id, e.target.checked)} 
                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      {row.kategori}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setFormData(row); setIsModalOpen(true); }} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <p className="font-bold text-teal-950 text-sm">{row.detail_pelanggaran}</p>

                <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Masa: <strong>{row.masa_perbaikan || '-'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600 font-bold">Poin: {row.poin}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">Credit: <strong>{row.credit_perform || '-'}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/20 backdrop-blur-sm p-4 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-teal-950">{formData.id ? 'Edit' : 'Tambah'} Sanksi</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-teal-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Kategori</label>
                <input type="text" required value={formData.kategori || ''} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Pelanggaran</label>
                <input type="text" required value={formData.detail_pelanggaran || ''} onChange={e => setFormData({...formData, detail_pelanggaran: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Masa Perbaikan</label>
                <input type="text" required value={formData.masa_perbaikan || ''} onChange={e => setFormData({...formData, masa_perbaikan: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Poin</label>
                <input type="text" required value={formData.poin || ''} onChange={e => setFormData({...formData, poin: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Credit Perform</label>
                <input type="text" required value={formData.credit_perform || ''} onChange={e => setFormData({...formData, credit_perform: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan</button>
            </form>
          </div>
        </div>
      )}

      <CsvImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={fetchData} 
        endpoint="sanksi" 
        templateHeaders={["kategori","detail_pelanggaran","masa_perbaikan","poin","credit_perform"]} 
        templateFileName="template_sanksi.csv" 
      />

      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        onConfirm={confirmConfig?.onConfirm}
      />
    </div>
  );
}