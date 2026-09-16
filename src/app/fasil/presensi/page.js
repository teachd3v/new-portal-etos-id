"use client";
import { useState, useEffect, Suspense } from 'react';
import { Users, Calendar, Search, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Award, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function FasilPresensiContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'self';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]); // binaan monitoring data
  const [fasilAgendas, setFasilAgendas] = useState([]); // self agendas
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingSelf, setSubmittingSelf] = useState(false);
  const [userId, setUserId] = useState('');
  const [expandedAgendas, setExpandedAgendas] = useState(new Set([0]));

  const toggleAgendaExpand = (idx) => {
    setExpandedAgendas(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Kuis states
  const [activeKuis, setActiveKuis] = useState(null);
  const [kuisQuestions, setKuisQuestions] = useState([]);
  const [kuisAnswers, setKuisAnswers] = useState({});
  const [isKuisModalOpen, setIsKuisModalOpen] = useState(false);
  const [submittingKuis, setSubmittingKuis] = useState(false);
  const [kuisResult, setKuisResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserId(userData.id);
        }

        const res = await fetch('/api/fasil/presensi');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setFasilAgendas(json.fasilAgendas || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data presensi");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsKuisModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHadirSelf = async (agendaId) => {
    setSubmittingSelf(true);
    try {
      const res = await fetch('/api/fasil/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda_id: agendaId })
      });

      if (res.ok) {
        toast.success("Presensi mandiri berhasil dicatat!");
        setFasilAgendas(fasilAgendas.map(a => a.id === agendaId ? { ...a, hasAttended: true } : a));
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mencatat presensi");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingSelf(false);
    }
  };

  const startKuis = async (agenda) => {
    setActiveKuis(agenda);
    setKuisAnswers({});
    setKuisResult(null);
    setIsKuisModalOpen(true);
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
        setFasilAgendas(fasilAgendas.map(a => 
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

  if (loading && data.length === 0 && fasilAgendas.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <Users className="w-7 h-7 md:w-10 md:h-10 text-orange-100" />
              Presensi & Pemantauan
            </h1>
            <p className="hidden md:block text-orange-100 font-medium text-base md:text-lg max-w-xl">
              Lakukan presensi mandiri atau pantau tingkat kehadiran Etoser binaanmu di setiap agenda wajib.
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md border border-white/40 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 shrink-0">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm text-orange-100 font-bold uppercase tracking-wider">Presensi Mandiri Fasil</p>
              <p className="text-xl md:text-3xl font-black">{fasilAgendas.length}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {activeTab === 'self' ? (
        /* Presensi Mandiri Tab */
        fasilAgendas.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-8 md:p-12 rounded-2xl md:rounded-[2rem] shadow-sm text-center">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-orange-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-slate-700">Tidak ada agenda presensi mandiri saat ini.</h3>
            <p className="text-slate-500 mt-1 md:mt-2 text-xs md:text-sm">Belum ada agenda wajib untuk Fasilitator yang sedang berlangsung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {fasilAgendas.map(agenda => (
              <div key={agenda.id} className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 md:p-6 hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl group-hover:bg-orange-300/30 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 md:py-1 bg-orange-100 text-orange-700 font-bold text-[10px] md:text-xs rounded-full mb-1.5 md:mb-2">
                        {agenda.type}
                      </span>
                      <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{agenda.name}</h3>
                      <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5 md:mt-1">{agenda.theme}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" />
                      {agenda.start_date} {agenda.end_date ? `- ${agenda.end_date}` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                      {agenda.start_time} - {agenda.end_time}
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-orange-200/50 flex justify-between items-center">
                    {agenda.hasAttended ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 md:gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-emerald-100 shadow-sm text-xs md:text-sm">
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                          Sudah Presensi
                        </div>
                        {agenda.hasPostTest && (
                          agenda.hasTakenPostTest ? (
                            <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 font-extrabold bg-indigo-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-indigo-100 shadow-sm text-xs md:text-sm">
                              <Award className="w-4 h-4 md:w-5 md:h-5" />
                              Skor: {agenda.postTestScore}
                            </div>
                          ) : (
                            <button
                              onClick={() => startKuis(agenda)}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all text-xs md:text-sm cursor-pointer"
                            >
                              <FileText className="w-4 h-4 md:w-5 md:h-5" />
                              Mulai Post Test
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleHadirSelf(agenda.id)}
                        disabled={submittingSelf || !agenda.is_open_now}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-5 md:px-6 py-2 md:py-2.5 rounded-xl shadow-sm transition-all text-xs md:text-sm cursor-pointer ${
                          !agenda.is_open_now ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-orange-600/30'
                        }`}
                      >
                        {submittingSelf ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        {agenda.is_open_now ? 'Klik Hadir' : 'Belum Waktunya / Ditutup'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Pemantauan Binaan Tab */
        data.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-8 md:p-12 rounded-2xl md:rounded-[2rem] shadow-sm text-center">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-orange-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-slate-700">Tidak ada agenda pembinaan saat ini.</h3>
            <p className="text-slate-500 mt-1 md:mt-2 text-xs md:text-sm">Belum ada data pemantauan etoser binaan yang aktif.</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-8">
            {data.map((item, idx) => {
              const isExpanded = expandedAgendas.has(idx);
              return (
                <div key={idx} className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] shadow-sm overflow-hidden">
                  
                  <div 
                    onClick={() => toggleAgendaExpand(idx)}
                    className="p-4 md:p-8 border-b border-orange-100 bg-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 cursor-pointer hover:bg-orange-50/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <span className={`px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                          item.agenda.type === 'Nasional' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.agenda.type}
                        </span>
                        <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold">
                          {item.agenda.activity_type}
                        </span>
                      </div>
                      <h2 className="text-lg md:text-2xl font-black text-slate-800 leading-tight">{item.agenda.name}</h2>
                      <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5 md:mt-1">
                        Tema: {item.agenda.theme} &bull; {item.agenda.start_date}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                      <div className="bg-orange-50 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-orange-100 text-center">
                        <p className="text-[10px] md:text-xs font-bold text-orange-500 uppercase tracking-wider mb-0.5">Kehadiran</p>
                        <p className="text-lg md:text-2xl font-black text-orange-700">
                          {item.totalHadir} <span className="text-xs md:text-base text-orange-400 font-medium">/ {item.totalEtoser}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-700 md:hidden bg-orange-100/60 px-2.5 py-1.5 rounded-lg">
                        <span>{isExpanded ? 'Tutup' : 'Lihat'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 md:p-8 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                        <h3 className="font-bold text-base md:text-lg text-slate-700">Daftar Etoser</h3>
                        <div className="relative w-full sm:w-auto">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Cari nama..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {item.etoserStatus
                          .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((etoser) => (
                          <div key={etoser.id} className="flex items-center justify-between p-3.5 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm text-white shadow-sm shrink-0 ${
                                etoser.hadir ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}>
                                {etoser.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-700 text-xs md:text-sm truncate" title={etoser.name}>
                                  {etoser.name}
                                </h4>
                                <p className="text-[10px] md:text-xs text-slate-400">{etoser.id} &bull; {etoser.angkatan}</p>
                              </div>
                            </div>
                            
                            <div className="shrink-0">
                              {etoser.hadir ? (
                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 md:px-2.5 py-1 rounded-lg border border-emerald-100 text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Hadir</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-rose-500 bg-rose-50 px-2 md:px-2.5 py-1 rounded-lg border border-rose-100 text-xs font-bold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Alpa</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )
      )}

      {isKuisModalOpen && activeKuis && (
        <div onClick={() => setIsKuisModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative cursor-default">
            <button 
              onClick={() => setIsKuisModalOpen(false)} 
              className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {kuisResult ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Kuis Selesai!</h3>
                  <p className="text-slate-500 font-medium mt-2">Terima kasih telah mengerjakan post test untuk agenda {activeKuis.name}.</p>
                </div>
                <div className="inline-block bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl px-10 py-6 shadow-xl">
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
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">POST TEST</span>
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
                                  ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20' 
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
                    <div className="flex justify-center items-center py-10 text-orange-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  {kuisQuestions.length > 0 && (
                    <button
                      type="submit"
                      disabled={submittingKuis || Object.keys(kuisAnswers).length < kuisQuestions.length}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

export default function FasilPresensiPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <FasilPresensiContent />
    </Suspense>
  );
}
