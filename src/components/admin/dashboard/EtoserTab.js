"use client";
import { useState, useEffect } from 'react';
import { Search, Compass, AlertTriangle, FileText, UserCheck, Eye, Loader2, X, Users, ArrowRight } from 'lucide-react';
import StatCard from './StatCard';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

export default function EtoserTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayah, setWilayah] = useState('all');
  const [angkatan, setAngkatan] = useState('all');
  
  // Modal state
  const [showSanksiModal, setShowSanksiModal] = useState(false);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard/etoser?wilayah=${wilayah}&angkatan=${angkatan}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error("Gagal memuat data Etoser");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [wilayah, angkatan]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSanksiModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl text-xs">
          <p className="font-bold mb-1">{label}</p>
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-3 md:p-4 flex flex-wrap gap-2.5 md:gap-4 shadow-sm items-center">
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          <select value={wilayah} onChange={(e) => setWilayah(e.target.value)} className="flex-1 sm:flex-none py-2 md:py-2.5 px-3 md:px-4 bg-white/80 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-semibold shadow-sm">
            <option value="all">Semua Wilayah</option>
            <option value="Aceh">Aceh</option>
            <option value="Padang">Padang</option>
            <option value="Bogor">Bogor</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Makassar">Makassar</option>
          </select>

          <select value={angkatan} onChange={(e) => setAngkatan(e.target.value)} className="flex-1 sm:flex-none py-2 md:py-2.5 px-3 md:px-4 bg-white/80 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-semibold shadow-sm">
            <option value="all">Semua Angkatan</option>
            <option value="2023">Angkatan 2023</option>
            <option value="2024">Angkatan 2024</option>
            <option value="2025">Angkatan 2025</option>
            <option value="2026">Angkatan 2026</option>
          </select>
        </div>

        {data?.stats?.activePeriod && (
          <div className="w-full sm:w-auto sm:ml-auto bg-teal-50/80 border border-teal-200/80 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold text-teal-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            Periode: {data.stats.activePeriod.label || data.stats.activePeriod.kode_periode}
          </div>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Total Etoser" 
          value={data?.stats?.totalEtoser || 0} 
          unit="Etoser" 
          icon={Users} 
          color="teal" 
          loading={loading} 
        />
        <StatCard 
          title="Asesmen Mandiri" 
          value={data?.stats?.etoserMengisi || 0} 
          unit={`/ ${data?.stats?.totalEtoser || 0} Selesai`} 
          icon={FileText} 
          color="sky" 
          loading={loading} 
        />
        <StatCard 
          title="Asesmen Fasil" 
          value={data?.stats?.fasilMenilai || 0} 
          unit={`/ ${data?.stats?.totalEtoser || 0} Dinilai`} 
          icon={UserCheck} 
          color="indigo" 
          loading={loading} 
        />
        <StatCard 
          title="Sanksi Etoser" 
          value={data?.stats?.etoserKenaSanksi || 0} 
          unit="Pelanggaran" 
          icon={Eye} 
          color="rose" 
          loading={loading} 
          onClick={() => setShowSanksiModal(true)} 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[340px] md:min-h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Trend Rata-rata Skor RELI Nasional (T0 – T4)</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-semibold mt-0.5">Pertumbuhan kematangan kepemimpinan per periode pembinaan</p>
          </div>
          <div className="flex-1 w-full min-h-[260px] md:min-h-[280px] mt-4">
            {loading ? <div className="w-full h-full flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.charts?.trendIpk || []} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 4]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="ipk_rerata" name="Rata-rata RELI" stroke="#0d9488" strokeWidth={4} dot={{ r: 5, fill: '#0d9488' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[340px] md:min-h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Profil 4 Dimensi RELI</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-semibold mt-0.5">Rata-rata kohort aktif</p>
          </div>
          <div className="flex-1 w-full min-h-[280px] mt-2">
             {loading ? <div className="w-full h-full flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div> : (
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

      {/* Table Detail */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Detail Hasil Asesmen RELI Etoser</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">Pilih baris etoser untuk melihat rincian longitudinal & 64 butir instrumen.</p>
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
          ) : (
            (data?.table || [])
              .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((row, i) => (
                <div 
                  key={i} 
                  onClick={() => router.push(`/admin/etoser/${row.id}`)}
                  className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{row.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{row.wilayah} • Angkatan {row.angkatan}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl text-sm inline-block">
                        {row.finalReli !== null ? row.finalReli.toFixed(2) : '-'}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Skor RELI</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        row.hasSelf ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {row.hasSelf ? "Self ✓" : "Self -"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        row.hasFacil ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {row.hasFacil ? "Fasil ✓" : "Fasil -"}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.maturityLevel === 'Emerging Leader' ? 'bg-rose-100 text-rose-700' :
                      row.maturityLevel === 'Developing Leader' ? 'bg-amber-100 text-amber-700' :
                      row.maturityLevel === 'Transformative Leader' ? 'bg-sky-100 text-sky-700' :
                      row.maturityLevel === 'Resilient Leader' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {row.maturityLevel}
                    </span>
                  </div>
                </div>
              ))
          )}
          {data?.table?.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">Tidak ada data Etoser ditemukan.</div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-black">Nama PM & ID</th>
                <th className="p-4 font-black">Wilayah / Angkatan</th>
                <th className="p-4 font-black">Status Asesmen</th>
                <th className="p-4 font-black text-center">Value R.</th>
                <th className="p-4 font-black text-center">Self R.</th>
                <th className="p-4 font-black text-center">Social R.</th>
                <th className="p-4 font-black text-center">Change R.</th>
                <th className="p-4 font-black text-center">Final RELI</th>
                <th className="p-4 font-black text-center">Maturity Level</th>
                <th className="p-4 font-black text-center">Gap Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : data?.table?.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase())).map((row, i) => (
                <tr key={i} onClick={() => router.push(`/admin/etoser/${row.id}`)} className="border-b border-slate-50 hover:bg-teal-50/40 transition-colors cursor-pointer group">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">{row.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.id}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    {row.wilayah} <span className="text-slate-300 mx-1">•</span> {row.angkatan}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        row.hasSelf ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {row.hasSelf ? "Self ✓" : "Self -"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        row.hasFacil ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {row.hasFacil ? "Fasil ✓" : "Fasil -"}
                      </span>
                    </div>
                  </td>
                  
                  {/* 4 Dimension Scores */}
                  <td className="p-4 text-center font-bold text-slate-700">{row.variables?.['Value Resilience']?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{row.variables?.['Self Resilience']?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{row.variables?.['Social Resilience']?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{row.variables?.['Change Resilience']?.toFixed(2) || '0.00'}</td>

                  <td className="p-4 text-center">
                    <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-sm">
                      {row.finalReli !== null ? row.finalReli.toFixed(2) : '-'}
                    </span>
                  </td>
                  
                  <td className="p-4 text-center">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        row.maturityLevel === 'Emerging Leader' ? 'bg-rose-100 text-rose-700' :
                        row.maturityLevel === 'Developing Leader' ? 'bg-amber-100 text-amber-700' :
                        row.maturityLevel === 'Transformative Leader' ? 'bg-sky-100 text-sky-700' :
                        row.maturityLevel === 'Resilient Leader' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-500'
                     }`}>
                        {row.maturityLevel}
                     </span>
                  </td>

                  <td className="p-4 text-center">
                    {row.gapCategory ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        row.gapCategory === 'Selaras' ? 'bg-emerald-100 text-emerald-700' :
                        row.gapCategory === 'Perlu refleksi' ? 'bg-sky-100 text-sky-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {row.gapCategory}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {data?.table?.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-medium">Tidak ada data Etoser ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sanksi Modal */}
      {showSanksiModal && (
        <div onClick={() => setShowSanksiModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col cursor-default">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-rose-950">Daftar Sanksi Etoser</h2>
                  <p className="text-rose-800/70 text-sm font-medium">Detail usulan pelanggaran & sanksi.</p>
                </div>
              </div>
              <button onClick={() => setShowSanksiModal(false)} className="p-2 hover:bg-rose-100 rounded-full text-rose-400 hover:text-rose-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-700 text-sm">
                    <tr>
                      <th className="p-4 font-semibold">Nama & ID</th>
                      <th className="p-4 font-semibold">Wilayah / Angkatan</th>
                      <th className="p-4 font-semibold">Poin</th>
                      <th className="p-4 font-semibold">Keterangan</th>
                      <th className="p-4 font-semibold">Daftar Pelanggaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.sanksiTable && data.sanksiTable.length > 0 ? (
                      data.sanksiTable.map((s, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{s.etoserName}</div>
                            <div className="text-xs font-mono text-slate-500">{s.etoserId}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 font-medium">
                            {s.wilayah} • Angkatan {s.angkatan}
                          </td>
                          <td className="p-4">
                            <span className="font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                              {s.poin} Poin
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={s.keterangan}>
                            {s.keterangan}
                          </td>
                          <td className="p-4 text-sm text-slate-800 font-semibold">
                            {s.pelanggaran}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-500">
                          <AlertTriangle className="w-12 h-12 text-rose-200 mx-auto mb-3" />
                          <p className="font-medium">Belum ada data sanksi tercatat.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


