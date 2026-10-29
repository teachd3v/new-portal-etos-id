"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Users, Calendar, Search, Loader2, CheckCircle2, XCircle,
  Clock, AlertCircle, Award, FileText, X, ChevronDown, ChevronUp,
  Plus, Edit2, Trash2, Copy, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

const EMPTY_FASIL_AGENDA_FORM = {
  id: "",
  name: "",
  type: "Wilayah",
  activity_type: "",
  theme: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  is_active: true,
  target_role: "ETOSER",
  preTestQuestions: [],
  questions: []
};

function FasilQuestionBuilder({
  title,
  badgeText,
  questions = [],
  onAdd,
  onRemove,
  onChange,
  onCopyFromPreTest,
  emptyText
}) {
  return (
    <div className="border-t border-orange-100 pt-5 mt-5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-900 text-sm md:text-base">{title} ({questions.length})</h4>
          {badgeText && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
              {badgeText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCopyFromPreTest && (
            <button
              type="button"
              onClick={onCopyFromPreTest}
              className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin dari Pre-Test</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-all cursor-pointer"
          >
            + Tambah Soal
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 space-y-3 relative">
            <button
              type="button"
              onClick={() => onRemove(qIdx)}
              className="absolute right-3 top-3 text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="pr-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">Soal {qIdx + 1}</label>
              <textarea
                required
                value={q.question}
                onChange={(e) => onChange(qIdx, 'question', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm text-slate-900"
                rows={2}
                placeholder="Tulis pertanyaan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(q.options || ["", "", "", ""]).map((opt, optIdx) => (
                <div key={optIdx}>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Opsi {String.fromCharCode(65 + optIdx)}</label>
                  <input
                    required
                    type="text"
                    value={opt}
                    onChange={(e) => onChange(qIdx, 'options', { idx: optIdx, val: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs text-slate-900"
                    placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban</label>
              <select
                value={q.correct_option}
                onChange={(e) => onChange(qIdx, 'correct_option', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs text-slate-900 font-bold"
              >
                <option value="0">Opsi A (Correct)</option>
                <option value="1">Opsi B (Correct)</option>
                <option value="2">Opsi C (Correct)</option>
                <option value="3">Opsi D (Correct)</option>
              </select>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-xs text-center text-slate-400 bg-orange-50/20 rounded-xl py-5 border border-dashed border-orange-200">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function FasilPresensiContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'self';
  const [loading, setLoading] = useState(true);
  const [fasilWilayah, setFasilWilayah] = useState('');
  const [data, setData] = useState([]); // active binaan monitoring data
  const [allBinaanSummary, setAllBinaanSummary] = useState([]); // all agendas binaan score data
  const [fasilAgendas, setFasilAgendas] = useState([]); // self agendas
  const [managedAgendas, setManagedAgendas] = useState([]); // agendas for Kelola Agenda tab
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingSelf, setSubmittingSelf] = useState(false);
  const [userId, setUserId] = useState('');
  const [expandedAgendas, setExpandedAgendas] = useState(new Set([0]));

  // Skor tab filter states
  const [selectedSkorAgendaId, setSelectedSkorAgendaId] = useState('ALL');
  const [skorStatusFilter, setSkorStatusFilter] = useState('ALL');
  const [skorSearchQuery, setSkorSearchQuery] = useState('');

  // Kelola Agenda modal states
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [agendaForm, setAgendaForm] = useState(EMPTY_FASIL_AGENDA_FORM);
  const [savingAgenda, setSavingAgenda] = useState(false);

  const toggleAgendaExpand = (idx) => {
    setExpandedAgendas(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Kuis states (Pre-Test & Post-Test)
  const [activeKuis, setActiveKuis] = useState(null);
  const [activeKuisType, setActiveKuisType] = useState('POST_TEST'); // 'PRE_TEST' | 'POST_TEST'
  const [kuisQuestions, setKuisQuestions] = useState([]);
  const [kuisAnswers, setKuisAnswers] = useState({});
  const [isKuisModalOpen, setIsKuisModalOpen] = useState(false);
  const [submittingKuis, setSubmittingKuis] = useState(false);
  const [kuisResult, setKuisResult] = useState(null);

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
        setFasilWilayah(json.wilayah || '');
        setData(json.data || []);
        setAllBinaanSummary(json.allBinaanSummary || json.data || []);
        setFasilAgendas(json.fasilAgendas || []);
        setManagedAgendas(json.managedAgendas || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data presensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsKuisModalOpen(false);
        setIsAgendaModalOpen(false);
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
        
        setFasilAgendas(fasilAgendas.map(a => {
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

  // Kelola Agenda handlers for Fasil
  const openAddAgendaModal = () => {
    setIsEditingAgenda(false);
    setAgendaForm({
      ...EMPTY_FASIL_AGENDA_FORM,
      type: "Wilayah",
      theme: fasilWilayah ? `Wilayah ${fasilWilayah}` : ""
    });
    setIsAgendaModalOpen(true);
  };

  const openEditAgendaModal = async (agenda) => {
    setIsEditingAgenda(true);
    try {
      const res = await fetch(`/api/admin/agendas/${agenda.id}`);
      if (res.ok) {
        const d = await res.json();
        setAgendaForm({
          ...d.agenda,
          target_role: d.agenda.target_role || "ETOSER",
          preTestQuestions: d.preTestQuestions || [],
          questions: d.questions || []
        });
      } else {
        setAgendaForm({
          ...agenda,
          target_role: agenda.target_role || "ETOSER",
          preTestQuestions: [],
          questions: []
        });
      }
    } catch {
      setAgendaForm({
        ...agenda,
        target_role: agenda.target_role || "ETOSER",
        preTestQuestions: [],
        questions: []
      });
    }
    setIsAgendaModalOpen(true);
  };

  const handleSaveAgenda = async (e) => {
    e.preventDefault();
    setSavingAgenda(true);
    try {
      const url = isEditingAgenda ? `/api/admin/agendas/${agendaForm.id}` : '/api/admin/agendas';
      const method = isEditingAgenda ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agendaForm,
          is_active: agendaForm.is_active === 'true' || agendaForm.is_active === true
        })
      });
      if (res.ok) {
        toast.success(isEditingAgenda ? 'Agenda & soal berhasil diperbarui' : 'Agenda baru berhasil dibuat');
        setIsAgendaModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan agenda');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleDeleteAgenda = async (agenda) => {
    if (!window.confirm(`Hapus agenda "${agenda.name}" beserta soal tesnya?`)) return;
    try {
      const res = await fetch(`/api/admin/agendas/${agenda.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Agenda berhasil dihapus');
        fetchData();
      } else {
        toast.error('Gagal menghapus agenda');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const updateAgendaFormQuestions = (listKey, index, field, value) => {
    setAgendaForm(prev => {
      const updated = [...(prev[listKey] || [])];
      if (field === 'options') {
        const opts = [...updated[index].options];
        opts[value.idx] = value.val;
        updated[index] = { ...updated[index], options: opts };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, [listKey]: updated };
    });
  };

  const addAgendaFormQuestion = (listKey) => {
    setAgendaForm(prev => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), { question: "", options: ["", "", "", ""], correct_option: "0" }]
    }));
  };

  const removeAgendaFormQuestion = (listKey, index) => {
    setAgendaForm(prev => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((_, i) => i !== index)
    }));
  };

  const copyPreTestToPostTestFasil = () => {
    if (!agendaForm.preTestQuestions || agendaForm.preTestQuestions.length === 0) {
      toast.error('Belum ada soal Pre-Test untuk disalin');
      return;
    }
    const cloned = agendaForm.preTestQuestions.map(q => ({
      question: q.question,
      options: [...(q.options || ["", "", "", ""])],
      correct_option: String(q.correct_option ?? "0")
    }));
    setAgendaForm(prev => ({ ...prev, questions: cloned }));
    toast.success(`${cloned.length} soal Pre-Test disalin ke Post-Test`);
  };

  // Skor Pre & Post Test derived rows for Fasil
  const skorRows = useMemo(() => {
    const sourceAgendas = selectedSkorAgendaId === 'ALL'
      ? allBinaanSummary
      : allBinaanSummary.filter(item => item.agenda.id === selectedSkorAgendaId);

    const rows = [];
    for (const item of sourceAgendas) {
      for (const p of item.etoserStatus || []) {
        if (skorSearchQuery) {
          const q = skorSearchQuery.toLowerCase();
          if (!p.name?.toLowerCase().includes(q) && !p.id?.toLowerCase().includes(q) && !item.agenda.name?.toLowerCase().includes(q)) {
            continue;
          }
        }
        if (skorStatusFilter === 'TAKEN_ANY' && !p.hasTakenPreTest && !p.hasTakenPostTest) continue;
        if (skorStatusFilter === 'COMPLETE' && (!p.hasTakenPreTest || !p.hasTakenPostTest)) continue;

        rows.push({
          agendaId: item.agenda.id,
          agendaName: item.agenda.name,
          agendaType: item.agenda.type,
          agendaDate: item.agenda.start_date,
          ...p
        });
      }
    }
    return rows;
  }, [allBinaanSummary, selectedSkorAgendaId, skorSearchQuery, skorStatusFilter]);

  const skorStats = useMemo(() => {
    const preList = skorRows.filter(r => r.preTestScore !== null).map(r => r.preTestScore);
    const postList = skorRows.filter(r => r.postTestScore !== null).map(r => r.postTestScore);
    const gainList = skorRows.filter(r => r.gainScore !== null).map(r => r.gainScore);

    return {
      preCount: preList.length,
      postCount: postList.length,
      avgPre: preList.length > 0 ? Math.round((preList.reduce((a, b) => a + b, 0) / preList.length) * 10) / 10 : null,
      avgPost: postList.length > 0 ? Math.round((postList.reduce((a, b) => a + b, 0) / postList.length) * 10) / 10 : null,
      avgGain: gainList.length > 0 ? Math.round((gainList.reduce((a, b) => a + b, 0) / gainList.length) * 10) / 10 : null,
    };
  }, [skorRows]);

  const exportFasilSkorCsv = () => {
    if (skorRows.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }
    const headers = ['ID Agenda', 'Nama Agenda', 'Tipe', 'Tanggal', 'ID Etoser', 'Nama Etoser', 'Angkatan', 'Wilayah', 'Kehadiran', 'Skor Pre-Test', 'Skor Post-Test', 'Gain (Post - Pre)'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      headers.map(esc).join(','),
      ...skorRows.map(r => [
        r.agendaId,
        r.agendaName,
        r.agendaType,
        r.agendaDate || '',
        r.id,
        r.name,
        r.angkatan || '',
        r.wilayah || fasilWilayah || '',
        r.hadir ? 'Hadir' : 'Alpa',
        r.preTestScore ?? '',
        r.postTestScore ?? '',
        r.gainScore !== null ? (r.gainScore > 0 ? `+${r.gainScore}` : r.gainScore) : ''
      ].map(esc).join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `skor-binaan-${fasilWilayah || 'wilayah'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data skor binaan berhasil di-export ke CSV');
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
              {activeTab === 'skor'
                ? 'Skor Pre-Test & Post-Test'
                : activeTab === 'agenda'
                ? 'Kelola Agenda & Setup Soal'
                : 'Presensi & Pemantauan'}
            </h1>
            <p className="hidden md:block text-orange-100 font-medium text-base md:text-lg max-w-xl">
              {activeTab === 'skor'
                ? `Pantau hasil Pre-Test, Post-Test, dan kenaikan skor (Gain) Etoser binaan wilayah ${fasilWilayah || 'Anda'}.`
                : activeTab === 'agenda'
                ? 'Buat atau edit agenda pembinaan beserta setup soal Pre-Test dan Post-Test.'
                : 'Lakukan presensi mandiri atau pantau tingkat kehadiran Etoser binaanmu di setiap agenda wajib.'}
            </p>
          </div>
          
          {activeTab === 'agenda' ? (
            <button
              onClick={openAddAgendaModal}
              className="bg-white text-orange-700 hover:bg-orange-50 font-black py-2.5 md:py-3.5 px-5 md:px-6 rounded-xl md:rounded-2xl shadow-lg flex items-center gap-2 text-xs md:text-sm cursor-pointer shrink-0 transition-all"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>+ Tambah Agenda</span>
            </button>
          ) : activeTab === 'skor' ? (
            <button
              onClick={exportFasilSkorCsv}
              className="bg-white text-orange-700 hover:bg-orange-50 font-black py-2.5 md:py-3.5 px-5 md:px-6 rounded-xl md:rounded-2xl shadow-lg flex items-center gap-2 text-xs md:text-sm cursor-pointer shrink-0 transition-all"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span>Export CSV</span>
            </button>
          ) : (
            <div className="bg-white/20 backdrop-blur-md border border-white/40 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 shrink-0">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-orange-100 font-bold uppercase tracking-wider">Presensi Mandiri Fasil</p>
                <p className="text-xl md:text-3xl font-black">{fasilAgendas.length}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {activeTab === 'self' ? (
        /* TAB 1: Presensi Mandiri Fasil */
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

                  <div className="pt-3 md:pt-4 border-t border-orange-200/50 flex flex-wrap gap-2.5 items-center justify-between">
                    {/* Pre-Test Action / Score (Available before & during attendance) */}
                    {agenda.hasPreTest && (
                      agenda.hasTakenPreTest ? (
                        <div className="flex items-center gap-1.5 text-sky-700 font-extrabold bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 text-xs md:text-sm">
                          <Award className="w-4 h-4" />
                          <span>Skor Pre-Test: {agenda.preTestScore}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => startKuis(agenda, 'PRE_TEST')}
                          className="flex items-center justify-center gap-1.5 font-bold px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all text-xs md:text-sm cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Mulai Pre-Test</span>
                        </button>
                      )
                    )}

                    {/* Attendance Button / Status */}
                    {agenda.hasAttended ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm text-xs md:text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sudah Presensi</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleHadirSelf(agenda.id)}
                        disabled={submittingSelf || !agenda.is_open_now}
                        className={`flex items-center justify-center gap-1.5 font-bold px-4 py-2 rounded-xl shadow-sm transition-all text-xs md:text-sm cursor-pointer ${
                          !agenda.is_open_now ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {submittingSelf ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{agenda.is_open_now ? 'Klik Hadir' : 'Belum Waktunya / Ditutup'}</span>
                      </button>
                    )}

                    {/* Post-Test Action / Score (Unlocked after attendance & Pre-Test if any) */}
                    {agenda.hasAttended && agenda.hasPostTest && (
                      agenda.hasTakenPostTest ? (
                        <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs md:text-sm">
                          <Award className="w-4 h-4" />
                          <span>Skor Post-Test: {agenda.postTestScore}</span>
                          {agenda.gainScore !== null && (
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${
                              agenda.gainScore >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {agenda.gainScore > 0 ? `+${agenda.gainScore}` : agenda.gainScore}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => startKuis(agenda, 'POST_TEST')}
                          disabled={agenda.hasPreTest && !agenda.hasTakenPreTest}
                          title={agenda.hasPreTest && !agenda.hasTakenPreTest ? 'Selesaikan Pre-Test terlebih dahulu' : 'Mulai Post-Test'}
                          className={`flex items-center justify-center gap-1.5 font-bold px-4 py-2 rounded-xl transition-all text-xs md:text-sm cursor-pointer ${
                            agenda.hasPreTest && !agenda.hasTakenPreTest
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>{agenda.hasPreTest && !agenda.hasTakenPreTest ? 'Selesaikan Pre-Test Dulu' : 'Mulai Post-Test'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'skor' ? (
        /* TAB 3: Skor Pre & Post Test Binaan */
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            <div className="bg-white/80 backdrop-blur-md border border-orange-100 rounded-2xl p-4 md:p-6 shadow-sm">
              <p className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Partisipasi Tes Binaan</p>
              <p className="text-xl md:text-3xl font-black text-slate-900 mt-1">
                {skorStats.preCount} <span className="text-xs font-semibold text-slate-400">Pre</span> / {skorStats.postCount} <span className="text-xs font-semibold text-slate-400">Post</span>
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-sky-100 rounded-2xl p-4 md:p-6 shadow-sm">
              <p className="text-[11px] md:text-xs font-bold text-sky-700 uppercase tracking-wider">Rata-rata Pre-Test</p>
              <p className="text-2xl md:text-3xl font-black text-sky-900 mt-1">
                {skorStats.avgPre !== null ? skorStats.avgPre : '-'}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-2xl p-4 md:p-6 shadow-sm">
              <p className="text-[11px] md:text-xs font-bold text-indigo-700 uppercase tracking-wider">Rata-rata Post-Test</p>
              <p className="text-2xl md:text-3xl font-black text-indigo-900 mt-1">
                {skorStats.avgPost !== null ? skorStats.avgPost : '-'}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 md:p-6 shadow-sm">
              <p className="text-[11px] md:text-xs font-bold text-emerald-700 uppercase tracking-wider">Rata-rata Gain (Δ)</p>
              <p className={`text-2xl md:text-3xl font-black mt-1 ${
                skorStats.avgGain === null ? 'text-slate-400' : skorStats.avgGain >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {skorStats.avgGain !== null ? (skorStats.avgGain > 0 ? `+${skorStats.avgGain}` : skorStats.avgGain) : '-'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Agenda</label>
                <select
                  value={selectedSkorAgendaId}
                  onChange={(e) => setSelectedSkorAgendaId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="ALL">Semua Agenda ({allBinaanSummary.length})</option>
                  {allBinaanSummary.map(item => (
                    <option key={item.agenda.id} value={item.agenda.id}>
                      {item.agenda.name} ({item.agenda.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status Pengerjaan</label>
                <select
                  value={skorStatusFilter}
                  onChange={(e) => setSkorStatusFilter(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="ALL">Semua Etoser Binaan</option>
                  <option value="TAKEN_ANY">Sudah Mengerjakan (Pre / Post)</option>
                  <option value="COMPLETE">Lengkap (Pre & Post)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cari Etoser / Agenda</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skorSearchQuery}
                    onChange={(e) => setSkorSearchQuery(e.target.value)}
                    placeholder="Cari nama atau ID..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pl-2">Etoser Binaan</th>
                    <th className="pb-3">Agenda</th>
                    <th className="pb-3 text-center">Kehadiran</th>
                    <th className="pb-3 text-center">Skor Pre-Test</th>
                    <th className="pb-3 text-center">Skor Post-Test</th>
                    <th className="pb-3 text-center pr-2">Selisih / Gain (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skorRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada data skor yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    skorRows.map((row, idx) => (
                      <tr key={`${row.agendaId}-${row.id}-${idx}`} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-4 pl-2">
                          <p className="font-bold text-slate-800 text-sm">{row.name}</p>
                          <p className="text-xs text-slate-400">{row.id} &bull; Angkatan {row.angkatan}</p>
                        </td>
                        <td className="py-4">
                          <p className="font-bold text-slate-800 text-sm">{row.agendaName}</p>
                          <p className="text-xs text-slate-400">{row.agendaType} {row.agendaDate ? `• ${row.agendaDate}` : ''}</p>
                        </td>
                        <td className="py-4 text-center">
                          {row.hadir ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              Alpa
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {row.preTestScore !== null ? (
                            <span className="inline-block font-black text-sm text-sky-800 bg-sky-100/80 px-3 py-1 rounded-xl border border-sky-200">
                              {row.preTestScore}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Belum</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {row.postTestScore !== null ? (
                            <span className="inline-block font-black text-sm text-indigo-800 bg-indigo-100/80 px-3 py-1 rounded-xl border border-indigo-200">
                              {row.postTestScore}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Belum</span>
                          )}
                        </td>
                        <td className="py-4 text-center pr-2">
                          {row.gainScore !== null ? (
                            <span className={`inline-block font-black text-xs px-2.5 py-1 rounded-xl border ${
                              row.gainScore > 0
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : row.gainScore < 0
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {row.gainScore > 0 ? `+${row.gainScore}` : row.gainScore}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {skorRows.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-sm">Tidak ada data skor yang sesuai dengan filter.</p>
              ) : (
                skorRows.map((row, idx) => (
                  <div key={`${row.agendaId}-${row.id}-${idx}`} className="p-3.5 bg-white border border-orange-100 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{row.name}</h4>
                        <p className="text-[11px] text-slate-400">{row.id} &bull; {row.agendaName}</p>
                      </div>
                      {row.hadir ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Hadir</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Alpa</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-sky-50/70 rounded-xl p-2 border border-sky-100">
                        <p className="text-[10px] font-bold text-sky-700 uppercase">Pre-Test</p>
                        <p className="text-sm font-black text-sky-950">{row.preTestScore ?? '-'}</p>
                      </div>
                      <div className="bg-indigo-50/70 rounded-xl p-2 border border-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-700 uppercase">Post-Test</p>
                        <p className="text-sm font-black text-indigo-950">{row.postTestScore ?? '-'}</p>
                      </div>
                      <div className="bg-emerald-50/70 rounded-xl p-2 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Gain (Δ)</p>
                        <p className="text-sm font-black text-emerald-900">
                          {row.gainScore !== null ? (row.gainScore > 0 ? `+${row.gainScore}` : row.gainScore) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'agenda' ? (
        /* TAB 4: Kelola Agenda & Setup Soal Pre-Test / Post-Test (Fasil) */
        <div className="bg-white/80 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Daftar Agenda & Setup Soal Tes</h2>
              <p className="text-xs md:text-sm text-slate-500">Klik tombol edit untuk mengatur soal Pre-Test dan Post-Test pada agenda.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managedAgendas.map((agenda) => (
              <div key={agenda.id} className="p-4 md:p-5 bg-white border border-orange-100 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        agenda.type === 'Nasional' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {agenda.type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                        Pre-Test: {agenda.preTestCount || 0} Soal
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Post-Test: {agenda.postTestCount || 0} Soal
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      agenda.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agenda.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base md:text-lg">{agenda.name}</h3>
                  {agenda.theme && <p className="text-xs text-slate-500 mt-0.5">Tema: {agenda.theme}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {agenda.start_date || '-'} {agenda.start_time ? `• ${agenda.start_time} - ${agenda.end_time || ''}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditAgendaModal(agenda)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Setup Soal / Edit</span>
                  </button>
                  {agenda.type === 'Wilayah' && (
                    <button
                      onClick={() => handleDeleteAgenda(agenda)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                      title="Hapus Agenda Wilayah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB 2: Pemantauan Binaan Tab */
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
                        {item.agenda.activity_type && (
                          <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold">
                            {item.agenda.activity_type}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg md:text-2xl font-black text-slate-800 leading-tight">{item.agenda.name}</h2>
                      <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5 md:mt-1">
                        Tema: {item.agenda.theme || '-'} &bull; {item.agenda.start_date}
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
                            
                            <div className="shrink-0 flex flex-col items-end gap-1">
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
                              <div className="flex items-center gap-1">
                                {etoser.hasTakenPreTest && (
                                  <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                    Pre: {etoser.preTestScore}
                                  </span>
                                )}
                                {etoser.hasTakenPostTest && (
                                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    Post: {etoser.postTestScore}
                                  </span>
                                )}
                              </div>
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

      {/* MODAL KELOLA AGENDA & SETUP SOAL (FASIL) */}
      {isAgendaModalOpen && (
        <div onClick={() => setIsAgendaModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                {isEditingAgenda ? 'Edit Agenda & Setup Soal Tes' : 'Tambah Agenda Wilayah'}
              </h3>
              <button onClick={() => setIsAgendaModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Agenda</label>
                  <select
                    value={agendaForm.type}
                    onChange={(e) => setAgendaForm({ ...agendaForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900"
                  >
                    <option value="Wilayah">Wilayah</option>
                    <option value="Nasional">Nasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Peserta</label>
                  <select
                    value={agendaForm.target_role}
                    onChange={(e) => setAgendaForm({ ...agendaForm, target_role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900"
                  >
                    <option value="ETOSER">Etoser Only</option>
                    <option value="FASILITATOR">Fasilitator Only</option>
                    <option value="SEMUA">Semua (Etoser & Fasil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  required
                  type="text"
                  value={agendaForm.name}
                  onChange={(e) => setAgendaForm({ ...agendaForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  placeholder="Contoh: Pembinaan Wilayah Bulan Oktober"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Aktivitas</label>
                  <input
                    type="text"
                    value={agendaForm.activity_type || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, activity_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                    placeholder="e.g. Pembinaan Wilayah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tema (Opsional)</label>
                  <input
                    type="text"
                    value={agendaForm.theme || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, theme: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                    placeholder="Tema kegiatan..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    required
                    type="date"
                    value={agendaForm.start_date || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    required
                    type="time"
                    value={agendaForm.start_time || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    required
                    type="date"
                    value={agendaForm.end_date || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    required
                    type="time"
                    value={agendaForm.end_time || ""}
                    onChange={(e) => setAgendaForm({ ...agendaForm, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Pre-Test Builder */}
              <FasilQuestionBuilder
                title="Setup Soal Pre-Test"
                badgeText="Pre-Test"
                questions={agendaForm.preTestQuestions || []}
                onAdd={() => addAgendaFormQuestion('preTestQuestions')}
                onRemove={(idx) => removeAgendaFormQuestion('preTestQuestions', idx)}
                onChange={(idx, field, val) => updateAgendaFormQuestions('preTestQuestions', idx, field, val)}
                emptyText="Belum ada soal Pre-Test untuk agenda ini."
              />

              {/* Post-Test Builder */}
              <FasilQuestionBuilder
                title="Setup Soal Post-Test"
                badgeText="Post-Test"
                questions={agendaForm.questions || []}
                onAdd={() => addAgendaFormQuestion('questions')}
                onRemove={(idx) => removeAgendaFormQuestion('questions', idx)}
                onChange={(idx, field, val) => updateAgendaFormQuestions('questions', idx, field, val)}
                onCopyFromPreTest={copyPreTestToPostTestFasil}
                emptyText="Belum ada soal Post-Test untuk agenda ini."
              />

              <button
                type="submit"
                disabled={savingAgenda}
                className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {savingAgenda ? 'Menyimpan...' : isEditingAgenda ? 'Simpan Perubahan Agenda & Soal' : 'Buat Agenda'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGERJAAN KUIS PRE-TEST / POST-TEST */}
      {isKuisModalOpen && activeKuis && (
        <div onClick={() => setIsKuisModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative cursor-default">
            <button 
              onClick={() => setIsKuisModalOpen(false)} 
              className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {kuisResult ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
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
                <div className="inline-block bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl px-10 py-6 shadow-xl">
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
                      : 'text-orange-600 bg-orange-50 border-orange-100'
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
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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
