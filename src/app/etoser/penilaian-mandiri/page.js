"use client";
import { useState, useEffect } from 'react';
import { Compass, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, Loader2, Save, ChevronRight, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const DIMENSION_ICONS = {
  'Value Resilience': ShieldCheck,
  'Self Resilience': UserCheck,
  'Social Resilience': Users,
  'Change Resilience': Zap,
};

const DIMENSION_COLORS = {
  'Value Resilience': 'teal',
  'Self Resilience': 'sky',
  'Social Resilience': 'indigo',
  'Change Resilience': 'emerald',
};

export default function PenilaianMandiriRELI() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('Value Resilience');
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    const fetchInstrumen = async () => {
      try {
        const res = await fetch('/api/etoser/penilaian-mandiri');
        if (res.ok) {
          const result = await res.json();
          setData(result);
          
          if (result.isOpen && result.questions) {
            const initialAnswers = {};
            result.questions.forEach(q => {
              initialAnswers[q.kode] = result.existingAnswers?.[q.kode] ? String(result.existingAnswers[q.kode]) : '';
            });
            setAnswers(initialAnswers);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error('Fetch instrumen failed:', res.status, errData);
          if (res.status === 401) {
            router.push('/login');
          } else {
            toast.error(errData.error || "Gagal memuat instrumen penilaian RELI");
          }
        }
      } catch (e) {
        console.error('Network error:', e);
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };
    fetchInstrumen();
  }, [router]);


  // Auto scroll to top when changing dimension
  useEffect(() => {
    const area = document.getElementById('etoser-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleOptionChange = (kode, value) => {

    setAnswers(prev => ({
      ...prev,
      [kode]: value
    }));
  };

  const dimensionsList = ['Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

  // Count answered per dimension
  const getDimensionStats = (dimName) => {
    if (!data?.questions) return { total: 0, answered: 0 };
    const dimQuestions = data.questions.filter(q => q.dimensi === dimName);
    const answeredCount = dimQuestions.filter(q => answers[q.kode] && answers[q.kode] !== '').length;
    return { total: dimQuestions.length, answered: answeredCount };
  };

  const totalAnswered = Object.values(answers).filter(val => val !== '').length;
  const totalQuestions = data?.questions?.length || 64;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (totalAnswered < totalQuestions) {
      toast.error(`Masih ada ${totalQuestions - totalAnswered} butir pernyataan yang belum dijawab.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/etoser/penilaian-mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode_kode: data.period.kode_periode || 'T0',
          periode_id: data.period.id,
          tahun: data.period.tahun,
          answers
        })
      });

      const resJson = await res.json();

      if (res.ok && resJson.success) {
        toast.success("Penilaian mandiri RELI berhasil disimpan!");
        setSubmittedResult(resJson);
      } else {
        toast.error(resJson.error || "Gagal menyimpan data");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full pt-32 text-sky-600 gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-semibold text-slate-500">Memuat instrumen RELI...</p>
      </div>
    );
  }

  const isLocked = submittedResult || data?.isSubmitted;
  const displayScore = submittedResult?.overall_score || data?.existingScore?.toFixed?.(2) || (data?.existingScore ? String(data.existingScore) : '-');
  const displayMaturity = submittedResult?.maturity_level || data?.existingMaturityLevel || 'Resilient Leader';
  const displayPeriodLabel = data?.period?.label || data?.period?.kode_periode || 'Periode Aktif';

  if (isLocked) {
    return (
      <div className="max-w-[700px] mx-auto py-8 md:py-16 px-4 animate-in fade-in zoom-in-95 duration-500 pb-20">
        <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/80 rounded-2xl md:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl shadow-emerald-500/5 text-center relative overflow-hidden">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-emerald-100 text-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner">
            <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4" />
            Asesmen RELI Selesai
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            Asesmen RELI Periode Ini Terisi
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
            Periode: <span className="font-bold text-sky-600">{displayPeriodLabel}</span> • Skor: <span className="font-bold text-emerald-600">{displayScore}</span> ({displayMaturity})
          </p>

          <button
            onClick={() => router.push('/etoser')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Lihat Dashboard & Hasil
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!data?.isOpen) {
    return (
      <div className="max-w-[700px] mx-auto py-8 md:py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/80 backdrop-blur-xl border border-amber-200/80 rounded-2xl md:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-amber-50 text-amber-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner border border-amber-200">
            <AlertTriangle className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
            Status: Periode Asesmen Ditutup
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            Periode Asesmen Ditutup
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
            {data?.message || 'Saat ini belum ada periode asesmen RELI yang aktif. Silakan kembali saat jadwal dibuka.'}
          </p>

          <button
            onClick={() => router.push('/etoser')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Kembali ke Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const activeQuestions = data?.questions?.filter(q => q.dimensi === activeTab) || [];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-52 md:pb-36">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-sky-200 bg-sky-950/60 border border-sky-400/30 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full">
              Self-Assessment
            </span>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 mt-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <Compass className="w-7 h-7 md:w-10 md:h-10 text-sky-200" />
              Asesmen Mandiri RELI
            </h1>
            <p className="text-sky-100/90 font-medium text-xs md:text-lg max-w-xl hidden md:block">
              Evaluasi diri menggunakan 64 butir rubrik instrumen Resilient Leaders Index.
            </p>
            <p className="text-sky-200 font-semibold text-xs md:text-sm mt-1">
              Periode: <span className="text-white font-bold">{data.period.label || `${data.period.kode_periode} (${data.period.tahun})`}</span>
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3.5 md:gap-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <p className="text-[10px] md:text-xs text-sky-200 font-bold uppercase tracking-wider">Progress Terisi</p>
              <p className="text-2xl md:text-3xl font-black text-white">{totalAnswered} <span className="text-sm md:text-lg text-sky-200">/ {totalQuestions}</span></p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-sky-400/40 flex items-center justify-center shrink-0">
              <span className="text-xs md:text-sm font-black text-white">{Math.round((totalAnswered / totalQuestions) * 100)}%</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {/* Instruction Note */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
        <h3 className="font-bold text-sky-950 text-sm md:text-base mb-1 flex items-center gap-2">
          <Compass className="w-4 h-4 md:w-5 md:h-5 text-sky-600" />
          Petunjuk Pengisian:
        </h3>
        <p className="text-xs md:text-sm text-sky-900/80 leading-relaxed">
          Pikirkan pengalaman Anda selama menjalani pembinaan. Nilailah perilaku berdasarkan <strong>apa yang benar-benar Anda lakukan</strong> dalam situasi nyata. Pilih opsi pernyataan yang paling menggambarkan diri Anda.
        </p>
      </div>

      {/* 4 Dimension Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
        {dimensionsList.map((dimName) => {
          const Icon = DIMENSION_ICONS[dimName] || Compass;
          const stats = getDimensionStats(dimName);
          const isComplete = stats.answered === stats.total && stats.total > 0;
          const isActive = activeTab === dimName;

          return (
            <button
              key={dimName}
              type="button"
              onClick={() => setActiveTab(dimName)}
              className={`p-3 md:p-5 rounded-2xl md:rounded-3xl text-left border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                isActive
                  ? 'border-sky-600 bg-white shadow-md shadow-sky-600/10 scale-[1.02]'
                  : 'border-slate-200/80 bg-white/60 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                {isComplete && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selesai
                  </span>
                )}
              </div>
              <div>
                <p className={`font-black text-sm md:text-base ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{dimName}</p>
                <p className="text-[11px] md:text-xs font-semibold text-slate-500 mt-0.5 md:mt-1">
                  {stats.answered} / {stats.total} butir
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Question Form for Active Dimension */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-4 md:space-y-6">
          {activeQuestions.map((q, idx) => {
            const selectedVal = answers[q.kode] || '';
            return (
              <div 
                key={q.id || q.kode} 
                className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm hover:shadow-md transition-all"
              >
                {/* Question Header */}
                <div className="flex gap-3 md:gap-4 items-start mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 font-black flex items-center justify-center shrink-0 text-xs md:text-sm">
                    {q.order_num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] md:text-xs font-bold text-sky-700 bg-sky-50 px-2 md:px-2.5 py-0.5 rounded-md">
                        {q.subdimensi}
                      </span>
                      <span className="text-[10px] md:text-xs font-mono font-bold text-slate-400">
                        [{q.kode}]
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {q.judul}
                    </h3>
                    <p className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed italic">
                      "{q.pernyataan_self}"
                    </p>
                  </div>
                </div>

                {/* 4 BAR Choices */}
                <div className="ml-0 md:ml-15 grid grid-cols-1 gap-2.5 md:gap-3">
                  {[
                    { level: '1', name: 'Level 1 - Emerging Leader', desc: q.bar_level_1 },
                    { level: '2', name: 'Level 2 - Developing Leader', desc: q.bar_level_2 },
                    { level: '3', name: 'Level 3 - Transformative Leader', desc: q.bar_level_3 },
                    { level: '4', name: 'Level 4 - Resilient Leader', desc: q.bar_level_4 },
                  ].map((bar) => {
                    const isSelected = selectedVal === bar.level;
                    return (
                      <label
                        key={bar.level}
                        className={`flex items-start gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/50 shadow-sm shadow-sky-600/10'
                            : 'border-slate-200/80 bg-white hover:border-sky-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.kode}
                          value={bar.level}
                          checked={isSelected}
                          onChange={() => handleOptionChange(q.kode, bar.level)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={`text-xs md:text-sm leading-relaxed ${
                            isSelected ? 'text-sky-950 font-semibold' : 'text-slate-700 font-normal'
                          }`}>
                            {bar.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* Tab Navigation & Sticky Footer - positioned above mobile bottom nav */}
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[1000px] px-3 md:px-4 z-40 md:z-50">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-3.5 md:p-5 rounded-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-center">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-1.5 md:mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-xs md:text-sm">Kemajuan Pengisian</p>
                  <p className="text-[11px] md:text-xs text-slate-500">
                    {totalAnswered} dari {totalQuestions} terjawab
                  </p>
                </div>
                <span className="text-base md:text-xl font-black text-sky-600">
                  {Math.round((totalAnswered / totalQuestions) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 md:h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
              {/* Quick Next Tab Button */}
              {activeTab !== 'Change Resilience' && (
                <button
                  type="button"
                  onClick={() => {
                    const currIdx = dimensionsList.indexOf(activeTab);
                    if (currIdx < dimensionsList.length - 1) {
                      setActiveTab(dimensionsList[currIdx + 1]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs md:text-sm transition-all flex-1 md:flex-initial text-center"
                >
                  Berikutnya →
                </button>
              )}

              <button 
                type="submit"
                disabled={submitting || totalAnswered < totalQuestions}
                className="flex-1 md:flex-none flex justify-center items-center gap-1.5 md:gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold px-6 md:px-10 py-2.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm shadow-lg hover:shadow-sky-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
                Kirim Penilaian RELI
              </button>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}

