"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Loader2, ArrowLeft, Send, User, AlertTriangle, ShieldCheck, UserCheck, Users, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const DIMENSION_ICONS = {
  'Value Resilience': ShieldCheck,
  'Self Resilience': UserCheck,
  'Social Resilience': Users,
  'Change Resilience': Zap,
};

export default function FasilPenilaianRELIForm({ params }) {
  const router = useRouter();
  const { id: etoserId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [katalogSanksi, setKatalogSanksi] = useState([]);
  const [etoser, setEtoser] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('Value Resilience');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sanksi states
  const [reportSanksi, setReportSanksi] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedPelanggaranId, setSelectedPelanggaranId] = useState('');
  const [sanksiKeterangan, setSanksiKeterangan] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/fasil/penilaian-peer/${etoserId}`);
        const json = await res.json();
        
        if (!res.ok) {
          setErrorMsg(json.error || 'Terjadi kesalahan.');
        } else {
          setQuestions(json.questions || []);
          setEtoser(json.etoser);
          setActivePeriod(json.activePeriod);
          setKatalogSanksi(json.katalogSanksi || []);

          const initialAnswers = {};
          (json.questions || []).forEach(q => {
            initialAnswers[q.kode] = json.existingAnswers?.[q.kode] ? String(json.existingAnswers[q.kode]) : '';
          });
          setAnswers(initialAnswers);
        }
      } catch (error) {
        setErrorMsg('Gagal memuat instrumen penilaian.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [etoserId]);

  // Auto scroll to top when changing dimension
  useEffect(() => {
    const area = document.getElementById('fasil-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleAnswerChange = (kode, value) => {

    setAnswers(prev => ({
      ...prev,
      [kode]: value
    }));
  };

  const dimensionsList = ['Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

  const getDimensionStats = (dimName) => {
    const dimQuestions = questions.filter(q => q.dimensi === dimName);
    const answeredCount = dimQuestions.filter(q => answers[q.kode] && answers[q.kode] !== '').length;
    return { total: dimQuestions.length, answered: answeredCount };
  };

  const totalAnswered = Object.values(answers).filter(val => val !== '').length;
  const totalQuestions = questions.length || 64;
  const isComplete = totalAnswered === totalQuestions && totalQuestions > 0;
  const progress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error(`Masih ada ${totalQuestions - totalAnswered} pertanyaan yang belum dinilai.`);
      return;
    }

    if (reportSanksi && !selectedPelanggaranId) {
      toast.error('Silakan pilih detail pelanggaran yang sesuai.');
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedSanksi = reportSanksi 
        ? katalogSanksi.find(s => s.id === selectedPelanggaranId) 
        : null;

      const payload = {
        answers,
        periode_kode: activePeriod.kode_periode || 'T0',
        periode_id: activePeriod.id,
        tahun: activePeriod.tahun
      };

      if (selectedSanksi) {
        payload.sanksi = {
          katalog_sanksi_id: selectedSanksi.id,
          poin: selectedSanksi.poin,
          keterangan: sanksiKeterangan
        };
      }

      const res = await fetch(`/api/fasil/penilaian-peer/${etoserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(reportSanksi ? 'Penilaian RELI & Usulan Sanksi berhasil disimpan!' : 'Penilaian RELI berhasil disimpan!');
        router.push('/fasil/penilaian');
      } else {
        toast.error(json.error || 'Gagal menyimpan penilaian.');
        setSubmitting(false);
      }
    } catch (error) {
      toast.error('Gagal menghubungi server.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center pt-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-2xl mx-auto mt-20 bg-white p-10 rounded-[2.5rem] shadow-sm text-center border border-red-100">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Oops!</h2>
        <p className="text-slate-500 mb-8">{errorMsg}</p>
        <Link href="/fasil/penilaian" className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold inline-flex items-center gap-2 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
      </div>
    );
  }
  if (loading) return <div className="h-full flex items-center justify-center pt-24"><Loader2 className="w-10 h-10 text-orange-600 animate-spin" /></div>;

  const activeQuestions = questions.filter(q => q.dimensi === activeTab);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-52 md:pb-36">

      <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3.5 md:gap-5">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-xl md:text-2xl shadow-md shadow-orange-600/20 shrink-0">
            {etoser?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">{etoser?.name}</h1>
            <p className="text-slate-500 font-semibold text-xs md:text-sm mt-0.5">
              ID: {etoser?.id} &bull; Angkatan {etoser?.angkatan} &bull; Wilayah {etoser?.wilayah || 'Pusat'}
            </p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200/70 px-3.5 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl shrink-0">
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-orange-800">Periode Penilaian</p>
          <p className="text-xs md:text-sm font-black text-orange-950">{activePeriod?.label || activePeriod?.kode_periode}</p>
        </div>
      </div>

      {/* Instruction Note */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
        <h3 className="font-bold text-orange-950 text-sm md:text-base mb-1 flex items-center gap-2">
          <Compass className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
          Petunjuk Penilaian Fasilitator:
        </h3>
        <p className="text-xs md:text-sm text-orange-900/80 leading-relaxed">
          Amati perkembangan perilaku Etoser selama proses pembinaan. Berikan penilaian berdasarkan <strong>perilaku nyata yang ditunjukkan</strong> dalam situasi nyata. Pilih opsi pernyataan yang paling menggambarkan Etoser ini.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
        {dimensionsList.map((dimName) => {
          const Icon = DIMENSION_ICONS[dimName] || Compass;
          const stats = getDimensionStats(dimName);
          const isDimComplete = stats.answered === stats.total && stats.total > 0;
          const isActive = activeTab === dimName;
          return (
            <button key={dimName} type="button" onClick={() => setActiveTab(dimName)}
              className={`p-3 md:p-5 rounded-2xl md:rounded-3xl text-left border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                isActive ? 'border-orange-500 bg-white shadow-md shadow-orange-500/10 scale-[1.02]' : 'border-slate-200/80 bg-white/60 hover:bg-white hover:border-slate-300'
              }`}>
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl ${isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                {isDimComplete && <span className="bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selesai</span>}
              </div>
              <div>
                <p className={`font-black text-sm md:text-base ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{dimName}</p>
                <p className="text-[11px] md:text-xs font-semibold text-slate-500 mt-0.5 md:mt-1">{stats.answered} / {stats.total} butir</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 md:space-y-6">
        {activeQuestions.map((q) => (
          <div key={q.id || q.kode} className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
            <div className="flex gap-3 md:gap-4 items-start mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 font-black flex items-center justify-center shrink-0 text-xs md:text-sm">{q.order_num}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] md:text-xs font-bold text-orange-700 bg-orange-50 px-2 md:px-2.5 py-0.5 rounded-md">{q.subdimensi}</span>
                  <span className="text-[10px] md:text-xs font-mono font-bold text-slate-400">[{q.kode}]</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">{q.judul}</h3>
                <p className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed italic">"{q.pernyataan_fasil}"</p>
              </div>
            </div>
            <div className="ml-0 md:ml-15 grid grid-cols-1 gap-2.5 md:gap-3">
              {['1', '2', '3', '4'].map((level) => {
                const isSelected = answers[q.kode] === level;
                return (
                  <label key={level} className={`flex items-start gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-50/50 shadow-sm shadow-orange-500/10' : 'border-slate-200/80 bg-white hover:border-orange-200 hover:bg-slate-50/50'}`}>
                    <input type="radio" name={q.kode} value={level} checked={isSelected} onChange={() => handleAnswerChange(q.kode, level)} className="sr-only" />
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white"></div>}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={`text-xs md:text-sm leading-relaxed ${isSelected ? 'text-orange-950 font-semibold' : 'text-slate-700 font-normal'}`}>{q[`bar_level_${level}`]}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Progress & Submit Bar - positioned above mobile bottom nav */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[1000px] px-3 md:px-4 z-40 md:z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl md:rounded-[2.5rem] p-3.5 md:p-5 shadow-2xl flex flex-col md:flex-row items-center gap-3 md:gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-1.5 md:mb-2">
              <span className="font-bold text-slate-800 text-xs md:text-sm">Kemajuan Penilaian RELI</span>
              <span className="font-black text-orange-600 text-xs md:text-sm">{progress}% ({totalAnswered}/{totalQuestions})</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 md:h-3 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            {activeTab !== 'Change Resilience' && (
              <button
                type="button"
                onClick={() => {
                  const currIdx = dimensionsList.indexOf(activeTab);
                  if (currIdx < dimensionsList.length - 1) {
                    setActiveTab(dimensionsList[currIdx + 1]);
                  }
                }}
                className="px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs md:text-sm transition-all flex-1 md:flex-initial text-center"
              >
                Berikutnya →
              </button>
            )}

            <button onClick={handleSubmit} disabled={!isComplete || submitting} className={`flex items-center justify-center gap-1.5 md:gap-2 px-5 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-md shrink-0 flex-1 md:flex-initial ${isComplete && !submitting ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  Kirim Penilaian <Send className="w-4 h-4 md:w-5 md:h-5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
