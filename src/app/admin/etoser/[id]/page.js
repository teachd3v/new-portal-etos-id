"use client";
import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Save, Compass, TrendingUp, ChevronDown, ChevronUp,
  ShieldCheck, UserCheck, Users, Zap, CheckCircle2, Calendar, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const DIMENSION_ICONS = {
  'Value Resilience': ShieldCheck,
  'Self Resilience': UserCheck,
  'Social Resilience': Users,
  'Change Resilience': Zap,
  'Integritas': ShieldCheck,
  'Profesional': UserCheck,
  'Adaptif': Zap,
  'Transformatif': Users,
};

const MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

function AdminEtoserDetailContent({ id }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'monitoring' ? 'monitoring' : 'reli';
  const now = new Date();
  const initialBulan = searchParams.get('bulan') || MONTH_OPTIONS[now.getMonth()];
  const initialTahun = searchParams.get('tahun') || now.getFullYear().toString();

  const [viewMode, setViewMode] = useState(initialMode); // 'reli' | 'monitoring'
  const [bulan, setBulan] = useState(initialBulan);
  const [tahun, setTahun] = useState(initialTahun);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [monevNoteText, setMonevNoteText] = useState('');
  const [collapsedDim, setCollapsedDim] = useState({
    'Value Resilience': true,
    'Self Resilience': true,
    'Social Resilience': true,
    'Change Resilience': true,
  });
  const [collapsedMonevVar, setCollapsedMonevVar] = useState({});

  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'monitoring' ? 'monitoring' : 'reli';
    setViewMode(urlMode);
  }, [searchParams]);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/monitoring/etoser/${id}?bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setNoteText(json.catatanAdmin || '');
          setMonevNoteText(json.monitoring?.catatanAdmin || '');

          const initialMonevCollapse = {};
          (json.monitoring?.variablesList || ['Integritas', 'Profesional', 'Adaptif', 'Transformatif']).forEach(v => {
            initialMonevCollapse[v] = false; // Open by default in monitoring or toggleable
          });
          setCollapsedMonevVar(initialMonevCollapse);
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
  }, [id, bulan, tahun]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const isMonev = viewMode === 'monitoring';
      const payload = isMonev
        ? {
            target_user_id: id,
            period_month: bulan,
            period_year: tahun,
            catatan: monevNoteText
          }
        : {
            target_user_id: id,
            period_month: data?.reli?.activeKode || 'T0',
            period_year: data?.activePeriod?.tahun || new Date().getFullYear().toString(),
            catatan: noteText
          };

      const res = await fetch('/api/admin/monitoring/catatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  if (loading && !data) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-teal-900 font-bold">Memuat rincian performa etoser...</p>
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

  const { user, activePeriod, reli, monitoring } = data;
  const current = reli?.current;
  const monevCurrent = monitoring?.current;
  const monevVars = monitoring?.variablesList || ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];

  // RELI Radar Data
  const radarChartData = current?.dimensions ? [
    { subject: 'Value Resilience', self: current.dimensions['Value Resilience']?.self || 0, final: current.dimensions['Value Resilience']?.final || 0, facil: current.dimensions['Value Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Self Resilience', self: current.dimensions['Self Resilience']?.self || 0, final: current.dimensions['Self Resilience']?.final || 0, facil: current.dimensions['Self Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Social Resilience', self: current.dimensions['Social Resilience']?.self || 0, final: current.dimensions['Social Resilience']?.final || 0, facil: current.dimensions['Social Resilience']?.facil || 0, fullMark: 4 },
    { subject: 'Change Resilience', self: current.dimensions['Change Resilience']?.self || 0, final: current.dimensions['Change Resilience']?.final || 0, facil: current.dimensions['Change Resilience']?.facil || 0, fullMark: 4 },
  ] : [];

  const trajectoryChartData = reli?.trajectory || [];
  const dimensionsList = ['Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

  // Monitoring Bulanan Radar Data
  const monevRadarData = monevVars.map(v => ({
    subject: v,
    self: monevCurrent?.dimensions?.[v]?.self || 0,
    national: monevCurrent?.dimensions?.[v]?.national || 0,
    fullMark: 4
  }));

  const monevTrajectoryData = monitoring?.trajectory || [];

  const toggleDim = (dim) => {
    setCollapsedDim(prev => ({ ...prev, [dim]: !prev[dim] }));
  };

  const toggleMonevVar = (v) => {
    setCollapsedMonevVar(prev => ({ ...prev, [v]: !prev[v] }));
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8 pb-28 md:pb-32">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
            {viewMode === 'monitoring' ? 'Rincian Monitoring Bulanan' : 'Rincian RELI'}
          </h1>
          <p className="text-slate-500 font-semibold text-xs md:text-sm mt-0.5">
            {viewMode === 'monitoring' ? (
              <>Periode Evaluasi: <strong className="text-slate-800">{bulan} {tahun}</strong></>
            ) : (
              <>Periode Aktif: <strong className="text-slate-800">{activePeriod?.label || reli?.activeKode}</strong></>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {viewMode === 'monitoring' && (
            <div className="flex items-center gap-2 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 text-teal-600" />
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="bg-transparent text-xs md:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="bg-transparent text-xs md:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex bg-white/80 border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('monitoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monitoring'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monitoring Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reli')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'reli'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Asesmen RELI
            </button>
          </div>
        </div>
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

      {viewMode === 'monitoring' ? (
        /* ==================== MONITORING BULANAN VIEW ==================== */
        <>
          {/* Summary & Charts Grid (Same layout as RELI Etoser) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* 1. Monitoring Metric Card */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase text-teal-300 bg-teal-900/50 border border-teal-500/30 px-3 py-1 rounded-full">
                    Monitoring ({bulan} {tahun})
                  </span>
                  {monevCurrent?.hasSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Belum Mengisi
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-xs md:text-sm font-semibold mb-1">Rata-rata Skor Monitoring Bulanan</p>
                <div className="flex items-baseline gap-3 mb-3 md:mb-4">
                  <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                    {monevCurrent?.final_score !== null && monevCurrent?.final_score !== undefined
                      ? monevCurrent.final_score.toFixed(2)
                      : '-'}
                  </span>
                  <span className="text-teal-400 font-bold text-sm">/ 4.00</span>
                </div>

                <div className="space-y-2.5 md:space-y-3">
                  <div className="inline-block bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 rounded-full text-teal-300 font-bold text-xs md:text-sm">
                    👑 {monevCurrent?.maturity_level || 'Belum Mengisi'}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/10 text-xs">
                    {monevVars.map((vName) => (
                      <div key={vName} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <p className="text-slate-400 text-[10px] truncate">{vName}</p>
                        <p className="font-bold text-white text-sm">
                          {monevCurrent?.hasSubmitted && monevCurrent?.dimensions?.[vName]
                            ? monevCurrent.dimensions[vName].self.toFixed(2)
                            : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {monevCurrent?.growth_delta !== null && monevCurrent?.growth_delta !== undefined && (
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10 flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Perubahan vs Bulan Sebelumnya:</span>
                  <span className={`font-black flex items-center gap-1 ${
                    monevCurrent.growth_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                    {monevCurrent.growth_delta > 0 ? `+${monevCurrent.growth_delta}` : monevCurrent.growth_delta}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Radar Chart 4 Variabel */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-900 text-sm md:text-base">Profil Radar 4 Variabel</h3>
                <span className="text-xs text-slate-500 font-semibold">Etoser vs Rerata Nasional</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={monevRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                    <Radar name="Skor Etoser" dataKey="self" stroke="#0d9488" fill="#0d9488" fillOpacity={0.45} />
                    <Radar name="Rata-rata Nasional" dataKey="national" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '1rem', border: 'none', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  <span className="font-semibold text-slate-700">Skor Etoser ({bulan})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-slate-700">Rata-rata Nasional</span>
                </div>
              </div>
            </div>

            {/* 3. Trajectory Chart Bulanan */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-900 text-sm md:text-base">Tren Skor Bulanan ({tahun})</h3>
                <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full">Jan – Des</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monevTrajectoryData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="periode" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis domain={[0, 4]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '1rem', border: 'none', fontSize: '12px' }} />
                    <Line connectNulls type="monotone" dataKey="score" name="Skor Monitoring" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>Periode: {bulan} {tahun}</span>
                <span>
                  {monevCurrent?.submittedAt
                    ? `Disubmit: ${new Date(monevCurrent.submittedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}`
                    : 'Belum disubmit'}
                </span>
              </div>
            </div>

          </div>

          {/* Breakdown Butir Instrumen per Variabel (4 Variabel) */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-900">Rincian Butir Instrumen Monitoring ({bulan} {tahun})</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Klik pada masing-masing variabel untuk melihat skor dan jawaban validasi Etoser per butir pernyataan.
              </p>
            </div>

            {monevVars.map((varName) => {
              const Icon = DIMENSION_ICONS[varName] || Compass;
              const varItems = (monitoring?.itemDetails || []).filter(i => i.variabel === varName);
              const isCollapsed = collapsedMonevVar[varName] === true;
              const varAvg = monevCurrent?.dimensions?.[varName]?.self;

              return (
                <div key={varName} className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleMonevVar(varName)}
                    className="w-full flex justify-between items-center px-4 py-3.5 md:p-5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-teal-600 text-white shrink-0">
                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold md:font-black text-slate-900 text-sm md:text-base truncate">{varName}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{varItems.length} Butir Pernyataan</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
                      <span className="text-xs md:text-sm font-black text-teal-900 bg-teal-100/70 border border-teal-200/80 px-2.5 py-1 rounded-lg md:rounded-xl">
                        {monevCurrent?.hasSubmitted && varAvg !== undefined ? varAvg.toFixed(2) : '-'}
                      </span>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> : <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />}
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-3.5 md:p-6 space-y-3 md:space-y-4">
                      {varItems.map((item) => (
                        <div key={item.id || item.kode} className="p-3.5 md:p-5 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm space-y-2.5 md:space-y-3 hover:border-teal-200 transition-all">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] md:text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                  {item.kode}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {item.indikator}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-sm md:text-base leading-snug">{item.item_pernyataan}</h5>
                            </div>

                            {/* Score Box */}
                            <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end md:self-center">
                              <div className="text-center bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl min-w-[64px]">
                                <p className="text-[9px] md:text-[10px] font-bold text-teal-700 uppercase">Skor</p>
                                <p className="text-sm md:text-base font-black text-teal-950">{item.score ?? '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Validation Answer if available */}
                          {(item.pertanyaan_validasi || item.validation_answer) && (
                            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-100">
                              <span className="font-bold text-teal-800 block">
                                {item.pertanyaan_validasi || 'Keterangan / Validasi:'}
                              </span>
                              <p className="text-slate-700 italic">
                                {item.validation_answer ? `"${item.validation_answer}"` : 'Belum ada keterangan yang diisi.'}
                              </p>
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

          {/* Admin Notes Section (Monitoring Bulanan) */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Compass className="w-6 h-6 text-teal-600" />
              <h3 className="text-xl font-bold text-slate-900">Catatan Evaluasi Admin</h3>
            </div>
            <p className="text-sm text-slate-600">Catatan khusus, intervensi pembinaan, atau feedback untuk Etoser ini di periode {bulan} {tahun}.</p>
            
            <div className="space-y-4">
              <textarea
                value={monevNoteText}
                onChange={(e) => setMonevNoteText(e.target.value)}
                placeholder="Tulis catatan pembinaan untuk periode bulan ini..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-medium leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Catatan Admin
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================== RELI ETOSER VIEW ==================== */
        <>
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
                    className="w-full flex justify-between items-center px-4 py-3.5 md:p-5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200/60 cursor-pointer"
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
                                  <span className="text-slate-700 italic">&quot;{item.pernyataan_self}&quot;</span>
                                </div>
                              )}
                              {item.pernyataan_fasil && (
                                <div className="bg-slate-50 p-2.5 md:p-3 rounded-xl">
                                  <span className="font-bold text-indigo-800">Fasil: </span>
                                  <span className="text-slate-700 italic">&quot;{item.pernyataan_fasil}&quot;</span>
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

          {/* Admin Notes Section (RELI) */}
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
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Catatan Admin
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default function AdminEtoserReliDetailPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-transparent">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
      </div>
    }>
      <AdminEtoserDetailContent id={id} />
    </Suspense>
  );
}
