"use client";
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo, Suspense } from "react";
import Link from 'next/link';
import {
  Calendar, Plus, Search, Edit2, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, Users, CheckCircle2, XCircle,
  Copy, Download, TrendingUp, Award, FileText
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const EMPTY_FORM = {
  id: "",
  name: "",
  type: "Nasional",
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

function QuestionBuilderSection({
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
    <div className="border-t border-teal-100 pt-6 mt-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-teal-950 text-base">{title} ({questions.length})</h4>
          {badgeText && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
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
              title="Salin semua soal dan kunci jawaban dari Pre-Test"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin dari Pre-Test</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all cursor-pointer"
          >
            + Tambah Soal
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-3 relative">
            <button
              type="button"
              onClick={() => onRemove(qIdx)}
              className="absolute right-3 top-3 text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="pr-8">
              <label className="block text-xs font-bold text-teal-800 mb-1">Soal {qIdx + 1}</label>
              <textarea
                required
                value={q.question}
                onChange={(e) => onChange(qIdx, 'question', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm text-teal-950"
                rows={2}
                placeholder="Tulis pertanyaan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(q.options || ["", "", "", ""]).map((opt, optIdx) => (
                <div key={optIdx}>
                  <label className="block text-[10px] font-bold text-teal-800 mb-0.5">Opsi {String.fromCharCode(65 + optIdx)}</label>
                  <input
                    required
                    type="text"
                    value={opt}
                    onChange={(e) => onChange(qIdx, 'options', { idx: optIdx, val: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs text-teal-950"
                    placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-800 mb-1">Kunci Jawaban</label>
              <select
                value={q.correct_option}
                onChange={(e) => onChange(qIdx, 'correct_option', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs text-teal-950 font-bold"
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
          <p className="text-xs text-center text-teal-800/50 bg-teal-50/30 rounded-xl py-5 border border-dashed border-teal-200">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function AdminAgendasContent() {
  const [agendas, setAgendas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  
  const [formData, setFormData] = useState(EMPTY_FORM);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const searchQuery = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || 'All Types';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  const updateQueryParams = (params) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(params).forEach(([key, value]) => {
      if (!value) current.delete(key);
      else current.set(key, value);
    });
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchAgendas();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchAgendas = async () => {
    try {
      const res = await fetch('/api/admin/agendas');
      const data = await res.json();
      setAgendas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch agendas", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_active: formData.is_active === 'true' || formData.is_active === true })
      });
      if (res.ok) {
        toast.success('Agenda berhasil ditambahkan');
        setIsAddModalOpen(false);
        setFormData(EMPTY_FORM);
        fetchAgendas();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal membuat agenda');
      }
    } catch (error) {
      console.error("Failed to add agenda", error);
    }
  };

  const handleEditClick = async (agenda) => {
    try {
      const res = await fetch(`/api/admin/agendas/${agenda.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...data.agenda,
          target_role: data.agenda.target_role || "ETOSER",
          preTestQuestions: data.preTestQuestions || [],
          questions: data.questions || []
        });
      } else {
        setFormData({
          ...agenda,
          target_role: agenda.target_role || "ETOSER",
          preTestQuestions: [],
          questions: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch agenda details", error);
      setFormData({
        ...agenda,
        target_role: agenda.target_role || "ETOSER",
        preTestQuestions: [],
        questions: []
      });
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/agendas/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_active: formData.is_active === 'true' || formData.is_active === true })
      });
      if (res.ok) {
        toast.success('Agenda berhasil diperbarui');
        setIsEditModalOpen(false);
        setFormData(EMPTY_FORM);
        fetchAgendas();
      } else {
        toast.error('Gagal memperbarui agenda');
      }
    } catch (error) {
      console.error("Failed to edit agenda", error);
    }
  };

  const updateQuestionsList = (listKey, index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev[listKey] || [])];
      if (field === 'options') {
        const updatedOptions = [...updated[index].options];
        updatedOptions[value.idx] = value.val;
        updated[index] = { ...updated[index], options: updatedOptions };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, [listKey]: updated };
    });
  };

  const addQuestionToList = (listKey) => {
    setFormData(prev => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), { question: "", options: ["", "", "", ""], correct_option: "0" }]
    }));
  };

  const removeQuestionFromList = (listKey, index) => {
    setFormData(prev => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((_, idx) => idx !== index)
    }));
  };

  const copyPreTestToPostTest = () => {
    if (!formData.preTestQuestions || formData.preTestQuestions.length === 0) {
      toast.error('Belum ada soal Pre-Test untuk disalin');
      return;
    }
    const cloned = formData.preTestQuestions.map(q => ({
      question: q.question,
      options: [...(q.options || ["", "", "", ""])],
      correct_option: String(q.correct_option ?? "0")
    }));
    setFormData(prev => ({
      ...prev,
      questions: cloned
    }));
    toast.success(`${cloned.length} soal Pre-Test berhasil disalin ke Post-Test`);
  };

  const handleToggleActive = async (agenda) => {
    try {
      const res = await fetch(`/api/admin/agendas/${agenda.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...agenda, is_active: !agenda.is_active })
      });
      if (res.ok) {
        toast.success(`Agenda ${!agenda.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchAgendas();
      } else {
        toast.error('Gagal mengubah status');
      }
    } catch (error) {
      console.error("Failed to toggle agenda", error);
    }
  };

  const handleDeleteClick = (agenda) => {
    setSelectedAgenda(agenda);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAgenda) return;
    try {
      const res = await fetch(`/api/admin/agendas/${selectedAgenda.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedAgenda(null);
        fetchAgendas();
        toast.success("Agenda berhasil dihapus!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus agenda");
      }
    } catch (error) {
      console.error("Failed to delete agenda", error);
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const filteredAgendas = useMemo(() => {
    let result = [...agendas];
    result.sort((a, b) => a.name.localeCompare(b.name));

    if (typeFilter !== 'All Types') {
      result = result.filter(a => a.type === typeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.id.toLowerCase().includes(q) ||
        (a.theme && a.theme.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [agendas, searchQuery, typeFilter]);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(filteredAgendas.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  
  const paginatedAgendas = filteredAgendas.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const typeCounts = useMemo(() => {
    return {
      all: agendas.length,
      nasional: agendas.filter(a => a.type === 'Nasional').length,
      wilayah: agendas.filter(a => a.type === 'Wilayah').length,
    };
  }, [agendas]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-teal-950 tracking-tight mb-1 md:mb-2 drop-shadow-sm flex items-center gap-2.5">
            Manajemen Agenda
            <span className="inline-flex items-center justify-center h-6 md:h-8 px-2.5 rounded-full bg-teal-600/10 text-teal-700 text-xs md:text-sm font-bold border border-teal-600/20">
              {agendas.length}
            </span>
          </h1>
          <p className="hidden md:block text-teal-800/70 font-medium text-base md:text-lg max-w-xl">
            Kelola seluruh agenda Nasional maupun Wilayah beserta soal Pre-Test & Post-Test.
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData(EMPTY_FORM);
            setIsAddModalOpen(true);
          }}
          className="bg-teal-800 hover:bg-teal-900 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0 text-xs md:text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>+ Tambah Agenda</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white/40 backdrop-blur-2xl rounded-2xl md:rounded-[2.5rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] p-4 md:p-8 border border-white/60">
        
        {/* Controls: Search & Type Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <h2 className="text-lg md:text-xl font-bold text-teal-950">Daftar Agenda</h2>
            <span className="text-xs font-semibold text-teal-700/70 md:hidden">
              {filteredAgendas.length} Ditemukan
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-teal-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value, page: "1" })}
                placeholder="Cari agenda atau tema..." 
                className="w-full pl-9 pr-8 py-2 md:py-2.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 placeholder-teal-800/40 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => updateQueryParams({ search: '', page: "1" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-700/50 hover:text-teal-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select 
              value={typeFilter}
              onChange={(e) => updateQueryParams({ type: e.target.value === 'All Types' ? '' : e.target.value, page: "1" })}
              className="py-2 md:py-2.5 px-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 shadow-inner cursor-pointer"
            >
              <option value="All Types">Semua Tipe ({typeCounts.all})</option>
              <option value="Nasional">Nasional ({typeCounts.nasional})</option>
              <option value="Wilayah">Wilayah ({typeCounts.wilayah})</option>
            </select>
          </div>
        </div>

        {/* DESKTOP VIEW: Full Table (Hidden on mobile) */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-teal-800/60 uppercase tracking-wider border-b-2 border-teal-900/5">
                  <th className="pb-4 pl-2">Agenda</th>
                  <th className="pb-4">Tipe</th>
                  <th className="pb-4">Target</th>
                  <th className="pb-4">Kuis (Pre / Post)</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-teal-800/50 font-medium">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                      Memuat data...
                    </td>
                  </tr>
                ) : paginatedAgendas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-teal-800/50 font-medium">
                      {searchQuery ? "Tidak ada agenda yang cocok dengan pencarian." : "Belum ada data agenda."}
                    </td>
                  </tr>
                ) : paginatedAgendas.map((agenda, i) => (
                  <tr key={i} className="hover:bg-white/40 transition-colors group">
                    <td className="py-5 pl-2">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white/60
                          ${agenda.type === 'Nasional' ? 'bg-amber-100/80 text-amber-700' : 'bg-blue-100/80 text-blue-700'}`}>
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-teal-950 text-base">{agenda.name}</p>
                          <p className="text-xs text-teal-800/60 font-semibold mt-0.5">
                            ID: {agenda.id} {agenda.theme && `• Tema: ${agenda.theme}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="font-bold text-teal-900">{agenda.type}</span>
                      {agenda.activity_type && (
                        <p className="text-xs text-teal-800/60">{agenda.activity_type}</p>
                      )}
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-extrabold px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-700">
                        {agenda.target_role === 'FASILITATOR' ? 'Fasil' : agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
                      </span>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          (agenda.preTestCount || 0) > 0
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          Pre: {agenda.preTestCount || 0}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          (agenda.postTestCount || 0) > 0
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          Post: {agenda.postTestCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleActive(agenda)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            agenda.is_active ? 'bg-emerald-500' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              agenda.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold w-16 ${agenda.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {agenda.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 pr-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditClick(agenda)} className="p-2 text-teal-700/50 hover:text-teal-600 hover:bg-teal-500/10 rounded-xl transition-colors cursor-pointer" title="Edit Agenda & Soal">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(agenda)} className="p-2 text-teal-700/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer" title="Hapus Agenda">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Desktop Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-teal-900/5 mt-4 pt-6">
              <span className="text-sm font-medium text-teal-800/60">
                Showing {((validCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(validCurrentPage * itemsPerPage, filteredAgendas.length)} of {filteredAgendas.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={validCurrentPage === 1}
                  onClick={() => updateQueryParams({ page: String(validCurrentPage - 1) })}
                  className="p-2 rounded-xl bg-white/50 border border-teal-100 text-teal-700 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNumber = idx + 1;
                    if (totalPages > 7 && Math.abs(pageNumber - validCurrentPage) > 2 && pageNumber !== 1 && pageNumber !== totalPages) {
                      if (pageNumber === 2 || pageNumber === totalPages - 1) return <span key={idx} className="text-teal-800/40 px-1">...</span>;
                      return null;
                    }
                    
                    return (
                      <button 
                        key={pageNumber}
                        onClick={() => updateQueryParams({ page: String(pageNumber) })}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                          validCurrentPage === pageNumber 
                          ? 'bg-teal-600 text-white shadow-md' 
                          : 'bg-white/50 text-teal-700 hover:bg-white border border-teal-100 hover:border-teal-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button 
                  disabled={validCurrentPage === totalPages}
                  onClick={() => updateQueryParams({ page: String(validCurrentPage + 1) })}
                  className="p-2 rounded-xl bg-white/50 border border-teal-100 text-teal-700 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE VIEW: Agenda Cards (< md) */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-teal-800/60 font-medium bg-white/40 rounded-2xl border border-white/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-600" />
              Memuat data agenda...
            </div>
          ) : filteredAgendas.length === 0 ? (
            <div className="py-12 px-4 text-center text-teal-800/60 font-medium bg-white/40 rounded-2xl border border-white/50">
              {searchQuery ? "Tidak ada agenda yang cocok dengan pencarian." : "Belum ada data agenda."}
            </div>
          ) : (
            filteredAgendas.map((agenda) => (
              <div key={agenda.id} className="p-3.5 rounded-2xl border border-teal-200/70 bg-white/90 backdrop-blur-md shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      agenda.type === 'Nasional' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {agenda.type}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {agenda.target_role === 'FASILITATOR' ? 'Fasil' : agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                      Pre: {agenda.preTestCount || 0}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Post: {agenda.postTestCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleEditClick(agenda)}
                      className="p-1.5 text-teal-700 hover:text-teal-950 hover:bg-teal-100/60 rounded-lg transition-colors cursor-pointer"
                      title="Edit Agenda"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(agenda)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-teal-950 text-sm leading-snug">
                    {agenda.name}
                  </h3>
                  {agenda.theme && (
                    <p className="text-xs text-teal-800/70 font-medium mt-0.5">
                      Tema: {agenda.theme}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    ID: {agenda.id}
                  </p>
                </div>

                {(agenda.start_date || agenda.start_time) && (
                  <div className="flex items-center gap-2 text-xs font-medium text-teal-900/80 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                    <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="truncate">
                      {agenda.start_date} {agenda.end_date && agenda.end_date !== agenda.start_date ? `s/d ${agenda.end_date}` : ''}
                      {agenda.start_time ? ` • ${agenda.start_time} - ${agenda.end_time || 'selesai'}` : ''}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleToggleActive(agenda)}
                      className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        agenda.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          agenda.is_active ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${agenda.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {agenda.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/agendas?tab=presensi`}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl border border-teal-200 transition-colors"
                    >
                      Presensi
                    </Link>
                    <Link
                      href={`/admin/agendas?tab=skor`}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl border border-indigo-200 transition-colors"
                    >
                      Skor &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      
      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div onClick={() => {
          setIsAddModalOpen(false);
          setFormData(EMPTY_FORM);
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Tambah Agenda</h3>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setFormData(EMPTY_FORM);
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tipe</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                    <option value="Nasional">Nasional</option>
                    <option value="Wilayah">Wilayah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Target Agenda</label>
                  <select value={formData.target_role} onChange={(e) => setFormData({...formData, target_role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                    <option value="ETOSER">Etoser Only</option>
                    <option value="FASILITATOR">Fasilitator Only</option>
                    <option value="SEMUA">Semua (Etoser & Fasil)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Nama Kegiatan</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Pelatihan Softskill Etoser" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Tipe Aktivitas</label>
                <input type="text" value={formData.activity_type} onChange={(e) => setFormData({...formData, activity_type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="e.g. Pembinaan, Capacity Building" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Tema (Opsional)</label>
                <input type="text" value={formData.theme} onChange={(e) => setFormData({...formData, theme: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Membangun Pemimpin Muda" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Status</label>
                <select value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                  <option value={true}>Aktif</option>
                  <option value={false}>Selesai / Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tanggal Mulai</label>
                  <input required type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Jam Mulai</label>
                  <input required type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tanggal Selesai</label>
                  <input required type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Jam Selesai</label>
                  <input required type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
              </div>

              {/* Pre-Test Builder */}
              <QuestionBuilderSection
                title="Setup Soal Pre-Test"
                badgeText="Pre-Test"
                questions={formData.preTestQuestions || []}
                onAdd={() => addQuestionToList('preTestQuestions')}
                onRemove={(idx) => removeQuestionFromList('preTestQuestions', idx)}
                onChange={(idx, field, val) => updateQuestionsList('preTestQuestions', idx, field, val)}
                emptyText="Belum ada soal Pre-Test untuk agenda ini."
              />

              {/* Post-Test Builder */}
              <QuestionBuilderSection
                title="Setup Soal Post-Test"
                badgeText="Post-Test"
                questions={formData.questions || []}
                onAdd={() => addQuestionToList('questions')}
                onRemove={(idx) => removeQuestionFromList('questions', idx)}
                onChange={(idx, field, val) => updateQuestionsList('questions', idx, field, val)}
                onCopyFromPreTest={copyPreTestToPostTest}
                emptyText="Belum ada soal Post-Test untuk agenda ini."
              />
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer">
                Simpan Agenda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div onClick={() => {
          setIsEditModalOpen(false);
          setFormData(EMPTY_FORM);
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Edit Agenda</h3>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setFormData(EMPTY_FORM);
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">ID Agenda</label>
                  <input disabled type="text" value={formData.id} className="w-full px-4 py-3 rounded-xl bg-teal-50/50 border border-teal-100/50 text-teal-900/60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tipe</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                    <option value="Nasional">Nasional</option>
                    <option value="Wilayah">Wilayah</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Target Agenda</label>
                <select value={formData.target_role} onChange={(e) => setFormData({...formData, target_role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                  <option value="ETOSER">Etoser Only</option>
                  <option value="FASILITATOR">Fasilitator Only</option>
                  <option value="SEMUA">Semua (Etoser & Fasil)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Nama Kegiatan</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Pelatihan Softskill Etoser" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Tipe Aktivitas</label>
                <input type="text" value={formData.activity_type || ""} onChange={(e) => setFormData({...formData, activity_type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="e.g. Pembinaan, Capacity Building" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Tema (Opsional)</label>
                <input type="text" value={formData.theme || ""} onChange={(e) => setFormData({...formData, theme: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Membangun Pemimpin Muda" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Status</label>
                <select value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                  <option value={true}>Aktif</option>
                  <option value={false}>Selesai / Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tanggal Mulai</label>
                  <input required type="date" value={formData.start_date || ""} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Jam Mulai</label>
                  <input required type="time" value={formData.start_time || ""} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Tanggal Selesai</label>
                  <input required type="date" value={formData.end_date || ""} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Jam Selesai</label>
                  <input required type="time" value={formData.end_time || ""} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" />
                </div>
              </div>

              {/* Pre-Test Builder */}
              <QuestionBuilderSection
                title="Setup Soal Pre-Test"
                badgeText="Pre-Test"
                questions={formData.preTestQuestions || []}
                onAdd={() => addQuestionToList('preTestQuestions')}
                onRemove={(idx) => removeQuestionFromList('preTestQuestions', idx)}
                onChange={(idx, field, val) => updateQuestionsList('preTestQuestions', idx, field, val)}
                emptyText="Belum ada soal Pre-Test untuk agenda ini."
              />

              {/* Post-Test Builder */}
              <QuestionBuilderSection
                title="Setup Soal Post-Test"
                badgeText="Post-Test"
                questions={formData.questions || []}
                onAdd={() => addQuestionToList('questions')}
                onRemove={(idx) => removeQuestionFromList('questions', idx)}
                onChange={(idx, field, val) => updateQuestionsList('questions', idx, field, val)}
                onCopyFromPreTest={copyPreTestToPostTest}
                emptyText="Belum ada soal Post-Test untuk agenda ini."
              />
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer">
                Update Agenda
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div onClick={() => setIsDeleteModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/30 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-300 cursor-default">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-2xl font-black text-teal-950 mb-2">Hapus Agenda?</h3>
            <p className="text-teal-800/80 font-medium mb-8">
              Apakah kamu yakin mau menghapus agenda <strong>{selectedAgenda?.name}</strong>?
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 bg-white hover:bg-teal-50 text-teal-900 font-bold py-3 rounded-xl transition-all shadow-sm border border-teal-100 cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(225,29,72,0.2)] transition-all active:scale-95 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function AdminPresensiContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayahFilter, setWilayahFilter] = useState('');
  const [wilayahOptions, setWilayahOptions] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchData();
  }, [wilayahFilter]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        const wilSetting = json.find(s => s.key === 'daftar_wilayah');
        if (wilSetting && wilSetting.value) {
          setWilayahOptions(wilSetting.value.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presensi?wilayah=${encodeURIComponent(wilayahFilter)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-teal-800/50 font-medium">
        <Loader2 className="w-8 h-8 animate-spin mr-3" /> Memuat data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-teal-950 tracking-tight mb-1 md:mb-2 drop-shadow-sm flex items-center gap-2.5">
            Pemantauan Presensi
          </h1>
          <p className="hidden md:block text-teal-800/70 font-medium text-base md:text-lg max-w-xl">
            Pantau tingkat kehadiran seluruh Etoser & Fasilitator pada setiap agenda aktif.
          </p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={wilayahFilter}
            onChange={(e) => setWilayahFilter(e.target.value)}
            className="py-2 md:py-3 px-3 md:px-5 bg-white/70 backdrop-blur-md border border-teal-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold text-teal-900 shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="">Semua Wilayah</option>
            {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md border border-white/80 p-8 md:p-12 rounded-2xl md:rounded-[2rem] shadow-sm text-center">
          <Calendar className="w-12 h-12 md:w-16 md:h-16 text-teal-300 mx-auto mb-3" />
          <h3 className="text-lg md:text-xl font-bold text-teal-800">Tidak ada agenda aktif saat ini.</h3>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {data.map((item, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-2xl md:rounded-[2rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] overflow-hidden">
              
              <div className="p-4 md:p-8 border-b border-teal-100 bg-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                      item.agenda.type === 'Nasional' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.agenda.type}
                    </span>
                    {item.agenda.activity_type && (
                      <span className="bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-lg text-[10px] md:text-xs font-bold">
                        {item.agenda.activity_type}
                      </span>
                    )}
                    <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      Target: {item.agenda.target_role === 'FASILITATOR' ? 'Fasil' : item.agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-teal-950">{item.agenda.name}</h2>
                  <p className="text-xs md:text-sm text-teal-800/70 font-medium mt-0.5">
                    Tema: {item.agenda.theme || '-'} &bull; {item.agenda.start_date}
                  </p>
                </div>
                
                <div className="flex gap-3 text-center shrink-0 flex-wrap">
                  <div className="bg-teal-50/80 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-teal-100 shadow-inner">
                    <p className="text-[10px] md:text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">Kehadiran</p>
                    <p className="text-xl md:text-2xl font-black text-teal-900">
                      {item.totalHadir} <span className="text-sm md:text-base text-teal-700/60 font-medium">/ {item.totalEtoser}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                  <h3 className="font-bold text-base md:text-lg text-teal-900">
                    Daftar {item.agenda.target_role === 'FASILITATOR' ? 'Fasilitator' : item.agenda.target_role === 'SEMUA' ? 'Peserta (Etoser & Fasil)' : 'Etoser'}
                  </h3>
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-teal-700/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Cari nama..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 pl-9 pr-4 py-1.5 md:py-2 bg-white/60 border border-teal-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-teal-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-h-[400px] overflow-y-auto pr-1 pb-2">
                  {item.etoserStatus
                    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((etoser) => (
                    <div key={etoser.id} className="flex items-center justify-between p-4 bg-white/50 border border-teal-100 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                          etoser.hadir ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                          {etoser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-teal-900 text-sm truncate max-w-[140px]" title={etoser.name}>
                            {etoser.name}
                          </h4>
                          <p className="text-xs text-teal-700/60 truncate">
                            {etoser.id} &bull; {etoser.role && etoser.role.toUpperCase().includes('FASIL') ? 'Fasil' : 'Etoser'} &bull; {etoser.wilayah}
                          </p>
                        </div>
                      </div>
                      
                      <div className="shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          {etoser.hadir ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">Hadir</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">Alpa</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {etoser.hasTakenPreTest && (
                              <span className="text-[10px] font-black text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded border border-sky-200">
                                Pre: {etoser.preTestScore}
                              </span>
                            )}
                            {etoser.hasTakenPostTest && (
                              <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded border border-indigo-200">
                                Post: {etoser.postTestScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {item.etoserStatus.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                     <p className="text-teal-800/50 text-sm py-4">
                       Tidak ada {item.agenda.target_role === 'FASILITATOR' ? 'Fasilitator' : item.agenda.target_role === 'SEMUA' ? 'Peserta' : 'Etoser'} ditemukan.
                     </p>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSkorContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedAgendaId, setSelectedAgendaId] = useState('ALL');
  const [wilayahFilter, setWilayahFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, TAKEN_ANY, COMPLETE
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayahOptions, setWilayahOptions] = useState([]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        const wilSetting = json.find(s => s.key === 'daftar_wilayah');
        if (wilSetting && wilSetting.value) {
          setWilayahOptions(wilSetting.value.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presensi?includeAll=true&wilayah=${encodeURIComponent(wilayahFilter)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchData();
  }, [wilayahFilter]);

  const filteredAgendasData = useMemo(() => {
    if (selectedAgendaId === 'ALL') return data;
    return data.filter(item => item.agenda.id === selectedAgendaId);
  }, [data, selectedAgendaId]);

  const flattenedRows = useMemo(() => {
    const rows = [];
    for (const item of filteredAgendasData) {
      for (const p of item.etoserStatus || []) {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchId = p.id?.toLowerCase().includes(q);
          const matchAgenda = item.agenda.name?.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchAgenda) continue;
        }
        if (statusFilter === 'TAKEN_ANY' && !p.hasTakenPreTest && !p.hasTakenPostTest) continue;
        if (statusFilter === 'COMPLETE' && (!p.hasTakenPreTest || !p.hasTakenPostTest)) continue;

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
  }, [filteredAgendasData, searchQuery, statusFilter]);

  const overallStats = useMemo(() => {
    const preList = flattenedRows.filter(r => r.preTestScore !== null).map(r => r.preTestScore);
    const postList = flattenedRows.filter(r => r.postTestScore !== null).map(r => r.postTestScore);
    const gainList = flattenedRows.filter(r => r.gainScore !== null).map(r => r.gainScore);

    const avgPre = preList.length > 0 ? Math.round((preList.reduce((a, b) => a + b, 0) / preList.length) * 10) / 10 : null;
    const avgPost = postList.length > 0 ? Math.round((postList.reduce((a, b) => a + b, 0) / postList.length) * 10) / 10 : null;
    const avgGain = gainList.length > 0 ? Math.round((gainList.reduce((a, b) => a + b, 0) / gainList.length) * 10) / 10 : null;

    return {
      preCount: preList.length,
      postCount: postList.length,
      avgPre,
      avgPost,
      avgGain
    };
  }, [flattenedRows]);

  const handleExportCsv = () => {
    if (flattenedRows.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }
    const headers = [
      'ID Agenda', 'Nama Agenda', 'Tipe Agenda', 'Tanggal',
      'ID Peserta', 'Nama Peserta', 'Role', 'Wilayah',
      'Kehadiran', 'Skor Pre-Test', 'Skor Post-Test', 'Gain (Post - Pre)'
    ];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...flattenedRows.map(r => [
        r.agendaId,
        r.agendaName,
        r.agendaType,
        r.agendaDate || '',
        r.id,
        r.name,
        r.role && r.role.toUpperCase().includes('FASIL') ? 'Fasilitator' : 'Etoser',
        r.wilayah || '',
        r.hadir ? 'Hadir' : 'Alpa',
        r.preTestScore !== null ? r.preTestScore : '',
        r.postTestScore !== null ? r.postTestScore : '',
        r.gainScore !== null ? (r.gainScore > 0 ? `+${r.gainScore}` : r.gainScore) : ''
      ].map(escapeCsv).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-skor-pre-post-test-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Data skor berhasil di-export ke CSV');
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-teal-800/50 font-medium">
        <Loader2 className="w-8 h-8 animate-spin mr-3" /> Memuat data skor...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-teal-950 tracking-tight mb-1 md:mb-2 drop-shadow-sm">
            Data Skor Pre-Test & Post-Test
          </h1>
          <p className="hidden md:block text-teal-800/70 font-medium text-base md:text-lg max-w-2xl">
            Evaluasi capaian pemahaman peserta sebelum (Pre-Test) dan sesudah (Post-Test) mengikuti agenda pembinaan.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="bg-teal-800 hover:bg-teal-900 text-white font-bold py-2.5 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 md:p-6 shadow-sm">
          <p className="text-[11px] md:text-xs font-bold text-teal-700/70 uppercase tracking-wider">Partisipasi Tes</p>
          <p className="text-xl md:text-3xl font-black text-teal-950 mt-1">
            {overallStats.preCount} <span className="text-xs md:text-sm font-semibold text-teal-700/60">Pre</span> / {overallStats.postCount} <span className="text-xs md:text-sm font-semibold text-teal-700/60">Post</span>
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 md:p-6 shadow-sm">
          <p className="text-[11px] md:text-xs font-bold text-sky-700 uppercase tracking-wider">Rata-rata Pre-Test</p>
          <p className="text-2xl md:text-3xl font-black text-sky-900 mt-1">
            {overallStats.avgPre !== null ? overallStats.avgPre : '-'}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 md:p-6 shadow-sm">
          <p className="text-[11px] md:text-xs font-bold text-indigo-700 uppercase tracking-wider">Rata-rata Post-Test</p>
          <p className="text-2xl md:text-3xl font-black text-indigo-900 mt-1">
            {overallStats.avgPost !== null ? overallStats.avgPost : '-'}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 md:p-6 shadow-sm">
          <p className="text-[11px] md:text-xs font-bold text-emerald-700 uppercase tracking-wider">Rata-rata Gain (Δ)</p>
          <p className={`text-2xl md:text-3xl font-black mt-1 ${
            overallStats.avgGain === null ? 'text-slate-400' : overallStats.avgGain >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {overallStats.avgGain !== null ? (overallStats.avgGain > 0 ? `+${overallStats.avgGain}` : overallStats.avgGain) : '-'}
          </p>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="bg-white/50 backdrop-blur-2xl rounded-2xl md:rounded-[2.5rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] p-4 md:p-8 border border-white/60 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-teal-800/70 uppercase mb-1">Filter Agenda</label>
            <select
              value={selectedAgendaId}
              onChange={(e) => setSelectedAgendaId(e.target.value)}
              className="w-full py-2.5 px-3 bg-white/80 border border-teal-200 rounded-xl text-xs md:text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="ALL">Semua Agenda ({data.length})</option>
              {data.map(item => (
                <option key={item.agenda.id} value={item.agenda.id}>
                  {item.agenda.name} ({item.agenda.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-teal-800/70 uppercase mb-1">Filter Wilayah</label>
            <select
              value={wilayahFilter}
              onChange={(e) => setWilayahFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-white/80 border border-teal-200 rounded-xl text-xs md:text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="">Semua Wilayah</option>
              {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-teal-800/70 uppercase mb-1">Status Pengerjaan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-white/80 border border-teal-200 rounded-xl text-xs md:text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="ALL">Semua Peserta</option>
              <option value="TAKEN_ANY">Sudah Mengerjakan (Pre / Post)</option>
              <option value="COMPLETE">Lengkap (Pre & Post)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-teal-800/70 uppercase mb-1">Cari Peserta / Agenda</label>
            <div className="relative">
              <Search className="w-4 h-4 text-teal-700/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama atau ID peserta..."
                className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-teal-200 rounded-xl text-xs md:text-sm font-medium text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-teal-800/60 uppercase tracking-wider border-b-2 border-teal-900/5">
                <th className="pb-3 pl-2">Peserta</th>
                <th className="pb-3">Wilayah</th>
                <th className="pb-3">Agenda</th>
                <th className="pb-3 text-center">Kehadiran</th>
                <th className="pb-3 text-center">Skor Pre-Test</th>
                <th className="pb-3 text-center">Skor Post-Test</th>
                <th className="pb-3 text-center pr-2">Selisih / Gain (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {flattenedRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-teal-800/50 font-medium">
                    Tidak ada data skor yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                flattenedRows.map((row, idx) => (
                  <tr key={`${row.agendaId}-${row.id}-${idx}`} className="hover:bg-white/50 transition-colors">
                    <td className="py-4 pl-2">
                      <p className="font-bold text-teal-950 text-sm">{row.name}</p>
                      <p className="text-xs text-teal-700/60 font-medium">
                        {row.id} &bull; {row.role && row.role.toUpperCase().includes('FASIL') ? 'Fasilitator' : 'Etoser'}
                      </p>
                    </td>
                    <td className="py-4 text-sm font-semibold text-teal-900">{row.wilayah || '-'}</td>
                    <td className="py-4">
                      <p className="font-bold text-teal-950 text-sm">{row.agendaName}</p>
                      <p className="text-xs text-teal-700/60">{row.agendaType} {row.agendaDate ? `• ${row.agendaDate}` : ''}</p>
                    </td>
                    <td className="py-4 text-center">
                      {row.hadir ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
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
          {flattenedRows.length === 0 ? (
            <div className="py-10 text-center text-teal-800/50 text-sm">
              Tidak ada data skor yang sesuai dengan filter.
            </div>
          ) : (
            flattenedRows.map((row, idx) => (
              <div key={`${row.agendaId}-${row.id}-${idx}`} className="p-3.5 bg-white/90 border border-teal-100 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-teal-950 text-sm">{row.name}</h4>
                    <p className="text-[11px] text-teal-700/70">{row.id} &bull; {row.wilayah || '-'}</p>
                    <p className="text-xs font-semibold text-teal-900 mt-0.5">{row.agendaName}</p>
                  </div>
                  {row.hadir ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Hadir</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Alpa</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-50 text-center">
                  <div className="bg-sky-50/70 rounded-xl p-2 border border-sky-100">
                    <p className="text-[10px] font-bold text-sky-700 uppercase">Pre-Test</p>
                    <p className="text-sm font-black text-sky-950">{row.preTestScore !== null ? row.preTestScore : '-'}</p>
                  </div>
                  <div className="bg-indigo-50/70 rounded-xl p-2 border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase">Post-Test</p>
                    <p className="text-sm font-black text-indigo-950">{row.postTestScore !== null ? row.postTestScore : '-'}</p>
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
  );
}

function PageRouter() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'agenda';

  useEffect(() => {
    const area = document.getElementById('admin-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [tab]);

  if (tab === 'presensi') return <AdminPresensiContent />;
  if (tab === 'skor') return <AdminSkorContent />;
  return <AdminAgendasContent />;
}

export default function AdminAgendasPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64 text-teal-800/50 font-medium">
        <Loader2 className="w-8 h-8 animate-spin mr-3" /> Memuat data...
      </div>
    }>
      <PageRouter />
    </Suspense>
  );
}
