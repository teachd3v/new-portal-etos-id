"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, User, Compass, GraduationCap, TrendingUp, ChevronDown, ChevronUp, ShieldCheck, UserCheck, Users, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DIMENSION_ICONS = {
  'Value Resilience': ShieldCheck,
  'Self Resilience': UserCheck,
  'Social Resilience': Users,
  'Change Resilience': Zap,
};

export default function AdminEtoserReliDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [collapsedDim, setCollapsedDim] = useState({
    'Value Resilience': true,
    'Self Resilience': true,
    'Social Resilience': true,
    'Change Resilience': true,
  });

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/admin/monitoring/etoser/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setNoteText(json.catatanAdmin || '');

          const initialCollapse = {
            'Value Resilience': true,
            'Self Resilience': true,
            'Social Resilience': true,
            'Change Resilience': true,
          };
          setCollapsedDim(initialCollapse);
        } else {
          toast.error("Gagal memuat detail Etoser");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch('/api/admin/monitoring/catatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: id,
          period_month: data?.reli?.activeKode || 'T0',
          period_year: data?.activePeriod?.tahun || new Date().getFullYear().toString(),
          catatan: noteText
        })
      });
      if (res.ok) {
        toast.success("Catatan admin berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan catatan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-teal-900 font-bold">Memuat rincian asesmen RELI etoser...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Data Etoser tidak ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl">Kembali</button>
      </div>
    );
  }

  const { user, activePeriod, reli } = data;
  const current = reli?.current;

  // Radar Data
  const radarChartData = current?.dimensions ? [
    { subject: 'Value Resilience', self: current.dimensions['Value Resilience']?.self || 0, final: current.dimensions['Value Resilience']?.final || 0, facil: current.dimensions['Value Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Self Resilience', self: current.dimensions['Self Resilience']?.self || 0, final: current.dimensions['Self Resilience']?.final || 0, facil: current.dimensions['Self Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Social Resilience', self: current.dimensions['Social Resilience']?.self || 0, final: current.dimensions['Social Resilience']?.final || 0, facil: current.dimensions['Social Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Change Resilience', self: current.dimensions['Change Resilience']?.self || 0, final: current.dimensions['Change Resilience']?.final || 0, facil: current.dimensions['Change Resilience']?.facil || 0, fullMark: 4 },
  ] : [];

  const trajectoryChartData = reli?.trajectory || [];

  const dimensionsList = ['Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

  const toggleDim = (dim) => {
    setCollapsedDim(prev => ({ ...prev, [dim]: !prev[dim] }));
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8 pb-28 md:pb-32">
      
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Rincian RELI</h1>
        <p className="text-slate-500 font-semibold text-xs md:text-sm mt-0.5">
          Periode Aktif: <strong className="text-slate-800">{activePeriod?.label || reli?.activeKode}</strong>
        </p>
      </div>

      {/* Profil Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Main User Identity */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover shadow-sm shrink-0 border border-teal-100" />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-sm shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-slate-900 truncate" title={user.name}>
                  {user.name}
                </h2>
                <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-teal-700 font-semibold font-mono">{user.id}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.wilayah} • Angkatan {user.angkatan} {user.fase ? `• Fase ${user.fase}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Stats / Meta info */}
          <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl px-3 py-2 text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kampus & Jurusan</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[140px] md:max-w-[180px]" title={user.universitas}>
                {user.universitas || '-'}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px] md:max-w-[180px]">
                {user.jurusan ? `${user.jurusan}${user.semester ? ` • Smt ${user.semester}` : ''}` : '-'}
              </p>
            </div>

            <div className="bg-teal-50/80 border border-teal-100 rounded-xl px-3 py-2 flex items-center justify-between md:justify-end gap-3">
              <div>
                <p className="text-[10px] font-bold text-teal-700 uppercase">IPK</p>
                <p className="text-base md:text-lg font-black text-teal-950 leading-none mt-0.5">
                  {user.ipk_terakhir?.toFixed(2) || '0.00'}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 self-center">
                Aktif
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* RELI Summary & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* 1. RELI Metric Card */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl"></div>
          
          <div>
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <span className="text-xs font-bold tracking-widest uppercase text-teal-300 bg-teal-900/50 border border-teal-500/30 px-3 py-1 rounded-full">
                RELI Index ({reli?.activeKode})
              </span>
              <span className="text-xs text-slate-400 font-medium">Bobot 50:50</span>
            </div>

            <p className="text-slate-400 text-xs md:text-sm font-semibold mb-1">Skor Kematangan Kepemimpinan</p>
            <div className="flex items-baseline gap-3 mb-3 md:mb-4">
              <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                {current?.final_reli !== undefined && current?.final_reli !== null ? current.final_reli.toFixed(2) : '-'}
              </span>
              <span className="text-teal-400 font-bold text-sm">/ 4.00</span>
            </div>

            {current && (
              <div className="space-y-2.5 md:space-y-3">
                <div className="inline-block bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 rounded-full text-teal-300 font-bold text-xs md:text-sm">
                  👑 {current.maturity_level}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <p className="text-slate-400">Self Score</p>
                    <p className="font-bold text-white text-base">{current.self_score?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Facil Score</p>
                    <p className="font-bold text-white text-base">{current.facil_score?.toFixed(2) || '-'}</p>
                  </div>
                </div>

                {current.gap_score !== null && (
                  <div className="bg-white/5 border border-white/10 p-2.5 md:p-3 rounded-xl md:rounded-2xl flex justify-between items-center text-xs">
                    <span className="text-slate-300">Self-Facil Gap: <strong>{current.gap_score > 0 ? `+${current.gap_score}` : current.gap_score}</strong></span>
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      current.gap_category === 'Selaras' ? 'bg-emerald-500/20 text-emerald-300' :
                      current.gap_category === 'Perlu refleksi' ? 'bg-sky-500/20 text-sky-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {current.gap_category}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {current?.growth_delta !== null && current?.growth_delta !== undefined && (
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10 flex justify-between items-center text-xs md:text-sm">
              <span className="text-slate-400">Pertumbuhan vs T0:</span>
              <span className="font-black text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> +{current.growth_delta} ({current.growth_rate > 0 ? `+${current.growth_rate}%` : `${current.growth_rate}%`})
              </span>
            </div>
          )}
        </div>

        {/* 2. Radar Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-slate-900 text-sm md:text-base">Profil Radar 4 Dimensi</h3>
            <span className="text-xs text-slate-500 font-semibold">Self vs Fasil</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {radarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                  <Radar name="Skor Akhir (50:50)" dataKey="final" stroke="#0d9488" fill="#0d9488" fillOpacity={0.4} />
                  <Radar name="Self Score" dataKey="self" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Radar name="Facil Score" dataKey="facil" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm font-medium">Belum ada data evaluasi RELI</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <span className="font-semibold text-slate-700">Final (50:50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-slate-700">Self</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-slate-700">Fasil</span>
            </div>
          </div>
        </div>

        {/* 3. Trajectory Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-slate-900 text-sm md:text-base">Longitudinal Trajectory</h3>
            <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full">T0 – T4 Growth</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {trajectoryChartData.some(t => t.score !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periode" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis domain={[1, 4]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '1rem', border: 'none' }} />
                  <Line type="monotone" dataKey="score" name="RELI Score" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm font-medium">Trajectory belum terbentuk.</p>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            <span>T0: Baseline</span>
            <span>T1: Thn 1</span>
            <span>T2: Thn 2</span>
            <span>T3: Thn 3</span>
            <span>T4: Final</span>
          </div>
        </div>

      </div>

      {/* 64 Items Breakdown by Dimension */}
      <div className="space-y-4 md:space-y-6">
        <div>
          <h3 className="text-lg md:text-2xl font-black text-slate-900">Rincian Butir Instrumen</h3>
        </div>

        {dimensionsList.map((dim) => {
          const Icon = DIMENSION_ICONS[dim] || Compass;
          const dimItems = reli?.itemDetails?.filter(i => i.dimensi === dim) || [];
          const isCollapsed = collapsedDim[dim] !== false;

          return (
            <div key={dim} className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleDim(dim)}
                className="w-full flex justify-between items-center px-4 py-3.5 md:p-5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200/60"
              >
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                  <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-teal-600 text-white shrink-0">
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <h4 className="font-bold md:font-black text-slate-900 text-sm md:text-base truncate">{dim}</h4>
                </div>

                <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
                  {current?.dimensions?.[dim] && (
                    <span className="text-xs md:text-sm font-black text-teal-900 bg-teal-100/70 border border-teal-200/80 px-2.5 py-1 rounded-lg md:rounded-xl">
                      {current.dimensions[dim].final?.toFixed(2)}
                    </span>
                  )}
                  {isCollapsed ? <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> : <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="p-3.5 md:p-6 space-y-3 md:space-y-4">
                  {dimItems.map((item) => (
                    <div key={item.id || item.kode} className="p-3.5 md:p-5 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm space-y-2.5 md:space-y-3 hover:border-teal-200 transition-all">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] md:text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              {item.kode}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {item.subdimensi}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm md:text-base leading-snug">{item.judul}</h5>
                        </div>

                        {/* Scores Table */}
                        <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end md:self-center">
                          <div className="text-center bg-blue-50 border border-blue-200 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-bold text-blue-700 uppercase">Self</p>
                            <p className="text-xs md:text-sm font-black text-blue-950">{item.selfScore ?? '-'}</p>
                          </div>
                          <div className="text-center bg-amber-50 border border-amber-200 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-bold text-amber-700 uppercase">Fasil</p>
                            <p className="text-xs md:text-sm font-black text-amber-950">{item.facilScore ?? '-'}</p>
                          </div>
                          <div className={`text-center px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl border ${
                            item.gap === null ? 'bg-slate-50 border-slate-200' :
                            Math.abs(item.gap) < 0.5 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            'bg-rose-50 border-rose-200 text-rose-900'
                          }`}>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase">Gap</p>
                            <p className="text-xs md:text-sm font-black">{item.gap !== null ? (item.gap > 0 ? `+${item.gap}` : item.gap) : '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Selected BAR Descriptions if available */}
                      {(item.pernyataan_self || item.pernyataan_fasil) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs pt-2 border-t border-slate-100">
                          {item.pernyataan_self && (
                            <div className="bg-slate-50 p-2.5 md:p-3 rounded-xl">
                              <span className="font-bold text-teal-800">Self: </span>
                              <span className="text-slate-700 italic">"{item.pernyataan_self}"</span>
                            </div>
                          )}
                          {item.pernyataan_fasil && (
                            <div className="bg-slate-50 p-2.5 md:p-3 rounded-xl">
                              <span className="font-bold text-indigo-800">Fasil: </span>
                              <span className="text-slate-700 italic">"{item.pernyataan_fasil}"</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Notes Section */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Compass className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-bold text-slate-900">Catatan Evaluasi Admin</h3>
        </div>
        <p className="text-sm text-slate-600">Catatan khusus, intervensi pembinaan, atau feedback untuk Etoser ini di periode {reli?.activeKode}.</p>
        
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Tulis catatan pembinaan disini..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-medium leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Catatan Admin
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

