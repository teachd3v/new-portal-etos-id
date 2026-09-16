"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FasilPenilaianMandiriPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  const [answers, setAnswers] = useState({});
  const [validations, setValidations] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/fasil/penilaian-mandiri');
        const json = await res.json();
        
        if (!res.ok) {
          setErrorMsg(json.error || 'Terjadi kesalahan.');
        } else {
          setActivePeriod(json.activePeriod);
          setSchedule(json.schedule || null);
          setIsSubmitted(json.isSubmitted);
          setQuestions(json.questions || []);
        }
      } catch (error) {
        setErrorMsg('Gagal memuat data instrumen.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAnswerChange = (kode, value) => {
    setAnswers(prev => ({
      ...prev,
      [kode]: parseInt(value, 10)
    }));
  };

  const handleValidationChange = (kode, value) => {
    setValidations(prev => ({
      ...prev,
      [kode]: value
    }));
  };

  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    let completedCount = 0;
    
    questions.forEach(q => {
      const hasAnswer = answers[q.kode] !== undefined;
      const requiresValidation = q.pertanyaan_validasi && q.pertanyaan_validasi.trim() !== '';
      const hasValidation = validations[q.kode] && validations[q.kode].trim() !== '';
      
      if (hasAnswer) {
        if (!requiresValidation || (requiresValidation && hasValidation)) {
          completedCount++;
        }
      }
    });

    return Math.round((completedCount / questions.length) * 100);
  };

  const progress = calculateProgress();
  const isComplete = progress === 100;

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error('Pastikan semua pertanyaan dan isian teks telah dijawab.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/fasil/penilaian-mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          validations,
          period_month: activePeriod.bulan,
          period_year: activePeriod.tahun
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Penilaian Mandiri berhasil disimpan!');
        setIsSubmitted(true);
      } else {
        toast.error(json.error || 'Gagal menyimpan penilaian.');
      }
    } catch (error) {
      toast.error('Gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-2xl mx-auto mt-20 bg-white p-10 rounded-[2rem] shadow-sm text-center border border-red-100">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Oops!</h2>
        <p className="text-slate-500">{errorMsg}</p>
      </div>
    );
  }

  if (!activePeriod) {
    return (
      <div className="max-w-[700px] mx-auto py-8 md:py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/80 backdrop-blur-xl border border-amber-200/80 rounded-2xl md:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-amber-50 text-amber-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner border border-amber-200">
            <AlertTriangle className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
            Jadwal: Tanggal {schedule?.start || 25} – {schedule?.end || 7}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            Periode Penilaian Ditutup
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
            Formulir dibuka berkala sesuai jadwal di atas. Silakan kembali saat periode aktif.
          </p>

          <button
            onClick={() => router.push('/fasil')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-[700px] mx-auto py-8 md:py-16 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/80 rounded-2xl md:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl shadow-emerald-500/5 text-center relative overflow-hidden">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-emerald-100 text-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner">
            <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
            Evaluasi Selesai
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            Evaluasi Mandiri Selesai!
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
            Terima kasih Kak telah mengisi penilaian mandiri periode <span className="font-bold text-orange-600">{activePeriod.bulan} {activePeriod.tahun}</span>.
          </p>

          <button
            onClick={() => router.push('/fasil')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-52 md:pb-32">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <FileText className="w-7 h-7 md:w-10 md:h-10" />
              Penilaian Mandiri
            </h1>
            <p className="text-orange-100 font-medium text-xs md:text-lg max-w-xl">
              Lakukan refleksi diri untuk periode <span className="font-bold text-white">{activePeriod.bulan} {activePeriod.tahun}</span>.
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-10 shadow-sm border border-slate-100">
        <div className="space-y-6 md:space-y-12">
          {questions.map((q, idx) => {
            const requiresValidation = q.pertanyaan_validasi && q.pertanyaan_validasi.trim() !== '';

            return (
              <div key={q.id} className="space-y-3 md:space-y-4">
                <div className="flex gap-3 md:gap-4">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-orange-50 text-orange-600 font-black text-xs md:text-sm flex items-center justify-center shrink-0 border border-orange-100">
                    {idx + 1}
                  </div>
                  <p className="font-bold text-slate-700 text-base md:text-lg leading-relaxed pt-0.5">
                    {q.item_pernyataan}
                  </p>
                </div>

                <div className="pl-0 sm:pl-11 space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
                    {[
                      { value: 1, label: "Jarang", desc: "Sangat kurang" },
                      { value: 2, label: "Kadang", desc: "Kurang konsisten" },
                      { value: 3, label: "Sering", desc: "Cukup baik" },
                      { value: 4, label: "Selalu", desc: "Konsisten" }
                    ].map(option => (
                      <label 
                        key={option.value} 
                        className={`relative flex flex-col p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer border-2 transition-all duration-200 text-center ${
                          answers[q.kode] === option.value 
                          ? 'border-orange-500 bg-orange-50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-orange-200 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`q_${q.kode}`} 
                          value={option.value}
                          checked={answers[q.kode] === option.value}
                          onChange={(e) => handleAnswerChange(q.kode, e.target.value)}
                          className="sr-only"
                        />
                        <span className={`font-bold text-xs md:text-sm ${answers[q.kode] === option.value ? 'text-orange-700' : 'text-slate-700'}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {requiresValidation && answers[q.kode] !== undefined && (
                    <div className="mt-3 md:mt-4 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-xs md:text-sm font-bold text-orange-600 mb-1.5 md:mb-2">{q.pertanyaan_validasi}</p>
                      <textarea 
                        rows="2"
                        value={validations[q.kode] || ''}
                        onChange={(e) => handleValidationChange(q.kode, e.target.value)}
                        className="w-full px-3.5 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Tuliskan jawaban Anda di sini..."
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Progress & Submit Bar - positioned above mobile bottom nav */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[800px] px-3 md:px-4 z-40 md:z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl md:rounded-[2rem] p-3 md:p-4 shadow-2xl flex flex-col sm:flex-row items-center gap-3 md:gap-6">
          <div className="flex-1 w-full px-1 md:px-4">
            <div className="flex justify-between items-end mb-1.5 md:mb-2">
              <span className="font-bold text-slate-700 text-xs md:text-sm">Progress Penilaian</span>
              <span className="font-black text-orange-600 text-xs md:text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 md:h-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`flex items-center justify-center gap-1.5 md:gap-2 px-5 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 w-full sm:w-auto ${
              isComplete && !submitting
              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/30 hover:shadow-lg hover:-translate-y-0.5' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Kirim Penilaian
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
