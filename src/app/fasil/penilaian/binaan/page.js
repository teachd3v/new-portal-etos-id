"use client";
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Lock,
  ShieldAlert
} from 'lucide-react';
import MonitoringDetailModal from '@/components/admin/dashboard/MonitoringDetailModal';
import { toast } from 'react-hot-toast';

const MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

export default function FasilMonitoringBinaanPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [bulan, setBulan] = useState(MONTH_OPTIONS[now.getMonth()]);
  const [tahun, setTahun] = useState(now.getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sanksi Modal States
  const [selectedEtoserForSanksi, setSelectedEtoserForSanksi] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedPelanggaranId, setSelectedPelanggaranId] = useState('');
  const [sanksiKeterangan, setSanksiKeterangan] = useState('');
  const [submittingSanksi, setSubmittingSanksi] = useState(false);
  const [deletingSanksiId, setDeletingSanksiId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fasil/monitoring-binaan?bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (selectedEtoserForSanksi) {
          const updatedRow = (json.table || []).find(r => r.id === selectedEtoserForSanksi.id);
          if (updatedRow) setSelectedEtoserForSanksi(updatedRow);
        }
      } else {
        toast.error("Gagal memuat data monitoring binaan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, selectedEtoserForSanksi?.id]);

  useEffect(() => {
    fetchData();
  }, [bulan, tahun]);

  const openSanksiModal = (row) => {
    setSelectedEtoserForSanksi(row);
    setSelectedKategori('');
    setSelectedPelanggaranId('');
    setSanksiKeterangan('');
  };

  const closeSanksiModal = () => {
    setSelectedEtoserForSanksi(null);
    setSelectedKategori('');
    setSelectedPelanggaranId('');
    setSanksiKeterangan('');
  };

  const katalogSanksi = data?.katalogSanksi || [];
  const kategoriOptions = [...new Set(katalogSanksi.map(k => k.kategori).filter(Boolean))];
  const filteredPelanggaranOptions = selectedKategori
    ? katalogSanksi.filter(k => k.kategori === selectedKategori)
    : katalogSanksi;
  const chosenCatalogItem = katalogSanksi.find(k => k.id === selectedPelanggaranId) || null;
  const isPeriodOpen = !!data?.schedule?.isOpen;

  const handleAddSanksi = async (e) => {
    e.preventDefault();
    if (!selectedEtoserForSanksi) return;
    if (!selectedPelanggaranId) {
      toast.error("Silakan pilih jenis pelanggaran terlebih dahulu.");
      return;
    }

    setSubmittingSanksi(true);
    try {
      const res = await fetch('/api/fasil/monitoring-binaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedEtoserForSanksi.id,
          katalog_sanksi_id: selectedPelanggaranId,
          keterangan: sanksiKeterangan,
          period_month: bulan,
          period_year: tahun
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Usulan sanksi berhasil disimpan!");
        setSelectedPelanggaranId('');
        setSanksiKeterangan('');
        await fetchData();
      } else {
        toast.error(json.error || "Gagal menyimpan usulan sanksi");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingSanksi(false);
    }
  };

  const handleDeleteSanksi = async (sanksiId) => {
    setDeletingSanksiId(sanksiId);
    try {
      const res = await fetch(`/api/fasil/monitoring-binaan?id=${encodeURIComponent(sanksiId)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Data sanksi berhasil dihapus");
        await fetchData();
      } else {
        toast.error(json.error || "Gagal menghapus sanksi");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setDeletingSanksiId(null);
    }
  };

  const filteredTable = (data?.table || []).filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) || row.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'sudah' 
        ? row.hasSubmitted 
        : statusFilter === 'belum'
          ? !row.hasSubmitted
          : statusFilter === 'sanksi'
            ? (row.sanksiList?.length || 0) > 0
            : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="min-w-0 w-full">
            <h1 className="text-[13.5px] sm:text-lg md:text-3xl font-black tracking-tight mb-0.5 md:mb-2 drop-shadow-sm flex items-center gap-2 md:gap-3 whitespace-nowrap">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 text-orange-200 shrink-0" />
              <span>Monitoring Bulanan & Sanksi Binaan</span>
            </h1>
            <p className="text-orange-100/90 font-medium text-xs md:text-base max-w-2xl hidden md:block">
              Pantau kepatuhan evaluasi bulanan serta input usulan sanksi & pemotongan credit point Etoser di wilayah binaanmu.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3.5 md:gap-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="p-2.5 md:p-3.5 bg-orange-500/30 rounded-xl">
              <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-orange-200 font-bold uppercase tracking-wider">Sudah Mengisi</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                {data?.stats?.sudahMengisi || 0} <span className="text-sm md:text-lg text-orange-200">/ {data?.stats?.totalBinaan || 0}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {/* Period Status Banner for Sanksi Input */}
      {data?.schedule && (
        <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs ${
          isPeriodOpen
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-start sm:items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isPeriodOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isPeriodOpen ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <Lock className="w-4 h-4 md:w-5 md:h-5" />}
            </div>
            <div>
              <p className="text-xs md:text-sm font-black">
                {isPeriodOpen ? 'Periode Input Sanksi Bulanan Dibuka' : 'Periode Input Sanksi Bulanan Terkunci'}
              </p>
              <p className="text-[11px] md:text-xs opacity-80 font-medium mt-0.5">
                {data.schedule.message}
              </p>
            </div>
          </div>
          <span className={`text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            isPeriodOpen ? 'bg-emerald-600 text-white' : 'bg-amber-200/80 text-amber-900'
          }`}>
            Jadwal: Tgl {data.schedule.start} – {data.schedule.end}
          </span>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-wrap gap-2.5 md:gap-4 shadow-sm items-center">
        
        {/* Month & Year Select */}
        <div className="flex items-center gap-2 bg-orange-50/60 border border-orange-200/60 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
          <select 
            value={bulan} 
            onChange={(e) => setBulan(e.target.value)} 
            className="bg-transparent text-xs md:text-sm font-bold text-orange-950 focus:outline-none cursor-pointer"
          >
            {MONTH_OPTIONS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)} 
            className="bg-transparent text-xs md:text-sm font-bold text-orange-950 focus:outline-none cursor-pointer border-l border-orange-200/60 pl-2"
          >
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="py-1.5 md:py-2 px-3 md:px-4 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-bold"
        >
          <option value="all">Semua Status</option>
          <option value="sudah">Sudah Mengisi</option>
          <option value="belum">Belum Mengisi</option>
          <option value="sanksi">Terkena Sanksi ({data?.stats?.etoserKenaSanksi || 0})</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama atau ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 md:py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
          />
        </div>

        {/* Badge */}
        <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold text-orange-900 flex items-center gap-1.5 w-full sm:w-auto">
          <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
          Wilayah: {data?.fasilInfo?.wilayah || '-'} • Periode: {bulan} {tahun}
        </div>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Total Binaan</span>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{data?.stats?.totalBinaan || 0}</p>
        </div>
        <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-emerald-700 uppercase">Sudah Mengisi</span>
          <p className="text-2xl md:text-3xl font-black text-emerald-900">{data?.stats?.sudahMengisi || 0} <span className="text-xs md:text-sm font-bold text-emerald-700">({data?.stats?.persentase || 0}%)</span></p>
        </div>
        <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-amber-700 uppercase">Belum Mengisi</span>
          <p className="text-2xl md:text-3xl font-black text-amber-900">{data?.stats?.belumMengisi || 0}</p>
        </div>
        <div className="bg-orange-50/80 backdrop-blur-md border border-orange-200 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-orange-700 uppercase">Rata-rata Skor</span>
          <p className="text-2xl md:text-3xl font-black text-orange-950">{data?.stats?.rataRataSkor ? `${data.stats.rataRataSkor} / 4.00` : '-'}</p>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-rose-50/80 backdrop-blur-md border border-rose-200 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-rose-700 uppercase">Etoser Kena Sanksi</span>
          <p className="text-2xl md:text-3xl font-black text-rose-900">
            {data?.stats?.etoserKenaSanksi || 0}
            <span className="text-xs font-bold text-rose-600 ml-1.5">({data?.stats?.totalKasusSanksi || 0} kasus)</span>
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm">
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-black text-slate-900">Daftar Hasil Monitoring & Usulan Sanksi Binaan</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rincian pengisian monitoring mandiri dan pencatatan poin sanksi/potongan uang saku periode {bulan} {tahun}.
          </p>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-orange-600 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Memuat data binaan...</p>
            </div>
          ) : filteredTable.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-100 text-xs">
              Tidak ada data etoser binaan ditemukan.
            </div>
          ) : (
            filteredTable.map((row, i) => {
              const sanksiCount = row.sanksiList?.length || 0;
              return (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{row.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{row.id} &bull; Angkatan {row.angkatan}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{row.universitas !== '-' ? row.universitas : 'Universitas -'}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {row.hasSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Sudah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          <Clock className="w-3 h-3" /> Belum
                        </span>
                      )}
                      {sanksiCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                          <AlertTriangle className="w-2.5 h-2.5" /> {row.totalPoinSanksi} Poin ({row.totalCreditDeduction})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Rata-rata Skor:</span>
                      {row.avgScore !== null ? (
                        <span className="font-black text-orange-950 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md text-xs inline-block mt-0.5">
                          {row.avgScore.toFixed(2)} / 4.00
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openSanksiModal(row)}
                        className={`inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl transition-all text-xs active:scale-95 cursor-pointer border ${
                          sanksiCount > 0
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{sanksiCount > 0 ? `Sanksi (${sanksiCount})` : '+ Sanksi'}</span>
                      </button>

                      {row.hasSubmitted && row.reportId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReportId(row.reportId);
                            setShowDetailModal(true);
                          }}
                          className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs shadow-sm shadow-orange-600/20 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Jawaban
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-black">Etoser & ID</th>
                <th className="p-4 font-black">Angkatan / Kampus</th>
                <th className="p-4 font-black text-center">Status Monev</th>
                <th className="p-4 font-black text-center">Rata-rata Skor</th>
                <th className="p-4 font-black">Variabel Isian</th>
                <th className="p-4 font-black text-center">Sanksi & Credit Perform</th>
                <th className="p-4 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-orange-600">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTable.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Tidak ada data etoser binaan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTable.map((row, i) => {
                  const sanksiCount = row.sanksiList?.length || 0;
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.id}</div>
                      </td>

                      <td className="p-4 font-semibold text-slate-600">
                        <div>Angkatan {row.angkatan}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{row.universitas !== '-' ? row.universitas : 'Universitas -'}</div>
                      </td>

                      <td className="p-4 text-center">
                        {row.hasSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Mengisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <Clock className="w-3.5 h-3.5" /> Belum Mengisi
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {row.avgScore !== null ? (
                          <span className="font-black text-orange-950 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg text-sm">
                            {row.avgScore.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        {row.hasSubmitted && row.variableScores && Object.keys(row.variableScores).length > 0 ? (
                          <div className="flex gap-1.5 flex-wrap max-w-xs">
                            {Object.entries(row.variableScores).map(([k, v]) => (
                              <span key={k} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                {k}: <span className="text-orange-700 font-black">{v}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {sanksiCount > 0 ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5" /> {row.totalPoinSanksi} Poin ({sanksiCount} Kasus)
                            </span>
                            <span className="text-[10px] font-bold text-rose-600">
                              Potongan Credit: {row.totalCreditDeduction}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Tidak ada</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openSanksiModal(row)}
                            className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition-colors text-xs shadow-xs cursor-pointer ${
                              sanksiCount > 0
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>{sanksiCount > 0 ? `Kelola Sanksi (${sanksiCount})` : 'Input Sanksi'}</span>
                          </button>

                          {row.hasSubmitted && row.reportId && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReportId(row.reportId);
                                setShowDetailModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-xl border border-orange-200 transition-colors text-xs shadow-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Jawaban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sanksi Input & Detail Modal */}
      {selectedEtoserForSanksi && typeof document !== 'undefined' && createPortal(
        <div
          onClick={closeSanksiModal}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-600 to-orange-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg shrink-0">
                  {selectedEtoserForSanksi.name?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black truncate">{selectedEtoserForSanksi.name}</h3>
                  <p className="text-[11px] sm:text-xs text-rose-100 font-medium truncate">
                    {selectedEtoserForSanksi.id} • Angkatan {selectedEtoserForSanksi.angkatan} • Periode {bulan} {tahun}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSanksiModal}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Pelanggaran</span>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {selectedEtoserForSanksi.sanksiList?.length || 0} Kasus
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-rose-600 uppercase block">Total Poin Sanksi</span>
                  <p className="text-lg sm:text-xl font-black text-rose-700 mt-0.5">
                    {selectedEtoserForSanksi.totalPoinSanksi || 0} Poin
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Potongan Credit</span>
                  <p className="text-lg sm:text-xl font-black text-amber-900 mt-0.5">
                    {selectedEtoserForSanksi.totalCreditDeduction || '0%'}
                  </p>
                </div>
              </div>

              {/* Existing Sanctions List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Riwayat Pelanggaran Bulan {bulan} {tahun}
                </h4>

                {selectedEtoserForSanksi.sanksiList && selectedEtoserForSanksi.sanksiList.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedEtoserForSanksi.sanksiList.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/40 flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                              {item.kategori}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-700">
                              {item.poin} Poin
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Credit Perform: {item.credit_perform}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Masa Perbaikan: {item.masa_perbaikan}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {item.detail_pelanggaran}
                          </p>
                          {item.keterangan && (
                            <p className="text-xs text-slate-600 italic bg-white/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60">
                              Catatan: "{item.keterangan}"
                            </p>
                          )}
                        </div>

                        {isPeriodOpen && (
                          <button
                            type="button"
                            disabled={deletingSanksiId === item.id}
                            onClick={() => handleDeleteSanksi(item.id)}
                            className="p-2 rounded-xl bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                            title="Hapus Sanksi"
                          >
                            {deletingSanksiId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500 font-medium">
                    Belum ada pelanggaran/sanksi tercatat untuk Etoser ini pada periode {bulan} {tahun}.
                  </div>
                )}
              </div>

              {/* Add Sanction Form (Only when Period is Open) */}
              {isPeriodOpen ? (
                <form onSubmit={handleAddSanksi} className="space-y-4 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-rose-600" />
                    Tambah Usulan Sanksi Baru ({bulan} {tahun})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Filter Kategori</label>
                      <select
                        value={selectedKategori}
                        onChange={(e) => {
                          setSelectedKategori(e.target.value);
                          setSelectedPelanggaranId('');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      >
                        <option value="">Semua Kategori ({katalogSanksi.length})</option>
                        {kategoriOptions.map((kat) => (
                          <option key={kat} value={kat}>{kat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jenis Pelanggaran *</label>
                      <select
                        required
                        value={selectedPelanggaranId}
                        onChange={(e) => setSelectedPelanggaranId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      >
                        <option value="">-- Pilih Detail Pelanggaran --</option>
                        {filteredPelanggaranOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            [{item.poin} Poin | {item.credit_perform}] {item.detail_pelanggaran}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {chosenCatalogItem && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-1.5 text-xs">
                      <p className="font-bold text-amber-950">{chosenCatalogItem.detail_pelanggaran}</p>
                      <div className="flex flex-wrap gap-3 text-[11px] font-bold text-amber-900 pt-1">
                        <span>Kategori: <strong>{chosenCatalogItem.kategori}</strong></span>
                        <span>•</span>
                        <span className="text-rose-700">Bobot: <strong>{chosenCatalogItem.poin} Poin</strong></span>
                        <span>•</span>
                        <span className="text-rose-700">Potongan Uang Saku (Credit Perform): <strong>{chosenCatalogItem.credit_perform}</strong></span>
                        <span>•</span>
                        <span>Masa Perbaikan: <strong>{chosenCatalogItem.masa_perbaikan}</strong></span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan / Catatan Kronologi (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={sanksiKeterangan}
                      onChange={(e) => setSanksiKeterangan(e.target.value)}
                      placeholder="Contoh: Tidak hadir pembinaan wilayah pekan ke-2 tanpa keterangan..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSanksi || !selectedPelanggaranId}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {submittingSanksi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Sanksi...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Simpan Usulan Sanksi
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">Input Sanksi Sedang Terkunci</p>
                    <p className="mt-0.5 opacity-90">
                      {data?.schedule?.message || 'Penambahan atau penghapusan sanksi hanya dapat dilakukan pada masa periode Monitoring Bulanan yang ditentukan Admin.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={closeSanksiModal}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      <MonitoringDetailModal
        reportId={selectedReportId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReportId(null);
        }}
      />

    </div>
  );
}
