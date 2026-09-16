"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Loader2, Award, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EtoserPresensiPage() {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState('');

  // Kuis states
  const [activeKuis, setActiveKuis] = useState(null);
  const [kuisQuestions, setKuisQuestions] = useState([]);
  const [kuisAnswers, setKuisAnswers] = useState({});
  const [isKuisModalOpen, setIsKuisModalOpen] = useState(false);
  const [submittingKuis, setSubmittingKuis] = useState(false);
  const [kuisResult, setKuisResult] = useState(null);

  useEffect(() => {
    // Fetch current user and then their agendas
    const fetchPresensi = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/auth/me');
        let currentUserId = 'E2023019'; // Fallback mock
        if (userRes.ok) {
          const userData = await userRes.json();
          currentUserId = userData.id;
          setUserId(currentUserId);
        }

        const res = await fetch(`/api/etoser/presensi?userId=${currentUserId}`);
        if (res.ok) {
          const data = await res.json();
          setAgendas(data);
        }
      } catch (e) {
        console.error(e);
        toast.error("Gagal memuat data agenda");
      } finally {
        setLoading(false);
      }
    };
    fetchPresensi();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsKuisModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHadir = async (agendaId) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/etoser/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda_id: agendaId, userId })
      });

      if (res.ok) {
        toast.success("Presensi berhasil dicatat!");
        setAgendas(agendas.map(a => a.id === agendaId ? { ...a, hasAttended: true } : a));
      } else {
        toast.error("Gagal mencatat presensi");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const startKuis = async (agenda) => {
    setActiveKuis(agenda);
    setKuisAnswers({});
    setKuisResult(null);
    setIsKuisModalOpen(true);
    // Temporarily trigger spinner for the questions area only
    setKuisQuestions([]);
    try {
      const res = await fetch(`/api/client/post-test/${agenda.id}`);
      if (res.ok) {
        const json = await res.json();
        setKuisQuestions(json.questions || []);
      } else {
        toast.error("Gagal mengambil soal kuis");
        setIsKuisModalOpen(false);
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
      setIsKuisModalOpen(false);
    }
  };

  const handleKuisSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(kuisAnswers).length < kuisQuestions.length) {
      toast.error("Harap jawab semua soal sebelum mengirim!");
      return;
    }

    setSubmittingKuis(true);
    try {
      const res = await fetch(`/api/client/post-test/${activeKuis.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answers: kuisAnswers })
      });
      if (res.ok) {
        const json = await res.json();
        setKuisResult(json);
        toast.success(`Post Test selesai! Skor: ${json.score}`);
        
        // Update agendas list locally
        setAgendas(agendas.map(a => 
          a.id === activeKuis.id 
            ? { ...a, hasTakenPostTest: true, postTestScore: json.score } 
            : a
        ));
      } else {
        toast.error("Gagal mengirimkan kuis");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setSubmittingKuis(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-sky-200 bg-sky-950/60 border border-sky-400/30 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full">
              Etoser
            </span>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 mt-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <Calendar className="w-7 h-7 md:w-10 md:h-10 text-sky-200" />
              Presensi Kehadiran
            </h1>
            <p className="text-sky-100/90 font-medium text-xs md:text-lg max-w-xl hidden md:block">
              Daftar agenda pembinaan yang sedang atau akan berlangsung. Jangan lupa klik tombol "Hadir".
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm">
        {loading && agendas.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-sky-600">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : agendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 text-sky-800/50">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 opacity-50" />
            <p className="text-base md:text-lg font-medium">Tidak ada agenda aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {agendas.map(agenda => (
              <div key={agenda.id} className="bg-sky-50/50 border border-sky-100 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-200/30 rounded-full blur-2xl group-hover:bg-sky-300/40 transition-colors pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 bg-sky-100 text-sky-700 font-bold text-[10px] md:text-xs rounded-full mb-1.5 md:mb-2">
                        {agenda.type}
                      </span>
                      <h3 className="text-lg md:text-xl font-black text-sky-950 leading-tight">{agenda.name}</h3>
                      <p className="text-xs md:text-sm font-medium text-sky-800/80 mt-1">{agenda.theme}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-sky-900/70">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500" />
                      {agenda.start_date} {agenda.end_date ? `- ${agenda.end_date}` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-sky-900/70">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                      {agenda.start_time} - {agenda.end_time}
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-sky-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {agenda.hasAttended ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 md:gap-3 w-full sm:w-auto">
                        <div className="flex items-center justify-center gap-1.5 md:gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-emerald-100 shadow-sm text-xs md:text-sm">
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                          Sudah Presensi
                        </div>
                        {agenda.hasPostTest && (
                          agenda.hasTakenPostTest ? (
                            <div className="flex items-center justify-center gap-1.5 md:gap-2 text-indigo-700 font-extrabold bg-indigo-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-indigo-100 shadow-sm text-xs md:text-sm">
                              <Award className="w-4 h-4 md:w-5 md:h-5" />
                              Skor Post Test: {agenda.postTestScore}
                            </div>
                          ) : (
                            <button
                              onClick={() => startKuis(agenda)}
                              className="flex items-center justify-center gap-1.5 md:gap-2 font-bold px-4 md:px-5 py-1.5 md:py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all text-xs md:text-sm w-full sm:w-auto"
                            >
                              <FileText className="w-4 h-4 md:w-5 md:h-5" />
                              Mulai Post Test
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleHadir(agenda.id)}
                        disabled={submitting || !agenda.is_open_now}
                        className={`flex items-center justify-center gap-1.5 md:gap-2 font-bold px-5 md:px-6 py-2 md:py-2.5 rounded-xl shadow-sm transition-all text-xs md:text-sm w-full sm:w-auto ${
                          !agenda.is_open_now ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 text-white hover:shadow-sky-600/30'
                        }`}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
                        {agenda.is_open_now ? 'Klik Hadir' : 'Belum Waktunya / Ditutup'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isKuisModalOpen && activeKuis && (
        <div onClick={() => setIsKuisModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative cursor-default">
            <button 
              onClick={() => setIsKuisModalOpen(false)} 
              className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {kuisResult ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Kuis Selesai!</h3>
                  <p className="text-slate-500 font-medium mt-2">Terima kasih telah mengerjakan post test untuk agenda {activeKuis.name}.</p>
                </div>
                <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl px-10 py-6 shadow-xl">
                  <p className="text-sm font-bold uppercase tracking-wider opacity-80">Skor Anda</p>
                  <p className="text-5xl font-black mt-1">{kuisResult.score}</p>
                  <p className="text-xs font-semibold mt-2 opacity-90">{kuisResult.correctCount} dari {kuisResult.totalCount} jawaban benar</p>
                </div>
                <div>
                  <button 
                    onClick={() => setIsKuisModalOpen(false)}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
                  >
                    Tutup Halaman
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">POST TEST</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{activeKuis.name}</h3>
                  <p className="text-slate-500 text-sm font-semibold mt-1">Harap jawab seluruh pertanyaan di bawah ini dengan jujur.</p>
                </div>

                <form onSubmit={handleKuisSubmit} className="space-y-8">
                  {kuisQuestions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-base flex gap-2">
                        <span>{qIdx + 1}.</span>
                        <span>{q.question}</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = kuisAnswers[q.id] === String(optIdx);
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setKuisAnswers(prev => ({ ...prev, [q.id]: String(optIdx) }))}
                              className={`text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-indigo-500 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                              }`}
                            >
                              <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-white bg-white/20' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {kuisQuestions.length === 0 && (
                    <div className="flex justify-center items-center py-10 text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  {kuisQuestions.length > 0 && (
                    <button
                      type="submit"
                      disabled={submittingKuis || Object.keys(kuisAnswers).length < kuisQuestions.length}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingKuis ? 'Mengirimkan Jawaban...' : 'Kirim Jawaban Post Test'}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
