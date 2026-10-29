"use client";
import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, Clock, Eye, Loader2, Users, ArrowUpRight, BarChart2, Calendar } from 'lucide-react';
import StatCard from './StatCard';
import MonitoringDetailModal from './MonitoringDetailModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

export default function MonitoringBulananEtoser() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const now = new Date();
  const [bulan, setBulan] = useState(MONTH_OPTIONS[now.getMonth()]);
  const [tahun, setTahun] = useState(now.getFullYear().toString());
  const [wilayah, setWilayah] = useState('all');
  const [angkatan, setAngkatan] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/monitoring/bulanan?type=etoser&bulan=${bulan}&tahun=${tahun}&wilayah=${wilayah}&angkatan=${angkatan}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error("Gagal memuat data monitoring bulanan etoser");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [bulan, tahun, wilayah, angkatan]);

  const filteredTable = (data?.table || []).filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) || row.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'sudah' 
        ? row.hasSubmitted 
        : !row.hasSubmitted;
    return matchesSearch && matchesStatus;
  });

  const variablesList = data?.charts?.variables || ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl text-xs">
          <p className="font-bold mb-1">{payload[0]?.payload?.fullMonth || label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }} className="font-semibold">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const navigateToEtoserDetail = (etoserId) => {
    router.push(`/admin/etoser/${etoserId}?mode=monitoring&bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Filters Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex flex-wrap gap-4 shadow-sm items-center">
        
        {/* Month & Year Select */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-teal-600" />
          <select 
            value={bulan} 
            onChange={(e) => setBulan(e.target.value)} 
            className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {MONTH_OPTIONS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)} 
            className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
          >
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Wilayah Select */}
        <select 
          value={wilayah} 
          onChange={(e) => setWilayah(e.target.value)} 
          className="py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
        >
          <option value="all">Semua Wilayah</option>
          <option value="Aceh">Aceh</option>
          <option value="Padang">Padang</option>
          <option value="Bogor">Bogor</option>
          <option value="Jakarta">Jakarta</option>
          <option value="Makassar">Makassar</option>
        </select>

        {/* Angkatan Select */}
        <select 
          value={angkatan} 
          onChange={(e) => setAngkatan(e.target.value)} 
          className="py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
        >
          <option value="all">Semua Angkatan</option>
          <option value="2023">Angkatan 2023</option>
          <option value="2024">Angkatan 2024</option>
          <option value="2025">Angkatan 2025</option>
          <option value="2026">Angkatan 2026</option>
        </select>

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="sudah">Sudah Mengisi</option>
          <option value="belum">Belum Mengisi</option>
        </select>

        {/* Active Badge */}
        <div className="ml-auto bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-xs font-bold text-teal-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
          Periode Monitoring: {bulan} {tahun}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Total Etoser" 
          value={data?.stats?.totalUsers || 0} 
          unit="Etoser" 
          icon={Users} 
          color="teal" 
          loading={loading} 
        />
        <StatCard 
          title="Sudah Mengisi" 
          value={data?.stats?.sudahMengisi || 0} 
          unit={`(${data?.stats?.persentase || 0}%)`} 
          icon={CheckCircle2} 
          color="emerald" 
          loading={loading} 
        />
        <StatCard 
          title="Belum Mengisi" 
          value={data?.stats?.belumMengisi || 0} 
          unit="Etoser" 
          icon={Clock} 
          color="amber" 
          loading={loading} 
        />
        <StatCard 
          title="Rata-rata Skor Nasional" 
          value={data?.stats?.rataRataSkor || '-'} 
          unit={data?.stats?.rataRataSkor ? "/ 4.00" : ""} 
          icon={BarChart2} 
          color="sky" 
          loading={loading} 
        />
      </div>

      {/* Charts Section (Same layout as RELI Etoser) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[340px] md:min-h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Trend Rata-rata Skor Monitoring Bulanan ({tahun})</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-semibold mt-0.5">Perkembangan rerata skor evaluasi mandiri Etoser setiap periode bulan</p>
          </div>
          <div className="flex-1 w-full min-h-[260px] md:min-h-[280px] mt-4">
            {loading ? (
              <div className="w-full h-full flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.charts?.trendBulanan || []} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 4]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="skor_rerata" name="Rata-rata Skor Monitoring" stroke="#0d9488" strokeWidth={4} dot={{ r: 5, fill: '#0d9488' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[340px] md:min-h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Sebaran 4 Variabel Monitoring</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-semibold mt-0.5">Rata-rata kohort periode {bulan} {tahun}</p>
          </div>
          <div className="flex-1 w-full min-h-[280px] mt-2">
            {loading ? (
              <div className="w-full h-full flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data?.charts?.sebaranVariabel || []}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                  <Radar name="Skor Rata-rata" dataKey="A" stroke="#0d9488" fill="#0d9488" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Rekap Isian Monitoring Bulanan Etoser</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              Klik nama atau baris Etoser untuk melihat rincian grafik longitudinal, radar 4 variabel & butir instrumen periode {bulan} {tahun}.
            </p>
          </div>
          
          <div className="relative w-full md:w-auto min-w-[240px] md:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama atau ID Etoser..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
            />
          </div>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : filteredTable.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">Tidak ada data Etoser ditemukan.</div>
          ) : (
            filteredTable.map((row, i) => (
              <div
                key={i}
                onClick={() => navigateToEtoserDetail(row.id)}
                className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2.5 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm hover:text-teal-700 transition-colors">{row.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{row.wilayah} • Angkatan {row.angkatan}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {row.hasSubmitted ? (
                      <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl text-xs inline-block">
                        {row.avgScore !== null ? `${row.avgScore.toFixed(2)}` : '-'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">-</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {row.hasSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" /> Belum
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-xs">
                    Lihat Detail <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
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
                <th className="p-4 font-black">Wilayah / Angkatan</th>
                <th className="p-4 font-black text-center">Status Laporan</th>
                {variablesList.map((vName) => (
                  <th key={vName} className="p-4 font-black text-center">{vName}</th>
                ))}
                <th className="p-4 font-black text-center">Rata-rata Skor</th>
                <th className="p-4 font-black text-center">Waktu Submit</th>
                <th className="p-4 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6 + variablesList.length} className="p-8 text-center text-teal-600">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTable.length === 0 ? (
                <tr>
                  <td colSpan={6 + variablesList.length} className="p-8 text-center text-slate-500 font-medium">
                    Tidak ada data Etoser ditemukan untuk periode dan filter ini.
                  </td>
                </tr>
              ) : (
                filteredTable.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => navigateToEtoserDetail(row.id)}
                    className="border-b border-slate-50 hover:bg-teal-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">{row.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.id}</div>
                    </td>
                    
                    <td className="p-4 font-semibold text-slate-600">
                      {row.wilayah} <span className="text-slate-300 mx-1">•</span> {row.angkatan}
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

                    {variablesList.map((vName) => (
                      <td key={vName} className="p-4 text-center font-bold text-slate-700">
                        {row.variableScores?.[vName] !== undefined ? Number(row.variableScores[vName]).toFixed(2) : '-'}
                      </td>
                    ))}

                    <td className="p-4 text-center">
                      {row.avgScore !== null ? (
                        <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-sm">
                          {row.avgScore.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </td>

                    <td className="p-4 text-center text-slate-600 font-medium">
                      {row.submittedAt 
                        ? new Date(row.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                        : '-'
                      }
                    </td>

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigateToEtoserDetail(row.id)}
                          className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" /> Detail
                        </button>
                        {row.hasSubmitted && row.reportId && (
                          <button
                            onClick={() => {
                              setSelectedReportId(row.reportId);
                              setShowDetailModal(true);
                            }}
                            className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1.5 rounded-xl border border-teal-200 transition-colors text-xs cursor-pointer"
                            title="Ringkasan Cepat"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
