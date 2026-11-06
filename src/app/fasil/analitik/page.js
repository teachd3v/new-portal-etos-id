"use client";
import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Loader2,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
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

export default function FasilAnalitikPage() {
  const [analitikData, setAnalitikData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = RELI, 1 = Monitoring Bulanan
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/fasil/analitik');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setAnalitikData(json.data);
        }
      } catch (err) {
        console.error('Gagal memuat analitik wilayah:', err);
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

  const wilayah = analitikData?.wilayah || '-';
  const totalEtoser = analitikData?.totalEtoser ?? 0;
  const reliData = analitikData?.reli;
  const monevAnalytics = analitikData?.monevAnalytics;

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
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* SWIPEABLE DARK ORANGE ANALYTICS HERO CAROUSEL */}
          <div className="space-y-2.5">
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-2xl md:rounded-[2.25rem] [&::-webkit-scrollbar]:hidden"
            >
              {/* SLIDE 1: RESILIENT LEADERS INDEX (RELI) WILAYAH */}
              <div className="w-full shrink-0 snap-center pr-1.5">
                <div className="bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#431407] text-white rounded-2xl md:rounded-[2.25rem] p-5 md:p-8 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  <div className="absolute -top-12 -right-12 w-52 h-52 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-widest uppercase text-amber-100 bg-black/25 border border-amber-200/35 px-3 py-1 rounded-full">
                        <Compass className="w-3.5 h-3.5 text-amber-200" />
                        Resilient Leaders Index
                      </span>
                      <span className="text-[11px] font-bold text-orange-50">
                        Wilayah {wilayah}
                      </span>
                    </div>

                    {reliData?.hasData ? (
                      <>
                        <p className="text-orange-100 text-xs md:text-sm font-semibold mb-1">
                          Rata-rata Etoser ({reliData.latestPeriode || ''} • {reliData.measuredCount}/{totalEtoser} Etoser)
                        </p>
                        <div className="flex items-baseline gap-2.5 mb-3">
                          <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                            {reliData.latestScore !== null ? reliData.latestScore.toFixed(2) : '-'}
                          </span>
                          <span className="text-amber-200 font-bold text-xs md:text-sm">/ 4.00</span>
                        </div>

                        <div className="space-y-3">
                          <div className="inline-block bg-black/25 border border-white/25 px-3.5 py-1 rounded-full text-white font-bold text-xs md:text-sm">
                            👑 {reliData.maturityLevel}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 text-xs">
                            <div>
                              <p className="text-orange-100/90 font-medium">Self Score (50%)</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {reliData.selfScore !== null ? reliData.selfScore.toFixed(2) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-orange-100/90 font-medium">Fasil Score (50%)</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {reliData.facilScore !== null ? reliData.facilScore.toFixed(2) : 'Menunggu Fasil'}
                              </p>
                            </div>
                          </div>

                          {reliData.gapScore !== null && (
                            <div className="bg-black/25 border border-white/15 p-2.5 md:p-3 rounded-xl flex justify-between items-center text-[11px] md:text-xs">
                              <span className="text-orange-50">
                                Self-Facil Gap:{' '}
                                <strong className="text-white">
                                  {reliData.gapScore > 0 ? `+${reliData.gapScore}` : reliData.gapScore}
                                </strong>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold border ${
                                  reliData.gapCategory === 'Selaras'
                                    ? 'bg-emerald-400/25 border-emerald-300/35 text-emerald-100'
                                    : reliData.gapCategory === 'Perlu refleksi'
                                    ? 'bg-amber-300/25 border-amber-200/35 text-amber-100'
                                    : 'bg-white/20 border-white/30 text-white'
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
                        <div className="inline-flex items-center gap-2 bg-black/25 border border-amber-200/35 px-3.5 py-1.5 rounded-full text-amber-100 text-xs font-bold mb-2.5">
                          <Clock className="w-3.5 h-3.5 text-amber-200" />
                          <span>Belum Dilakukan Pengukuran</span>
                        </div>
                        <p className="text-orange-50 text-xs md:text-sm leading-relaxed max-w-xl">
                          Belum ada data pengukuran RELI untuk Etoser di Wilayah {wilayah}.
                        </p>
                      </div>
                    )}
                  </div>

                  {reliData?.hasData && reliData?.growthDelta !== null && (
                    <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs md:text-sm">
                      <span className="text-orange-100 font-medium">Pertumbuhan vs Baseline T0:</span>
                      <span className="font-black text-amber-200 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {reliData.growthDelta > 0 ? `+${reliData.growthDelta}` : reliData.growthDelta} (
                        {reliData.growthRate > 0 ? `+${reliData.growthRate}%` : `${reliData.growthRate}%`})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SLIDE 2: MONITORING BULANAN WILAYAH */}
              <div className="w-full shrink-0 snap-center pl-1.5">
                <div className="bg-gradient-to-br from-[#431407] via-[#7C2D12] to-[#9A3412] text-white rounded-2xl md:rounded-[2.25rem] p-5 md:p-8 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  <div className="absolute -top-12 -left-12 w-52 h-52 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-widest uppercase text-amber-100 bg-black/25 border border-amber-200/35 px-3 py-1 rounded-full">
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-200" />
                        Monitoring Bulanan
                      </span>
                      <span className="text-[11px] font-bold text-orange-50">
                        Wilayah {wilayah}
                      </span>
                    </div>

                    {monevAnalytics?.hasData ? (
                      <>
                        <p className="text-orange-100 text-xs md:text-sm font-semibold mb-1">
                          Rata-rata Terakhir ({monevAnalytics.latestPeriodLabel} • {monevAnalytics.latestSubmittedCount}/{totalEtoser} Etoser)
                        </p>
                        <div className="flex items-baseline gap-2.5 mb-3">
                          <span className="text-4xl md:text-6xl font-black tracking-tight text-white">
                            {monevAnalytics.latestScore !== null ? monevAnalytics.latestScore.toFixed(2) : '-'}
                          </span>
                          <span className="text-amber-200 font-bold text-xs md:text-sm">/ 4.00</span>
                        </div>

                        <div className="space-y-3">
                          <div className="inline-block bg-black/25 border border-white/25 px-3.5 py-1 rounded-full text-white font-bold text-xs md:text-sm">
                            ✨ {monevAnalytics.maturityLevel}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 text-xs">
                            <div>
                              <p className="text-orange-100/90 font-medium">Rata-rata Kumulatif</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {monevAnalytics.cumulativeAvg !== null
                                  ? `${monevAnalytics.cumulativeAvg.toFixed(2)} / 4.00`
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-orange-100/90 font-medium">Riwayat Wilayah</p>
                              <p className="font-bold text-white text-sm md:text-base">
                                {monevAnalytics.totalFilled} Bulan Terukur
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 md:py-8 flex flex-col items-start justify-center">
                        <div className="inline-flex items-center gap-2 bg-black/25 border border-amber-200/35 px-3.5 py-1.5 rounded-full text-amber-100 text-xs font-bold mb-2.5">
                          <Clock className="w-3.5 h-3.5 text-amber-200" />
                          <span>Belum Dilakukan Pengukuran</span>
                        </div>
                        <p className="text-orange-50 text-xs md:text-sm leading-relaxed max-w-xl">
                          Belum ada laporan evaluasi Monitoring Bulanan dari Etoser di Wilayah {wilayah}.
                        </p>
                      </div>
                    )}
                  </div>

                  {monevAnalytics?.hasData && monevAnalytics?.growthVsPrev !== null && (
                    <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs md:text-sm">
                      <span className="text-orange-100 font-medium">Perubahan vs Bulan Sebelumnya:</span>
                      <span
                        className={`font-black flex items-center gap-1 ${
                          monevAnalytics.growthVsPrev >= 0 ? 'text-emerald-200' : 'text-amber-200'
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
                  activeSlide === 0 ? 'w-5 bg-orange-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
              <button
                type="button"
                aria-label="Slide Monitoring Bulanan"
                onClick={() => goToSlide(1)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeSlide === 1 ? 'w-5 bg-orange-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            </div>
          </div>

          {/* CONDITIONAL DETAILED CHARTS BELOW HERO CARD */}
          {activeSlide === 0 && reliData?.hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
              {/* Radar Chart (4 Dimensi RELI) */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">Profil 4 Dimensi RELI</h3>
                  <span className="text-[10px] md:text-xs text-slate-500 font-semibold">
                    {reliData.latestPeriode}
                  </span>
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
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.35}
                      />
                      <Radar
                        name="Self Assessment"
                        dataKey="self"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-600"></span>
                    <span className="font-semibold text-slate-700">Skor Gabungan (Final)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500/60"></span>
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
                  <span className="text-[10px] md:text-xs text-orange-800 font-bold bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Wilayah {wilayah}
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
                          backgroundColor: '#431407',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: 'none',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Rata-rata RELI"
                        stroke="#ea580c"
                        strokeWidth={3}
                        connectNulls
                        dot={{ r: 5, fill: '#ea580c' }}
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
                  <span className="text-[10px] md:text-xs text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full font-bold">
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
                        stroke="#c2410c"
                        fill="#ea580c"
                        fillOpacity={0.35}
                      />
                      <Radar
                        name="Rata-rata Kumulatif"
                        dataKey="cumulative"
                        stroke="#d97706"
                        fill="#f59e0b"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-600"></span>
                    <span className="font-semibold text-slate-700">Bulan Terakhir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500/60"></span>
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
                  <span className="text-[10px] md:text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full">
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
                          backgroundColor: '#431407',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: 'none',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Rata-rata Wilayah"
                        stroke="#ea580c"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#ea580c' }}
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
        </>
      )}
    </div>
  );
}
