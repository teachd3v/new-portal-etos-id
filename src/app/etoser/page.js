"use client";
import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Calendar,
  Trophy,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function EtoserDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = RELI, 1 = Monitoring Bulanan
  const sliderRef = useRef(null);

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
        console.error('Gagal memuat dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const goToSlide = (idx) => {
    setActiveSlide(idx);
    const container = sliderRef.current;
    if (container) {
      container.scrollTo({
        left: idx * container.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleSliderScroll = () => {
    const container = sliderRef.current;
    if (!container || container.clientWidth === 0) return;
    const idx = Math.round(container.scrollLeft / container.clientWidth);
    if (idx !== activeSlide && (idx === 0 || idx === 1)) {
      setActiveSlide(idx);
    }
  };

  const reliData = dashboardData?.reli;
  const monevAnalytics = dashboardData?.monevAnalytics;

  const radarChartData =
    reliData?.hasData && reliData?.dimensions
      ? [
          {
            subject: 'Value Resilience',
            self: reliData.dimensions['Value Resilience']?.self || 0,
            final: reliData.dimensions['Value Resilience']?.final || 0,
            fullMark: 4,
          },
          {
            subject: 'Self Resilience',
            self: reliData.dimensions['Self Resilience']?.self || 0,
            final: reliData.dimensions['Self Resilience']?.final || 0,
            fullMark: 4,
          },
          {
            subject: 'Social Resilience',
            self: reliData.dimensions['Social Resilience']?.self || 0,
            final: reliData.dimensions['Social Resilience']?.final || 0,
            fullMark: 4,
          },
          {
            subject: 'Change Resilience',
            self: reliData.dimensions['Change Resilience']?.self || 0,
            final: reliData.dimensions['Change Resilience']?.final || 0,
            fullMark: 4,
          },
        ]
      : [];

  const trajectoryChartData = reliData?.trajectory || [];

  const monevRadarData =
    monevAnalytics?.hasData && monevAnalytics?.variablesList
      ? monevAnalytics.variablesList.map((varName) => ({
          subject: varName,
          latest: monevAnalytics.latestVariables?.[varName] || 0,
          cumulative: monevAnalytics.cumulativeVariables?.[varName] || 0,
          fullMark: 4,
        }))
      : [];

  const monevHistoryData = monevAnalytics?.history || [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-2 md:py-4 pb-10">
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Quick Alert if Monthly Monitoring is open & not filled */}
          {dashboardData?.monevBulanan?.showMonevAlert && (
            <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/15 backdrop-blur-md border-2 border-emerald-500/40 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 md:gap-6 relative z-10">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
                    <CalendarCheck className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 mb-0.5 inline-block">
                      Rutin Bulanan
                    </span>
                    <h3 className="text-sm md:text-lg font-bold text-slate-900">
                      Monitoring Bulanan Telah Dibuka!
                    </h3>
                    <p className="text-slate-600 font-medium text-xs md:text-sm">
                      Silakan isi evaluasi capaian pembinaan periode{' '}
                      <strong>{dashboardData?.monevBulanan?.periodLabel}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/etoser/monev-bulanan')}
                  className="w-full sm:w-auto text-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shadow-emerald-600/30 active:scale-95 shrink-0 cursor-pointer"
                >
                  Isi Monitoring Sekarang →
                </button>
              </div>
            </div>
          )}

          {/* Quick Alert if RELI assessment is open & not filled */}
          {dashboardData?.showPenilaianAlert && (
            <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-md border-2 border-sky-500/30 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 md:gap-6 relative z-10">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-600/30">
                    <Compass className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-bold text-sky-950">
                      Asesmen RELI Telah Dibuka!
                    </h3>
                    <p className="text-sky-900/80 font-medium text-xs md:text-sm">
                      Silakan isi 64 butir instrumen kepemimpinan periode{' '}
                      <strong>{dashboardData?.activePeriod?.label}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/etoser/penilaian-mandiri')}
                  className="w-full sm:w-auto text-center bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shadow-sky-600/30 active:scale-95 shrink-0 cursor-pointer"
                >
                  Isi Asesmen Sekarang →
                </button>
              </div>
            </div>
          )}

          {/* SWIPEABLE DARK NAVY ANALYTICS HERO CAROUSEL */}
          <div className="space-y-2.5">
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-2xl md:rounded-[2.25rem] [&::-webkit-scrollbar]:hidden"
            >
              {/* SLIDE 1: RESILIENT LEADERS INDEX (RELI) */}
              <div className="w-full shrink-0 snap-center pr-1.5">
                <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl md:rounded-[2.25rem] p-5 md:p-8 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  <div className="absolute -top-12 -right-12 w-52 h-52 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-widest uppercase text-sky-300 bg-sky-900/50 border border-sky-500/30 px-3 py-1 rounded-full">
                        <Compass className="w-3.5 h-3.5" />
                        Resilient Leaders Index
                      </span>
                    </div>

                    {reliData?.hasData ? (
                      <>
                        <p className="text-slate-400 text-xs md:text-sm font-semibold mb-1">
                          Skor Kematangan Kepemimpinan (RELI {reliData.latestPeriode || ''})
                        </p>
                        <div className="flex items-baseline gap-2.5 mb-3">
                          <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                            {reliData.latestScore !== null ? reliData.latestScore.toFixed(2) : '-'}
                          </span>
                          <span className="text-sky-400 font-bold text-xs md:text-sm">/ 4.00</span>
                        </div>

                        <div className="space-y-3">
                          <div className="inline-block bg-sky-500/20 border border-sky-400/30 px-3.5 py-1 rounded-full text-sky-200 font-bold text-xs md:text-sm">
                            👑 {reliData.maturityLevel}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                            <div>
                              <p className="text-slate-400">Self Score (50%)</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {reliData.selfScore !== null ? reliData.selfScore.toFixed(2) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Fasil Score (50%)</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {reliData.facilScore !== null ? reliData.facilScore.toFixed(2) : 'Menunggu Fasil'}
                              </p>
                            </div>
                          </div>

                          {reliData.gapScore !== null && (
                            <div className="bg-white/5 border border-white/10 p-2.5 md:p-3 rounded-xl flex justify-between items-center text-[11px] md:text-xs">
                              <span className="text-slate-300">
                                Self-Facil Gap:{' '}
                                <strong>
                                  {reliData.gapScore > 0 ? `+${reliData.gapScore}` : reliData.gapScore}
                                </strong>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold ${
                                  reliData.gapCategory === 'Selaras'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : reliData.gapCategory === 'Perlu refleksi'
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {reliData.gapCategory}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-6 md:py-8 flex flex-col items-start justify-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-sky-200 text-xs font-bold mb-2.5">
                          <Clock className="w-3.5 h-3.5 text-sky-300" />
                          <span>Belum Dilakukan Pengukuran</span>
                        </div>
                        <p className="text-slate-300/90 text-xs md:text-sm leading-relaxed max-w-xl">
                          Data analitik Resilient Leaders Index (RELI) akan otomatis muncul setelah kamu mengisi asesmen periode pembinaan.
                        </p>
                      </div>
                    )}
                  </div>

                  {reliData?.hasData && reliData?.growthDelta !== null && (
                    <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-400">Pertumbuhan vs Baseline T0:</span>
                      <span className="font-black text-sky-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {reliData.growthDelta > 0 ? `+${reliData.growthDelta}` : reliData.growthDelta} (
                        {reliData.growthRate > 0 ? `+${reliData.growthRate}%` : `${reliData.growthRate}%`})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SLIDE 2: MONITORING BULANAN INDIVIDU */}
              <div className="w-full shrink-0 snap-center pl-1.5">
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white rounded-2xl md:rounded-[2.25rem] p-5 md:p-8 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  <div className="absolute -top-12 -left-12 w-52 h-52 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-widest uppercase text-teal-300 bg-teal-900/50 border border-teal-500/30 px-3 py-1 rounded-full">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Monitoring Bulanan
                      </span>
                    </div>

                    {monevAnalytics?.hasData ? (
                      <>
                        <p className="text-slate-400 text-xs md:text-sm font-semibold mb-1">
                          Capaian Individu Terakhir ({monevAnalytics.latestPeriodLabel})
                        </p>
                        <div className="flex items-baseline gap-2.5 mb-3">
                          <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                            {monevAnalytics.latestScore !== null ? monevAnalytics.latestScore.toFixed(2) : '-'}
                          </span>
                          <span className="text-teal-400 font-bold text-xs md:text-sm">/ 4.00</span>
                        </div>

                        <div className="space-y-3">
                          <div className="inline-block bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 rounded-full text-teal-200 font-bold text-xs md:text-sm">
                            ✨ {monevAnalytics.maturityLevel}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                            <div>
                              <p className="text-slate-400">Rata-rata Kumulatif</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {monevAnalytics.cumulativeAvg !== null
                                  ? `${monevAnalytics.cumulativeAvg.toFixed(2)} / 4.00`
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Riwayat Pengisian</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {monevAnalytics.totalFilled} Bulan Terukur
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 md:py-8 flex flex-col items-start justify-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-teal-200 text-xs font-bold mb-2.5">
                          <Clock className="w-3.5 h-3.5 text-teal-300" />
                          <span>Belum Dilakukan Pengukuran</span>
                        </div>
                        <p className="text-slate-300/90 text-xs md:text-sm leading-relaxed max-w-xl">
                          Rekap capaian monitoring bulanan individu akan tampil di sini setelah kamu mengirimkan laporan evaluasi bulanan pertamamu.
                        </p>
                      </div>
                    )}
                  </div>

                  {monevAnalytics?.hasData && monevAnalytics?.growthVsPrev !== null && (
                    <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-400">Perubahan vs Bulan Sebelumnya:</span>
                      <span
                        className={`font-black flex items-center gap-1 ${
                          monevAnalytics.growthVsPrev >= 0 ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {monevAnalytics.growthVsPrev >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        )}
                        {monevAnalytics.growthVsPrev > 0
                          ? `+${monevAnalytics.growthVsPrev.toFixed(2)}`
                          : monevAnalytics.growthVsPrev.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Minimal Carousel Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 select-none">
              <button
                type="button"
                aria-label="Slide RELI Index"
                onClick={() => goToSlide(0)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeSlide === 0 ? 'w-5 bg-sky-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
              <button
                type="button"
                aria-label="Slide Monitoring Bulanan"
                onClick={() => goToSlide(1)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeSlide === 1 ? 'w-5 bg-teal-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            </div>
          </div>

          {/* CONDITIONAL DETAILED CHARTS BELOW HERO CARD (ONLY RENDERED WHEN DATA EXISTS) */}
          {activeSlide === 0 && reliData?.hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
              {/* Radar Chart (4 Dimensi RELI) */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">Profil 4 Dimensi RELI</h3>
                  <span className="text-[10px] md:text-xs text-slate-500 font-semibold">Radar Analysis</span>
                </div>

                <div className="h-60 md:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarChartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                      <Radar
                        name="Skor Akhir"
                        dataKey="final"
                        stroke="#0284c7"
                        fill="#0284c7"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name="Self Assessment"
                        dataKey="self"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
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

              {/* Longitudinal Trajectory Chart (T0 - T4) */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    Trajectory Pembinaan (T0 – T4)
                  </h3>
                  <span className="text-[10px] md:text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
                    4-Year Journey
                  </span>
                </div>

                <div className="h-60 md:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trajectoryChartData}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="periode" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                      <YAxis domain={[1, 4]} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: 'none',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="RELI Score"
                        stroke="#0284c7"
                        strokeWidth={3}
                        connectNulls
                        dot={{ r: 5, fill: '#0284c7' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
          )}

          {activeSlide === 1 && monevAnalytics?.hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
              {/* Variable Radar Breakdown */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    Capaian per Variabel Pembinaan
                  </h3>
                  <span className="text-[10px] md:text-xs text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold">
                    {monevAnalytics.latestPeriodLabel}
                  </span>
                </div>

                <div className="h-60 md:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={monevRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 4]} stroke="#94a3b8" />
                      <Radar
                        name="Bulan Terakhir"
                        dataKey="latest"
                        stroke="#0d9488"
                        fill="#0d9488"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name="Rata-rata Kumulatif"
                        dataKey="cumulative"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.18}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                    <span className="font-semibold text-slate-700">Bulan Terakhir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500/50"></span>
                    <span className="font-semibold text-slate-700">Rata-rata Kumulatif</span>
                  </div>
                </div>
              </div>

              {/* Monthly Progression Line Chart */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    Tren Capaian Monitoring Bulanan
                  </h3>
                  <span className="text-[10px] md:text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {monevAnalytics.totalFilled} Bulan
                  </span>
                </div>

                <div className="h-60 md:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monevHistoryData}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="shortLabel" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis domain={[1, 4]} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: 'none',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Skor Monitoring"
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#0d9488' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                  <span>Awal: {monevAnalytics.initialPeriodLabel || '-'}</span>
                  <span>Terbaru: {monevAnalytics.latestPeriodLabel || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Menu Cards (Presensi & Portofolio) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div
              onClick={() => router.push('/etoser/presensi')}
              className="bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-sky-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                </div>
                <h4 className="text-base md:text-xl font-bold text-slate-900 mb-1">
                  Presensi & Penugasan Agenda
                </h4>
                <p className="text-slate-600 font-medium text-xs md:text-sm">
                  {dashboardData?.agendaCount > 0
                    ? `Terdapat ${dashboardData.agendaCount} agenda aktif untuk diikuti.`
                    : 'Belum ada agenda pembinaan aktif saat ini.'}
                </p>
              </div>
            </div>

            <div
              onClick={() => router.push('/etoser/profil?tab=portofolio')}
              className="bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-indigo-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-base md:text-xl font-bold text-slate-900 mb-1">
                  Portofolio & Export CV
                </h4>
                <p className="text-slate-600 font-medium text-xs md:text-sm">
                  Rekam karya, prestasi akademik (IPK {dashboardData?.ipk || '-'}), dan unduh Curriculum Vitae lengkap.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
