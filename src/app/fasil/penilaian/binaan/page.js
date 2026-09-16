"use client";
import { useState, useEffect } from 'react';
import { Users, FileText, Search, Loader2, CheckCircle2, Clock, Eye, Calendar, Award, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/fasil/monitoring-binaan?bulan=${bulan}&tahun=${tahun}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error("Gagal memuat data monitoring binaan");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [bulan, tahun]);

  const filteredTable = (data?.table || []).filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) || row.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'sudah' 
        ? row.hasSubmitted 
        : !row.hasSubmitted;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-orange-200 bg-orange-950/60 border border-orange-400/30 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full">
              Fasilitator Wilayah {data?.fasilInfo?.wilayah || ''}
            </span>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 mt-1 md:mt-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <FileText className="w-7 h-7 md:w-10 md:h-10 text-orange-200" />
              Monitoring Bulanan Etoser Binaan
            </h1>
            <p className="text-orange-100/90 font-medium text-xs md:text-lg max-w-xl hidden md:block">
              Pantau kepatuhan dan capaian evaluasi mandiri rutin bulanan Etoser di wilayah binaanmu.
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

      {/* Filter and Stats Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-wrap gap-3 md:gap-4 shadow-sm items-center">
        
        {/* Month & Year Select */}
        <div className="flex items-center gap-2 bg-orange-50/60 border border-orange-200/60 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-orange-600" />
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
          className="py-1.5 md:py-2.5 px-3 md:px-4 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="sudah">Sudah Mengisi</option>
          <option value="belum">Belum Mengisi</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-3.5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Total Binaan</span>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{data?.stats?.totalBinaan || 0}</p>
        </div>
        <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 p-3.5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-emerald-700 uppercase">Sudah Mengisi</span>
          <p className="text-2xl md:text-3xl font-black text-emerald-900">{data?.stats?.sudahMengisi || 0} <span className="text-xs md:text-sm font-bold text-emerald-700">({data?.stats?.persentase || 0}%)</span></p>
        </div>
        <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200 p-3.5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-amber-700 uppercase">Belum Mengisi</span>
          <p className="text-2xl md:text-3xl font-black text-amber-900">{data?.stats?.belumMengisi || 0}</p>
        </div>
        <div className="bg-orange-50/80 backdrop-blur-md border border-orange-200 p-3.5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] md:text-xs font-bold text-orange-700 uppercase">Rata-rata Skor</span>
          <p className="text-2xl md:text-3xl font-black text-orange-950">{data?.stats?.rataRataSkor ? `${data.stats.rataRataSkor} / 4.00` : '-'}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm">
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-black text-slate-900">Daftar Hasil Monitoring Etoser Binaan</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rincian pengisian monitoring mandiri bulanan periode {bulan} {tahun}.
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
            filteredTable.map((row, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{row.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{row.id} &bull; Angkatan {row.angkatan}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{row.universitas !== '-' ? row.universitas : 'Universitas -'}</p>
                  </div>
                  <div className="shrink-0">
                    {row.hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        <Clock className="w-3 h-3" /> Belum
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
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

                  {row.hasSubmitted && row.reportId ? (
                    <button
                      onClick={() => {
                        setSelectedReportId(row.reportId);
                        setShowDetailModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs shadow-sm shadow-orange-600/20 active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat Jawaban
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-black">Etoser & ID</th>
                <th className="p-4 font-black">Angkatan / Kampus</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center">Waktu Submit</th>
                <th className="p-4 font-black text-center">Rata-rata Skor</th>
                <th className="p-4 font-black">Variabel Isian</th>
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
                filteredTable.map((row, i) => (
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

                    <td className="p-4 text-center text-slate-600 font-medium">
                      {row.submittedAt 
                        ? new Date(row.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                        : '-'
                      }
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
                      {row.hasSubmitted && row.reportId ? (
                        <button
                          onClick={() => {
                            setSelectedReportId(row.reportId);
                            setShowDetailModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-xl border border-orange-200 transition-colors text-xs shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat Jawaban
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
