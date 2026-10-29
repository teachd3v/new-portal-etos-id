"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Loader2, Award,
  FileText, X, Paperclip, ExternalLink, UploadCloud, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EtoserPresensiPage() {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState('');

  // Kuis states (Pre-Test & Post-Test)
  const [activeKuis, setActiveKuis] = useState(null);
  const [activeKuisType, setActiveKuisType] = useState('POST_TEST'); // 'PRE_TEST' | 'POST_TEST'
  const [kuisQuestions, setKuisQuestions] = useState([]);
  const [kuisAnswers, setKuisAnswers] = useState({});
  const [isKuisModalOpen, setIsKuisModalOpen] = useState(false);
  const [submittingKuis, setSubmittingKuis] = useState(false);
  const [kuisResult, setKuisResult] = useState(null);

  // Penugasan states
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [activeSubmissionAgenda, setActiveSubmissionAgenda] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    file_name: '',
    file_url: '',
    link_url: '',
    notes: ''
  });
  const [submittingSubmission, setSubmittingSubmission] = useState(false);

  useEffect(() => {
    const fetchPresensi = async () => {
      setLoading(true);
      try {
        const userRes = await fetch('/api/auth/me');
        let currentUserId = 'E2023019';
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
        setIsSubmissionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSubmissionModal = (agenda) => {
    setActiveSubmissionAgenda(agenda);
    if (agenda.submission) {
      setSubmissionForm({
        file_name: agenda.submission.file_name || '',
        file_url: agenda.submission.file_url || '',
        link_url: agenda.submission.link_url || '',
        notes: agenda.submission.notes || ''
      });
    } else {
      setSubmissionForm({
        file_name: '',
        file_url: '',
        link_url: '',
        notes: ''
      });
    }
    setIsSubmissionModalOpen(true);
  };

  const handleSubmissionFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 750 * 1024) {
      toast.error(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) melebihi batas simpan langsung database (maks. 750KB). Silakan gunakan Metode 2: Tautan Link (Google Drive / Docs) di bawah ya!`, {
        duration: 6000
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSubmissionForm(prev => ({
        ...prev,
        file_name: file.name,
        file_url: event.target.result
      }));
      toast.success(`File "${file.name}" siap diunggah`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!submissionForm.file_url && !submissionForm.link_url && !submissionForm.notes?.trim()) {
      toast.error('Harap unggah file, cantumkan tautan link, atau tuliskan jawaban/catatan tugas!');
      return;
    }

    setSubmittingSubmission(true);
    try {
      const res = await fetch(`/api/client/agenda-submission/${activeSubmissionAgenda.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          file_name: submissionForm.file_name,
          file_url: submissionForm.file_url,
          link_url: submissionForm.link_url,
          notes: submissionForm.notes
        })
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || 'Penugasan berhasil dikumpulkan!');
        setAgendas(agendas.map(a => a.id === activeSubmissionAgenda.id ? { ...a, submission: json.submission } : a));
        setIsSubmissionModalOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal mengumpulkan tugas');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmittingSubmission(false);
    }
  };

  const handleHadir = async (agendaOrId) => {
    const agendaId = typeof agendaOrId === 'object' ? agendaOrId.id : agendaOrId;
    const targetAgenda = typeof agendaOrId === 'object' ? agendaOrId : agendas.find(a => a.id === agendaId);
    
    if (targetAgenda && targetAgenda.hasPreTest && !targetAgenda.hasTakenPreTest) {
      toast.error("Harap kerjakan Pre-Test terlebih dahulu sebelum presensi!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/etoser/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda_id: agendaId, userId })
      });

      if (res.ok) {
        toast.success("Presensi berhasil dicatat! Penugasan & Post-Test kini terbuka.");
        setAgendas(agendas.map(a => a.id === agendaId ? { ...a, hasAttended: true } : a));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal mencatat presensi");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const startKuis = async (agenda, testType = 'POST_TEST') => {
    if (testType === 'POST_TEST' && agenda.hasPreTest && !agenda.hasTakenPreTest) {
      toast.error("Harap kerjakan Pre-Test terlebih dahulu sebelum Post-Test!");
      return;
    }
    setActiveKuis(agenda);
    setActiveKuisType(testType);
    setKuisAnswers({});
    setKuisResult(null);
    setIsKuisModalOpen(true);
    setKuisQuestions([]);
    try {
      const res = await fetch(`/api/client/post-test/${agenda.id}?type=${testType}`);
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
        body: JSON.stringify({ userId, answers: kuisAnswers, testType: activeKuisType })
      });
      if (res.ok) {
        const json = await res.json();
        setKuisResult(json);
        const label = activeKuisType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test';
        toast.success(`${label} selesai! Skor: ${json.score}`);
        
        setAgendas(agendas.map(a => {
          if (a.id !== activeKuis.id) return a;
          if (activeKuisType === 'PRE_TEST') {
            const gain = a.postTestScore !== null ? a.postTestScore - json.score : null;
            return { ...a, hasTakenPreTest: true, preTestScore: json.score, gainScore: gain };
          } else {
            const gain = a.preTestScore !== null ? json.score - a.preTestScore : null;
            return { ...a, hasTakenPostTest: true, postTestScore: json.score, gainScore: gain };
          }
        }));
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
              Presensi, Pre-Test & Post-Test
            </h1>
            <p className="text-sky-100/90 font-medium text-xs md:text-lg max-w-xl hidden md:block">
              Kerjakan Pre-Test sebelum kegiatan, klik &quot;Hadir&quot; saat kegiatan berlangsung, dan selesaikan Post-Test setelahnya.
            </p>
          </div>
        </div>
        
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
            {agendas.map(agenda => {
              const needsPreTest = Boolean(agenda.hasPreTest && !agenda.hasTakenPreTest);
              const isPreTestDone = Boolean(!agenda.hasPreTest || agenda.hasTakenPreTest);
              const needsAttendance = Boolean(isPreTestDone && !agenda.hasAttended);
              const isAttended = Boolean(agenda.hasAttended);
              const hasAssignment = Boolean(agenda.hasAssignment || agenda.assignment_title || agenda.assignment_file_url || agenda.assignment_link || agenda.submission);

              return (
                <div key={agenda.id} className="bg-sky-50/50 border border-sky-100 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-200/30 rounded-full blur-2xl group-hover:bg-sky-300/40 transition-colors pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-4">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 bg-sky-100 text-sky-700 font-bold text-[10px] md:text-xs rounded-full mb-1.5 md:mb-2">
                          {agenda.type}
                        </span>
                        <h3 className="text-lg md:text-xl font-black text-sky-950 leading-tight">{agenda.name}</h3>
                        <p className="text-xs md:text-sm font-medium text-sky-800/80 mt-1">{agenda.theme}</p>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-1.5 text-xs md:text-sm font-medium text-sky-900/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500" />
                        <span>{agenda.start_date} {agenda.end_date ? `- ${agenda.end_date}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                        <span>{agenda.start_time} - {agenda.end_time}</span>
                      </div>
                    </div>

                    {/* Sequential Workflow Indicator */}
                    <div className="flex items-center justify-between gap-1 p-2 bg-white/70 border border-sky-100 rounded-xl text-[10px] md:text-[11px] font-bold">
                      {/* Step 1: Pre-Test */}
                      {agenda.hasPreTest && (
                        <>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                            agenda.hasTakenPreTest 
                              ? 'bg-emerald-100/90 text-emerald-800' 
                              : 'bg-sky-600 text-white shadow-xs'
                          }`}>
                            <span>1. Pre-Test</span>
                            {agenda.hasTakenPreTest && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          </div>
                          <span className="text-slate-300 font-bold">&rarr;</span>
                        </>
                      )}

                      {/* Step 2: Presensi */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                        agenda.hasAttended
                          ? 'bg-emerald-100/90 text-emerald-800'
                          : needsAttendance
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 bg-slate-100'
                      }`}>
                        <span>{agenda.hasPreTest ? '2.' : '1.'} Presensi</span>
                        {agenda.hasAttended && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                      </div>

                      {/* Step 3: Tugas / Post-Test */}
                      {(hasAssignment || agenda.hasPostTest) && (
                        <>
                          <span className="text-slate-300 font-bold">&rarr;</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                            isAttended
                              ? 'bg-amber-100/90 text-amber-900 border border-amber-200'
                              : 'text-slate-400 bg-slate-100'
                          }`}>
                            <span>
                              {agenda.hasPreTest ? '3.' : '2.'}{' '}
                              {hasAssignment && agenda.hasPostTest
                                ? 'Tugas & Post-Test'
                                : hasAssignment
                                ? 'Penugasan'
                                : 'Post-Test'}
                            </span>
                            {isAttended && (agenda.submission || (agenda.hasPostTest && agenda.hasTakenPostTest)) && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* ============================================================ */}
                    {/* TAHAP 1: PRE-TEST (Hanya jika ada Pre-Test & belum selesai) */}
                    {/* ============================================================ */}
                    {needsPreTest && (
                      <div className="p-4 bg-sky-100/80 border border-sky-300/80 rounded-2xl space-y-3 shadow-xs animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 bg-sky-200/90 px-2 py-0.5 rounded-md">
                              Tahap 1: Wajib Pre-Test
                            </span>
                            <h4 className="text-sm font-black text-sky-950 mt-1">
                              Kerjakan Pre-Test Sebelum Kegiatan
                            </h4>
                            <p className="text-xs text-sky-900/80 mt-0.5 leading-relaxed">
                              Anda wajib menyelesaikan soal Pre-Test terlebih dahulu untuk membuka sesi presensi kehadiran agenda ini.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => startKuis(agenda, 'PRE_TEST')}
                          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Mulai Pengerjaan Pre-Test &rarr;</span>
                        </button>
                      </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAHAP 2: PRESENSI KEHADIRAN (Pre-Test selesai & belum presensi) */}
                    {/* ============================================================ */}
                    {needsAttendance && (
                      <div className="space-y-3 animate-in fade-in">
                        {agenda.hasTakenPreTest && (
                          <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Pre-Test Selesai</span>
                            </div>
                            <span className="bg-emerald-200/70 text-emerald-950 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              Skor: {agenda.preTestScore}
                            </span>
                          </div>
                        )}

                        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-3 shadow-xs">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${agenda.is_open_now ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-200/80 px-2 py-0.5 rounded-md">
                                {agenda.hasPreTest ? 'Tahap 2: Presensi Kehadiran' : 'Presensi Kehadiran'}
                              </span>
                              <h4 className="text-sm font-black text-indigo-950 mt-1">
                                {agenda.is_open_now ? 'Sesi Presensi Dibuka' : 'Jadwal Presensi'}
                              </h4>
                              <p className="text-xs text-indigo-900/80 mt-0.5 leading-relaxed">
                                {agenda.is_open_now
                                  ? 'Silakan catat kehadiran Anda. Setelah presensi, keterangan penugasan dan materi kegiatan akan otomatis terbuka.'
                                  : `Presensi hanya dapat dilakukan pada jadwal kegiatan (${agenda.start_time} - ${agenda.end_time}).`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleHadir(agenda)}
                            disabled={submitting || !agenda.is_open_now}
                            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              !agenda.is_open_now
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                            }`}
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>{agenda.is_open_now ? 'Klik Hadir Sekarang' : 'Belum Waktunya / Sesi Ditutup'}</span>
                          </button>
                        </div>

                        {(hasAssignment || agenda.hasPostTest) && (
                          <div className="p-3 bg-slate-100/90 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {hasAssignment && agenda.hasPostTest
                                ? 'Keterangan penugasan & Post-Test akan terbuka setelah Anda melakukan presensi.'
                                : hasAssignment
                                ? 'Keterangan penugasan kegiatan akan terbuka setelah Anda melakukan presensi.'
                                : 'Post-Test kegiatan akan terbuka setelah Anda melakukan presensi.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAHAP 3: SUDAH PRESENSI -> PENUGASAN & POST-TEST TERBUKA */}
                    {/* ============================================================ */}
                    {isAttended && (
                      <div className="space-y-3.5 animate-in fade-in">
                        {/* Status Bar: Presensi & Pre-Test */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Sudah Presensi</span>
                          </div>

                          {agenda.hasTakenPreTest && (
                            <div className="flex items-center gap-1.5 text-sky-700 font-bold bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs shadow-xs">
                              <Award className="w-4 h-4 text-sky-600" />
                              <span>Skor Pre-Test: {agenda.preTestScore}</span>
                            </div>
                          )}
                        </div>

                        {/* Penugasan Kegiatan Card */}
                        {hasAssignment && (
                          <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 inline-flex items-center gap-1">
                                <Paperclip className="w-3 h-3 text-amber-700" />
                                Penugasan Kegiatan
                              </span>
                              {agenda.submission ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Terkumpul
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Belum Mengumpulkan
                                </span>
                              )}
                            </div>

                            {agenda.assignment_title && (
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {agenda.assignment_title}
                              </p>
                            )}

                            {/* Panduan / Link dari Admin atau Fasil */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {agenda.assignment_file_url && (
                                <a
                                  href={agenda.assignment_file_url}
                                  download={agenda.assignment_file_name || 'panduan-penugasan'}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-white hover:bg-amber-100/70 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Unduh Panduan Tugas ({agenda.assignment_file_name || 'File'})</span>
                                </a>
                              )}
                              {agenda.assignment_link && (
                                <a
                                  href={agenda.assignment_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-indigo-700" />
                                  <span>Buka Link Penugasan &rarr;</span>
                                </a>
                              )}
                            </div>

                            {/* Detail Pengumpulan Peserta */}
                            {agenda.submission && (
                              <div className="mt-2 pt-2 border-t border-amber-200/60 text-xs text-slate-700 space-y-1">
                                <p className="text-[11px] font-bold text-amber-900">Pengumpulan Tugas Kamu:</p>
                                {agenda.submission.file_url && (
                                  <a
                                    href={agenda.submission.file_url}
                                    download={agenda.submission.file_name || 'tugas-saya'}
                                    className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1.5"
                                  >
                                    <Paperclip className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span className="truncate">{agenda.submission.file_name || 'Unduh File Tugas Saya'}</span>
                                  </a>
                                )}
                                {agenda.submission.link_url && (
                                  <a
                                    href={agenda.submission.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-indigo-800 hover:underline flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="truncate">{agenda.submission.link_url}</span>
                                  </a>
                                )}
                                {agenda.submission.notes && (
                                  <p className="text-[11px] text-slate-600 italic">Catatan: {agenda.submission.notes}</p>
                                )}
                              </div>
                            )}

                            {/* Tombol Kumpulkan / Ubah Penugasan */}
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => openSubmissionModal(agenda)}
                                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  agenda.submission
                                    ? 'bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-300'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                                }`}
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>{agenda.submission ? 'Ubah / Perbarui Penugasan' : 'Unggah / Kumpulkan Penugasan'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Post-Test Section */}
                        {agenda.hasPostTest && (
                          <div className="pt-1">
                            {agenda.hasTakenPostTest ? (
                              <div className="flex items-center justify-between p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-indigo-600" />
                                  <span>Post-Test Selesai • Skor: {agenda.postTestScore}</span>
                                </div>
                                {agenda.gainScore !== null && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    agenda.gainScore >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    Gain: {agenda.gainScore > 0 ? `+${agenda.gainScore}` : agenda.gainScore}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-900 inline-flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-orange-700" /> Post-Test Kegiatan
                                  </span>
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Belum Dikerjakan
                                  </span>
                                </div>
                                <p className="text-xs text-orange-950 font-medium">
                                  Selesaikan Post-Test untuk mengukur pemahaman materi setelah mengikuti kegiatan.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => startKuis(agenda, 'POST_TEST')}
                                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Mulai Kerjakan Post-Test &rarr;</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {!hasAssignment && !agenda.hasPostTest && (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Presensi telah tercatat. Rangkaian agenda ini telah selesai.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isKuisModalOpen && activeKuis && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setIsKuisModalOpen(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative cursor-default">
            <button 
              onClick={() => setIsKuisModalOpen(false)} 
              className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {kuisResult ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {activeKuisType === 'PRE_TEST' ? 'Pre-Test Selesai!' : 'Post-Test Selesai!'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-2">
                    Terima kasih telah mengerjakan {activeKuisType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} untuk agenda {activeKuis.name}.
                  </p>
                </div>
                <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl px-10 py-6 shadow-xl">
                  <p className="text-sm font-bold uppercase tracking-wider opacity-80">Skor Anda</p>
                  <p className="text-5xl font-black mt-1">{kuisResult.score}</p>
                  <p className="text-xs font-semibold mt-2 opacity-90">{kuisResult.correctCount} dari {kuisResult.totalCount} jawaban benar</p>
                </div>
                <div>
                  <button 
                    onClick={() => setIsKuisModalOpen(false)}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Tutup Halaman
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg border ${
                    activeKuisType === 'PRE_TEST'
                      ? 'text-sky-700 bg-sky-50 border-sky-200'
                      : 'text-indigo-600 bg-indigo-50 border-indigo-100'
                  }`}>
                    {activeKuisType === 'PRE_TEST' ? 'PRE-TEST' : 'POST-TEST'}
                  </span>
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
                              className={`text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
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
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {submittingKuis
                        ? 'Mengirimkan Jawaban...'
                        : `Kirim Jawaban ${activeKuisType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}`}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PENGUMPULAN PENUGASAN ETOSER */}
      {isSubmissionModalOpen && activeSubmissionAgenda && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setIsSubmissionModalOpen(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 relative cursor-default space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                  Pengumpulan Tugas
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{activeSubmissionAgenda.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{activeSubmissionAgenda.theme || 'Agenda Pembinaan'}</p>
              </div>
              <button onClick={() => setIsSubmissionModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form 2 Metode Pengumpulan */}
            <form onSubmit={handleSubmissionSubmit} className="space-y-4">
              {/* Metode 1: File */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Metode 1: Unggah File Penugasan
                </label>
                {submissionForm.file_name ? (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">{submissionForm.file_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmissionForm(prev => ({ ...prev, file_name: '', file_url: '' }))}
                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white rounded-xl cursor-pointer transition-colors group">
                    <UploadCloud className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-800">Pilih File Tugas</span>
                    <span className="text-[10px] text-amber-700/80 font-medium">Dokumen / Gambar (Maks. 750KB)</span>
                    <span className="text-[9px] text-slate-400">Untuk file besar (&gt; 750KB), harap gunakan Metode 2: Tautan Link di bawah</span>
                    <input type="file" className="hidden" onChange={handleSubmissionFileUpload} />
                  </label>
                )}
              </div>

              {/* Metode 2: Link */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Metode 2: Tautan Link Penugasan
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={submissionForm.link_url || ''}
                    onChange={(e) => setSubmissionForm(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://drive.google.com/... atau link dokumen tugas"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Bisa berupa link Google Drive, Docs, Canva, Github, atau tautan tugas lainnya.
                </span>
              </div>

              {/* Catatan / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={submissionForm.notes || ''}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Tuliskan catatan pengumpulan tugas jika ada..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSubmission || (!submissionForm.file_url && !submissionForm.link_url && !submissionForm.notes?.trim())}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all cursor-pointer text-xs md:text-sm"
              >
                {submittingSubmission ? 'Mengirim Penugasan...' : 'Simpan & Kumpulkan Penugasan'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
