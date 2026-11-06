"use client";

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Award,
  Users,
  FileCheck2,
  Sparkles,
  FileDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportFasilCvPdf } from '@/lib/exportFasilCvPdf';

const FASIL_CATEGORIES = [
  'Sertifikasi & Lisensi',
  'Pengalaman Fasilitasi / Mentor',
  'Proyek & Karya Profesional',
  'Penghargaan Profesional',
];

export default function FasilPortofolioPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [exportingCv, setExportingCv] = useState(false);

  // Form State
  const [kategori, setKategori] = useState('Sertifikasi & Lisensi');
  const [judulKarya, setJudulKarya] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [deskripsi, setDeskripsi] = useState('');
  const [linkBukti, setLinkBukti] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fasil/portofolio');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data portofolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCv = async () => {
    setExportingCv(true);
    try {
      const res = await fetch('/api/fasil/cv-data');
      if (!res.ok) {
        throw new Error('Gagal mengambil data profil');
      }
      const cvPayload = await res.json();
      if (!cvPayload.success) {
        throw new Error(cvPayload.error || 'Data profil tidak lengkap');
      }

      await exportFasilCvPdf(cvPayload);
      toast.success('Curriculum Vitae Mitra berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengekspor CV');
    } finally {
      setExportingCv(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judulKarya.trim() || !tahun) {
      toast.error('Judul portofolio dan tahun wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/fasil/portofolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori,
          judul_karya: judulKarya,
          tahun,
          deskripsi_singkat: deskripsi,
          link_bukti: linkBukti,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setShowForm(false);
        setJudulKarya('');
        setDeskripsi('');
        setLinkBukti('');
        setTahun(new Date().getFullYear().toString());
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch (error) {
      toast.error('Gagal menyimpan portofolio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/fasil/portofolio/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Portofolio dihapus.');
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch (error) {
      toast.error('Gagal menghapus portofolio.');
    }
  };

  const getKategoriIcon = (kat) => {
    switch (kat) {
      case 'Sertifikasi & Lisensi':
        return <FileCheck2 className="w-5 h-5 text-amber-600" />;
      case 'Pengalaman Fasilitasi / Mentor':
        return <Users className="w-5 h-5 text-orange-600" />;
      case 'Penghargaan Profesional':
        return <Award className="w-5 h-5 text-emerald-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-600" />;
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 md:space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#C2410C] rounded-2xl md:rounded-[2.25rem] p-4 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="min-w-0 w-full">
            <h1 className="text-base sm:text-lg md:text-2xl font-black tracking-tight mb-1 drop-shadow-sm flex items-center gap-2">
              <Briefcase className="w-5 h-5 md:w-7 md:h-7 shrink-0 text-amber-200" />
              <span>Portofolio Profesional</span>
            </h1>
            <p className="text-orange-100 font-medium text-xs md:text-sm max-w-xl">
              Rekam jejak kompetensi, sertifikasi, serta pengalaman fasilitasi profesional Anda sebagai mitra program.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleExportCv}
              disabled={exportingCv}
              className="flex-1 md:flex-none justify-center bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer disabled:opacity-50"
            >
              {exportingCv ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Export CV Mitra</span>
            </button>

            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex-1 md:flex-none justify-center bg-white text-orange-800 hover:bg-orange-50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer"
            >
              {showForm ? (
                'Batal'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baru</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="absolute -right-12 -top-12 w-72 h-72 bg-amber-300/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Form Tambah Portofolio */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm border border-orange-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-base md:text-xl font-black text-slate-800 mb-4">
            Tambah Rekam Jejak Profesional
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-700">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {FASIL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-700">
                  Judul Portofolio / Lisensi / Peran
                </label>
                <input
                  type="text"
                  required
                  value={judulKarya}
                  onChange={(e) => setJudulKarya(e.target.value)}
                  placeholder="Contoh: Certified Human Resource Professional (CHRP) / Mentor Inkubasi Bisnis"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-700">Tahun</label>
                <input
                  type="number"
                  required
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-700">
                  Link Bukti / Sertifikat (Opsional)
                </label>
                <input
                  type="url"
                  value={linkBukti}
                  onChange={(e) => setLinkBukti(e.target.value)}
                  placeholder="https://drive.google.com/... atau tautan verifikasi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-bold text-slate-700">
                Deskripsi Singkat / Lembaga Penerbit
              </label>
              <textarea
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan institusi penerbit, ruang lingkup peran fasilitasi, atau dampak dari proyek..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-xs md:text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 text-xs md:text-sm cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Portofolio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Portofolio */}
      {data.length === 0 && !showForm ? (
        <div className="bg-white/70 backdrop-blur-md border border-orange-100 p-8 md:p-12 rounded-2xl md:rounded-[2rem] shadow-sm text-center">
          <Briefcase className="w-12 h-12 md:w-14 md:h-14 text-orange-200 mx-auto mb-3" />
          <h3 className="text-base md:text-lg font-bold text-slate-800">
            Belum Ada Portofolio Profesional
          </h3>
          <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-md mx-auto">
            Tambahkan sertifikasi, pengalaman mentoring, atau karya profesional Anda untuk melengkapi profil mitra.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-orange-100 text-orange-800 px-5 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 hover:bg-orange-200 transition-colors text-xs md:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Portofolio Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    {getKategoriIcon(item.kategori)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] md:text-xs font-bold text-orange-800/80 uppercase tracking-wider block truncate">
                      {item.kategori} &bull; {item.tahun}
                    </span>
                    <h3
                      className="text-sm md:text-base font-black text-slate-900 truncate"
                      title={item.judul_karya}
                    >
                      {item.judul_karya}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                  title="Hapus Portofolio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-600 text-xs md:text-sm mb-4 flex-1 line-clamp-3">
                {item.deskripsi_singkat || (
                  <span className="italic text-slate-400">Tidak ada deskripsi.</span>
                )}
              </p>

              {item.link_bukti && (
                <div className="pt-3 border-t border-slate-100 mt-auto">
                  <a
                    href={item.link_bukti}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lihat Bukti / Tautan
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
