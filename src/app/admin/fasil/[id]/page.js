"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, User, Calendar, BookOpen, Users, ClipboardCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FasilDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    mandiri: true,
    binaan: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Reset scroll when loading finishes
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
        const area = document.getElementById('admin-content-area');
        if (area) area.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [loading]);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/admin/monitoring/fasil/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setNoteText(json.catatanAdmin || '');
        } else {
          toast.error("Gagal memuat detail Fasilitator");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch('/api/admin/monitoring/catatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: id,
          period_month: data.period.month,
          period_year: data.period.year,
          catatan: noteText
        })
      });
      if (res.ok) {
        toast.success("Catatan admin berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan catatan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-teal-900 font-bold">Memuat rincian evaluasi fasilitator...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Data Fasilitator tidak ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl">Kembali</button>
      </div>
    );
  }

  const { fasil, period, selfAssessment, binaan } = data;

  // Calculate average self assessment score
  const selfScores = selfAssessment.filter(q => q.score !== null).map(q => q.score);
  const selfAvg = selfScores.length > 0 ? (selfScores.reduce((acc, c) => acc + c, 0) / selfScores.length).toFixed(2) : null;

  const getScoreColor = (score) => {
    if (!score) return 'bg-slate-50 text-slate-500 border-slate-200';
    if (score <= 1.5) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (score <= 2.5) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (score <= 3.5) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8 pb-28 md:pb-32">
      {/* Navigation Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Rincian Evaluasi</h1>
        <p className="text-slate-500 font-semibold text-xs md:text-sm mt-0.5">
          Periode: <strong className="text-slate-800">{period.month} {period.year}</strong>
        </p>
      </div>

      {/* Profil Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Main User Identity */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-sm shrink-0">
              {fasil.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-slate-900 truncate" title={fasil.name}>
                  {fasil.name}
                </h2>
                <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {fasil.fasil_role || 'Fasilitator'}
                </span>
              </div>
              <p className="text-xs text-teal-700 font-semibold font-mono">{fasil.id}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Fasilitator • Wilayah {fasil.wilayah}
              </p>
            </div>
          </div>

          {/* Quick Stats / Meta info */}
          <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl px-3 py-2 text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Wilayah</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[140px] md:max-w-[180px]">
                {fasil.wilayah}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Pendampingan
              </p>
            </div>

            <div className="bg-teal-50/80 border border-teal-100 rounded-xl px-3 py-2 flex items-center justify-between md:justify-end gap-3">
              <div>
                <p className="text-[10px] font-bold text-teal-700 uppercase">Binaan</p>
                <p className="text-base md:text-lg font-black text-teal-950 leading-none mt-0.5">
                  {binaan.length} <span className="text-[10px] md:text-xs font-semibold text-teal-700">Etoser</span>
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 self-center">
                Aktif
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Evaluasi Sections Accordion */}
      <div className="space-y-4 md:space-y-6">
        <div>
          <h3 className="text-lg md:text-2xl font-black text-slate-900">Rincian Evaluasi</h3>
        </div>

        {/* 1. Penilaian Mandiri Accordion */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('mandiri')}
            className="w-full flex justify-between items-center px-4 py-3.5 md:p-5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200/60 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
              <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-teal-600 text-white shrink-0">
                <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h4 className="font-bold md:font-black text-slate-900 text-sm md:text-base truncate">Penilaian Mandiri</h4>
            </div>

            <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
              {selfAvg !== null && (
                <span className="text-xs md:text-sm font-black text-teal-900 bg-teal-100/70 border border-teal-200/80 px-2.5 py-1 rounded-lg md:rounded-xl">
                  {selfAvg}
                </span>
              )}
              {collapsedSections.mandiri ? <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> : <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />}
            </div>
          </button>

          {!collapsedSections.mandiri && (
            <div className="p-3.5 md:p-6">
              {selfAssessment.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium text-xs md:text-sm">
                  Fasilitator belum mengisi evaluasi mandiri bulan ini.
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {selfAssessment.map(q => (
                    <div key={q.id} className="p-3.5 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm flex justify-between items-start gap-3 hover:border-teal-200 transition-all">
                      <div className="space-y-1 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {q.kode}
                        </span>
                        <p className="text-xs md:text-sm font-semibold text-slate-900 leading-snug">{q.item_pernyataan}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl border text-xs md:text-sm font-black shrink-0 text-center min-w-[2.5rem] ${getScoreColor(q.score)}`}>
                        {q.score !== null ? q.score : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Status Peer Binaan Accordion */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('binaan')}
            className="w-full flex justify-between items-center px-4 py-3.5 md:p-5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200/60 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
              <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-indigo-600 text-white shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h4 className="font-bold md:font-black text-slate-900 text-sm md:text-base truncate">Status Peer Binaan</h4>
            </div>

            <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
              <span className="text-xs md:text-sm font-black text-indigo-900 bg-indigo-100/70 border border-indigo-200/80 px-2.5 py-1 rounded-lg md:rounded-xl">
                {binaan.length} Etoser
              </span>
              {collapsedSections.binaan ? <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> : <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />}
            </div>
          </button>

          {!collapsedSections.binaan && (
            <div className="p-3.5 md:p-6">
              {binaan.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium text-xs md:text-sm">
                  Tidak ada Etoser binaan di wilayah ini.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {binaan.map(b => (
                    <div 
                      key={b.id} 
                      onClick={() => router.push(`/admin/etoser/${b.id}`)}
                      className="p-3.5 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm flex justify-between items-center gap-3 hover:border-teal-200 hover:bg-teal-50/20 transition-all cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs md:text-sm group-hover:text-teal-700 transition-colors truncate">{b.name}</h4>
                        <p className="text-[11px] text-teal-700 font-semibold font-mono mt-0.5">{b.id}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Angkatan {b.angkatan} • {b.wilayah}</p>
                      </div>

                      <div className="shrink-0">
                        {b.statusPeer === 'Sudah Di-Peer' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] md:text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sudah Di-Peer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-[10px] md:text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Belum Di-Peer</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Admin Notes Section */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-bold text-slate-900">Catatan Evaluasi Admin</h3>
        </div>
        <p className="text-xs md:text-sm text-slate-600">Masukkan catatan kinerja atau evaluasi khusus untuk Fasilitator ini di periode berjalan. Catatan ini disimpan di riwayat database.</p>
        
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Tulis catatan evaluasi fasil disini..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-medium leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Catatan Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
