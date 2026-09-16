"use client";
import { useEffect, useState } from 'react';
import { Compass, Calendar, Trophy, AlertCircle, ArrowRight, Loader2, TrendingUp, ShieldCheck, UserCheck, Users, Zap, CheckCircle2, RefreshCw, CalendarCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function EtoserDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/etoser/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setDashboardData(json.data);
        }
      } catch (error) {
        console.error("Gagal memuat dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const reliData = dashboardData?.reli;
  const radarChartData = reliData?.dimensions ? [
    { subject: 'Value Resilience', self: reliData.dimensions['Value Resilience']?.self || 0, final: reliData.dimensions['Value Resilience']?.final || 0, fullMark: 4 },
    { subject: 'Self Resilience', self: reliData.dimensions['Self Resilience']?.self || 0, final: reliData.dimensions['Self Resilience']?.final || 0, fullMark: 4 },
    { subject: 'Social Resilience', self: reliData.dimensions['Social Resilience']?.self || 0, final: reliData.dimensions['Social Resilience']?.final || 0, fullMark: 4 },
    { subject: 'Change Resilience', self: reliData.dimensions['Change Resilience']?.self || 0, final: reliData.dimensions['Change Resilience']?.final || 0, fullMark: 4 },
  ] : [];

  const trajectoryChartData = reliData?.trajectory || [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2 md:py-4 pb-20">
      
      {/* Etoser Hero Banner */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
              <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-sky-200 bg-sky-950/60 border border-sky-400/30 px-2.5 py-0.5 rounded-full">
                Etoser Aktif
              </span>
              <span className="text-[10px] md:text-xs font-bold text-sky-100 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                Angkatan {dashboardData?.angkatan || '-'}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-sky-100 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                Wilayah {dashboardData?.wilayah || '-'}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-sky-200 bg-sky-500/30 border border-sky-300/30 px-2.5 py-0.5 rounded-full">
                Fase {dashboardData?.fase || 'T0'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm flex items-center gap-2 md:gap-3">
              Selamat Datang, {dashboardData?.name || 'Etoser'}! 👋
            </h1>
            <p className="text-sky-100/90 font-medium text-xs md:text-lg max-w-2xl hidden md:block">
              Portal pembinaan kepemimpinan dan rekam jejak capaian Resilient Leaders Index (RELI).
            </p>
          </div>
          
          {dashboardData?.activePeriod && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 shrink-0 w-full sm:w-auto">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-sky-500/30 flex items-center justify-center text-sky-200">
                <Compass className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-sky-200 font-bold uppercase tracking-wider">Periode Asesmen</p>
                <p className="text-xs md:text-base font-black text-white">
                  {dashboardData.activePeriod.label || dashboardData.activePeriod.kode_periode}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative blur elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-400 opacity-15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500 opacity-15 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          
          {/* Quick Alert if Monthly Monitoring is open & not filled */}
          {dashboardData?.monevBulanan?.showMonevAlert && (
            <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/15 backdrop-blur-md border-2 border-emerald-500/40 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 relative z-10">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
                    <CalendarCheck className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 mb-1 inline-block">
                      Rutin Bulanan
                    </span>
                    <h3 className="text-base md:text-xl font-bold text-slate-900">Monitoring Bulanan Telah Dibuka!</h3>
                    <p className="text-slate-600 font-medium text-xs md:text-sm mt-0.5">
                      Silakan isi evaluasi capaian dan aktivitas pembinaan periode <strong>{dashboardData?.monevBulanan?.periodLabel}</strong>.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/etoser/monev-bulanan')}
                  className="w-full sm:w-auto text-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-md shadow-emerald-600/30 active:scale-95 shrink-0"
                >
                  Isi Monitoring Sekarang →
                </button>
              </div>
            </div>
          )}

          {/* Quick Alert if RELI assessment is open & not filled */}
          {dashboardData?.showPenilaianAlert && (
            <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-md border-2 border-sky-500/30 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 relative z-10">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-600/30">
                    <Compass className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-bold text-sky-950">Asesmen RELI Telah Dibuka!</h3>
                    <p className="text-sky-900/80 font-medium text-xs md:text-sm mt-0.5">
                      Silakan isi 64 butir instrumen kematangan kepemimpinan periode <strong>{dashboardData?.activePeriod?.label}</strong>.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/etoser/penilaian-mandiri')}
                  className="w-full sm:w-auto text-center bg-sky-600 hover:bg-sky-700 text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-md shadow-sky-600/30 active:scale-95 shrink-0"
                >
                  Isi Asesmen Sekarang →
                </button>
              </div>
            </div>
          )}


          {/* MAIN RELI HERO SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Primary Score Card */}
            <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-sky-300 bg-sky-900/50 border border-sky-500/30 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full">
                    Resilient Leaders Index
                  </span>
                  <span className="text-[10px] md:text-xs text-slate-400 font-medium">Skala 1.00 – 4.00</span>
                </div>

                <p className="text-slate-400 text-xs md:text-sm font-semibold mb-1">Skor Kematangan Kepemimpinan (RELI)</p>
                <div className="flex items-baseline gap-2 md:gap-3 mb-3 md:mb-4">
                  <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                    {reliData?.latestScore !== null ? reliData?.latestScore?.toFixed(2) : '-'}
                  </span>
                  <span className="text-sky-400 font-bold text-xs md:text-sm">/ 4.00</span>
                </div>

                {reliData?.hasData && (
                  <div className="space-y-3">
                    <div className="inline-block bg-sky-500/20 border border-sky-400/30 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-sky-300 font-bold text-xs md:text-sm">
                      👑 {reliData.maturityLevel}
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-3 pt-3 border-t border-white/10 text-[11px] md:text-xs">
                      <div>
                        <p className="text-slate-400">Self Score (50%)</p>
                        <p className="font-bold text-white text-sm md:text-base">{reliData?.selfScore?.toFixed(2) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Fasil Score (50%)</p>
                        <p className="font-bold text-white text-sm md:text-base">{reliData?.facilScore?.toFixed(2) || '-'}</p>
                      </div>
                    </div>

                    {reliData?.gapScore !== null && (
                      <div className="bg-white/5 border border-white/10 p-2.5 md:p-3 rounded-xl md:rounded-2xl flex justify-between items-center text-[11px] md:text-xs">
                        <span className="text-slate-300">Self-Facil Gap: <strong>{reliData.gapScore > 0 ? `+${reliData.gapScore}` : reliData.gapScore}</strong></span>
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          reliData.gapCategory === 'Selaras' ? 'bg-emerald-500/20 text-emerald-300' :
                          reliData.gapCategory === 'Perlu refleksi' ? 'bg-sky-500/20 text-sky-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {reliData.gapCategory}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {reliData?.growthDelta !== null && (
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10 flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Pertumbuhan vs T0:</span>
                  <span className="font-black text-sky-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> +{reliData.growthDelta} ({reliData.growthRate > 0 ? `+${reliData.growthRate}%` : `${reliData.growthRate}%`})
                  </span>
                </div>
              )}
            </div>

            {/* 2. Radar Chart (4 Dimensi RELI) */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-900 text-sm md:text-base">Profil 4 Dimensi RELI</h3>
                <span className="text-[10px] md:text-xs text-slate-500 font-semibold">Radar Analysis</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {radarChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                      <Radar name="Skor Akhir" dataKey="final" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                      <Radar name="Self Assessment" dataKey="self" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-sm font-medium">Belum ada data asesmen RELI</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-600"></span>
                  <span className="font-semibold text-slate-700">Skor Gabungan (Final)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500/50"></span>
                  <span className="font-semibold text-slate-700">Self Assessment</span>
                </div>
              </div>
            </div>

            {/* 3. Longitudinal Trajectory Chart (T0 - T4) */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-900 text-sm md:text-base">Trajectory Pembinaan (T0 – T4)</h3>
                <span className="text-[10px] md:text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full">4-Year Journey</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {trajectoryChartData.some(t => t.score !== null) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="periode" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                      <YAxis domain={[1, 4]} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '1rem', border: 'none' }} />
                      <Line type="monotone" dataKey="score" name="RELI Score" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <p className="text-xs md:text-sm font-medium">Trajectory akan terbentuk seiring pengisian periode T0 hingga T4.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>T0: Baseline</span>
                <span>T1: Thn 1</span>
                <span>T2: Thn 2</span>
                <span>T3: Thn 3</span>
                <span>T4: Final</span>
              </div>
            </div>

          </div>

          {/* Quick Menu Cards (Presensi & Portofolio) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div 
              onClick={() => router.push('/etoser/presensi')}
              className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="bg-sky-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Presensi & Post-Test</h4>
                <p className="text-slate-600 font-medium text-xs md:text-sm">
                  {dashboardData?.agendaCount > 0 ? `Terdapat ${dashboardData.agendaCount} agenda aktif untuk presensi.` : 'Belum ada agenda pembinaan aktif saat ini.'}
                </p>
              </div>
            </div>

            <div 
              onClick={() => router.push('/etoser/profil')}
              className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="bg-indigo-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Update Profil & Portofolio</h4>
                <p className="text-slate-600 font-medium text-xs md:text-sm">Rekam karya, prestasi akademik, IPK ({dashboardData?.ipk || '-'}), dan keaktifan organisasi.</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

