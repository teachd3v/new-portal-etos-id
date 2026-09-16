"use client";
import { useState, useEffect } from 'react';
import { Search, FileText, UserCheck, Loader2 } from 'lucide-react';
import StatCard from './StatCard';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export default function FasilTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayah, setWilayah] = useState('all');
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard/fasil?wilayah=${wilayah}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error("Gagal memuat data Fasil");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [wilayah]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-xl">
          <p className="font-bold text-teal-900 mb-2">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }} className="text-sm font-medium">
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
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-4 flex flex-wrap gap-4 shadow-sm items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama Fasilitator..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
          />
        </div>
        
        <select value={wilayah} onChange={(e) => setWilayah(e.target.value)} className="py-2.5 px-4 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-semibold shadow-sm">
          <option value="all">Semua Wilayah</option>
          <option value="Aceh">Aceh</option>
          <option value="Padang">Padang</option>
          <option value="Bogor">Bogor</option>
          <option value="Jakarta">Jakarta</option>
          <option value="Makassar">Makassar</option>
        </select>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <StatCard 
          title="Total Fasilitator" 
          value={data?.stats?.totalFasil || 0} 
          unit="Fasilitator" 
          icon={FileText} 
          color="teal" 
          loading={loading} 
        />
        <StatCard 
          title="Fasil Lapor Mandiri" 
          value={data?.stats?.fasilMengisiMandiri || 0} 
          unit={`/ ${data?.stats?.totalFasil || 0} Selesai`} 
          icon={FileText} 
          color="sky" 
          loading={loading} 
        />
        <StatCard 
          title="Fasil Menilai Binaan" 
          value={data?.stats?.fasilMenilaiEtoser || 0} 
          unit={`/ ${data?.stats?.totalFasil || 0} Selesai`} 
          icon={UserCheck} 
          color="indigo" 
          loading={loading} 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[340px] md:min-h-[400px] flex flex-col">
          <h3 className="text-base md:text-xl font-black text-slate-900 mb-1">Rata-rata Skor Fasil (Per Wilayah & Nama)</h3>
          <p className="text-[11px] md:text-xs text-slate-500 font-medium mb-4 md:mb-6">Performa evaluasi mandiri fasilitator aktif</p>
          <div className="flex-1 w-full min-h-0">
            {loading ? <div className="w-full h-full flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts?.skorFasilData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="skor" name="Rata-rata Skor" fill="#0d9488" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Table Detail Leaderboard */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">Leaderboard Fasilitator</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">Peringkat performa dan progres fasilitator</p>
          </div>
        </div>
        
        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            (data?.table || [])
              .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((row, i) => (
                <div 
                  key={i} 
                  onClick={() => router.push(`/admin/fasil/${row.id}`)}
                  className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={"inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shrink-0 " + (row.rank === 1 ? "bg-amber-400 text-amber-950" : row.rank === 2 ? "bg-slate-300 text-slate-800" : row.rank === 3 ? "bg-amber-600 text-white" : "bg-teal-100 text-teal-800")}>
                        {row.rank}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{row.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{row.role} • {row.wilayah}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg text-sm inline-block">
                        {row.rataSkor}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Progres Nilai Binaan</span>
                      <span>{row.progressPeer} ({row.peerDetail} PM)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-teal-600 h-2 rounded-full" style={{ width: row.progressPeer }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">Lapor Mandiri: <strong className="text-slate-700">{row.laporMandiri}</strong></span>
                    <span className={"text-[10px] font-bold px-2.5 py-0.5 rounded-full " + (row.status === 'Sangat Baik' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))
          )}
          {data?.table?.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">Tidak ada data Fasilitator ditemukan.</div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-black w-16 text-center">Rank</th>
                <th className="p-4 font-black">Nama & Role</th>
                <th className="p-4 font-black">Wilayah</th>
                <th className="p-4 font-black text-center">Lapor Mandiri</th>
                <th className="p-4 font-black">Progress Penilaian Binaan</th>
                <th className="p-4 font-black text-center">Rata-rata Skor</th>
                <th className="p-4 font-black text-center">Status Performa</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : data?.table?.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((row, i) => (
                <tr key={i} onClick={() => router.push(`/admin/fasil/${row.id}`)} className="border-b border-slate-50 hover:bg-teal-50/40 transition-colors cursor-pointer group">
                  <td className="p-4 text-center">
                    <span className={"inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm " + (row.rank === 1 ? "bg-amber-400 text-amber-950" : row.rank === 2 ? "bg-slate-300 text-slate-800" : row.rank === 3 ? "bg-amber-600 text-white" : "bg-teal-100 text-teal-800")}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-sm">{row.name}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{row.role}</div>
                  </td>
                  <td className="p-4 text-xs text-slate-700 font-semibold">{row.wilayah}</td>
                  <td className="p-4 text-center font-bold text-slate-800">{row.laporMandiri}</td>
                  <td className="p-4">
                     <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-xs">
                       <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: row.progressPeer }}></div>
                     </div>
                     <div className="text-[11px] text-slate-500 mt-1 flex justify-between font-semibold max-w-xs">
                       <span>{row.progressPeer}</span>
                       <span className="text-slate-400">{row.peerDetail} Etoser</span>
                     </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-black text-teal-950 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-sm">
                      {row.rataSkor}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={"text-xs font-bold px-3 py-1 rounded-full " + (row.status === 'Sangat Baik' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data?.table?.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">Tidak ada data Fasilitator ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
