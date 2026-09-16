"use client";
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo, Suspense } from "react";
import Link from 'next/link';
import { Calendar, Plus, Search, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, Users, CheckCircle2, XCircle } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

function AdminAgendasContent() {
  const [agendas, setAgendas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true, target_role: "ETOSER", questions: []
  });

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
      setAgendas(data);
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
        setIsAddModalOpen(false);
        setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true, target_role: "ETOSER", questions: [] });
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
          questions: data.questions || []
        });
      } else {
        setFormData({
          ...agenda,
          target_role: agenda.target_role || "ETOSER",
          questions: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch agenda details", error);
      setFormData({
        ...agenda,
        target_role: agenda.target_role || "ETOSER",
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
        setIsEditModalOpen(false);
        setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true, target_role: "ETOSER", questions: [] });
        fetchAgendas();
      }
    } catch (error) {
      console.error("Failed to edit agenda", error);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    setFormData(prev => {
      const updatedQuestions = [...prev.questions];
      if (field === 'options') {
        const updatedOptions = [...updatedQuestions[index].options];
        updatedOptions[value.idx] = value.val;
        updatedQuestions[index] = { ...updatedQuestions[index], options: updatedOptions };
      } else {
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
      }
      return { ...prev, questions: updatedQuestions };
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), { question: "", options: ["", "", "", ""], correct_option: "0" }]
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index)
    }));
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

  // Derived state for filtering and pagination
  const filteredAgendas = useMemo(() => {
    let result = [...agendas];
    
    // Sort alphabetically by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by type
    if (typeFilter !== 'All Types') {
      result = result.filter(a => a.type === typeFilter);
    }

    // Filter by search query
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
            Kelola seluruh agenda Nasional maupun Wilayah untuk keperluan presensi dan pelaporan.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-teal-800 hover:bg-teal-900 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0 text-xs md:text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>+ Tambah Agenda</span>
        </button>
      </div>

      {/* Sub-Tabs: Agenda vs Presensi */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/admin/agendas?tab=agenda"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap bg-teal-800 text-white shadow-md shadow-teal-900/15"
        >
          <span>Daftar Agenda</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
            {agendas.length}
          </span>
        </Link>
        <Link
          href="/admin/agendas?tab=presensi"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap bg-white/60 hover:bg-white text-teal-900/70 hover:text-teal-950 border border-teal-200/60 shadow-xs transition-all"
        >
          <span>Presensi Kehadiran</span>
        </Link>
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
                  <th className="pb-4">Aktivitas</th>
                  <th className="pb-4">Target</th>
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
                    </td>
                    <td className="py-5">
                      <span className="text-teal-800/70 font-medium">{agenda.activity_type || '-'}</span>
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-extrabold px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-700">
                        {agenda.target_role === 'FASILITATOR' ? 'Fasil' : agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
                      </span>
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
                        <button onClick={() => handleEditClick(agenda)} className="p-2 text-teal-700/50 hover:text-teal-600 hover:bg-teal-500/10 rounded-xl transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(agenda)} className="p-2 text-teal-700/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer">
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
                {/* Header Row: Type badge, activity type, target, action buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      agenda.type === 'Nasional' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {agenda.type}
                    </span>
                    {agenda.activity_type && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {agenda.activity_type}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {agenda.target_role === 'FASILITATOR' ? 'Fasil' : agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
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

                {/* Agenda Name, Theme, and ID */}
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

                {/* Date & Time info */}
                {(agenda.start_date || agenda.start_time) && (
                  <div className="flex items-center gap-2 text-xs font-medium text-teal-900/80 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                    <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="truncate">
                      {agenda.start_date} {agenda.end_date && agenda.end_date !== agenda.start_date ? `s/d ${agenda.end_date}` : ''}
                      {agenda.start_time ? ` • ${agenda.start_time} - ${agenda.end_time || 'selesai'}` : ''}
                    </span>
                  </div>
                )}

                {/* Status Switcher & Link to Attendance */}
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

                  <Link
                    href={`/admin/agendas?tab=presensi`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors"
                  >
                    Presensi &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      
      {isAddModalOpen && (
        <div onClick={() => {
          setIsAddModalOpen(false);
          setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true });
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Tambah Agenda</h3>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true });
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900">
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

              {/* Post Test Builder */}
              <div className="border-t border-teal-100 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-teal-950 text-base">Setup Soal Post Test ({formData.questions?.length || 0})</h4>
                  <button 
                    type="button" 
                    onClick={addQuestion} 
                    className="text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all"
                  >
                    + Tambah Soal
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {(formData.questions || []).map((q, qIdx) => (
                    <div key={qIdx} className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-3 relative">
                      <button 
                        type="button" 
                        onClick={() => removeQuestion(qIdx)} 
                        className="absolute right-3 top-3 text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="pr-8">
                        <label className="block text-xs font-bold text-teal-800 mb-1">Soal {qIdx + 1}</label>
                        <textarea 
                          required
                          value={q.question} 
                          onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)} 
                          className="w-full px-3 py-2 rounded-xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm text-teal-950" 
                          rows={2}
                          placeholder="Tulis pertanyaan..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="block text-[10px] font-bold text-teal-800 mb-0.5">Opsi {String.fromCharCode(65 + optIdx)}</label>
                            <input 
                              required
                              type="text" 
                              value={opt} 
                              onChange={(e) => handleQuestionChange(qIdx, 'options', { idx: optIdx, val: e.target.value })} 
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
                          onChange={(e) => handleQuestionChange(qIdx, 'correct_option', e.target.value)} 
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
                  {(formData.questions || []).length === 0 && (
                    <p className="text-xs text-center text-teal-800/50 bg-teal-50/30 rounded-xl py-6 border border-dashed border-teal-200">Belum ada soal Post Test untuk agenda ini.</p>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
                Simpan Agenda
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div onClick={() => {
          setIsEditModalOpen(false);
          setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true });
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Edit Agenda</h3>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setFormData({ id: "", name: "", type: "Nasional", activity_type: "", theme: "", start_date: "", end_date: "", start_time: "", end_time: "", is_active: true });
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900">
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

              {/* Post Test Builder */}
              <div className="border-t border-teal-100 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-teal-950 text-base">Setup Soal Post Test ({formData.questions?.length || 0})</h4>
                  <button 
                    type="button" 
                    onClick={addQuestion} 
                    className="text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all"
                  >
                    + Tambah Soal
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {(formData.questions || []).map((q, qIdx) => (
                    <div key={qIdx} className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-3 relative">
                      <button 
                        type="button" 
                        onClick={() => removeQuestion(qIdx)} 
                        className="absolute right-3 top-3 text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="pr-8">
                        <label className="block text-xs font-bold text-teal-800 mb-1">Soal {qIdx + 1}</label>
                        <textarea 
                          required
                          value={q.question} 
                          onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)} 
                          className="w-full px-3 py-2 rounded-xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm text-teal-950" 
                          rows={2}
                          placeholder="Tulis pertanyaan..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="block text-[10px] font-bold text-teal-800 mb-0.5">Opsi {String.fromCharCode(65 + optIdx)}</label>
                            <input 
                              required
                              type="text" 
                              value={opt} 
                              onChange={(e) => handleQuestionChange(qIdx, 'options', { idx: optIdx, val: e.target.value })} 
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
                          onChange={(e) => handleQuestionChange(qIdx, 'correct_option', e.target.value)} 
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
                  {(formData.questions || []).length === 0 && (
                    <p className="text-xs text-center text-teal-800/50 bg-teal-50/30 rounded-xl py-6 border border-dashed border-teal-200">Belum ada soal Post Test untuk agenda ini.</p>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
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
              Apakah lu yakin mau menghapus agenda <strong>{selectedAgenda?.name}</strong>?
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 bg-white hover:bg-teal-50 text-teal-900 font-bold py-3 rounded-xl transition-all shadow-sm border border-teal-100"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(225,29,72,0.2)] transition-all active:scale-95"
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

      {/* Sub-Tabs: Agenda vs Presensi */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/admin/agendas?tab=agenda"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap bg-white/60 hover:bg-white text-teal-900/70 hover:text-teal-950 border border-teal-200/60 shadow-xs transition-all"
        >
          <span>Daftar Agenda</span>
        </Link>
        <Link
          href="/admin/agendas?tab=presensi"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap bg-teal-800 text-white shadow-md shadow-teal-900/15"
        >
          <span>Presensi Kehadiran</span>
        </Link>
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
                    <span className="bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-lg text-[10px] md:text-xs font-bold">
                      {item.agenda.activity_type}
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      Target: {item.agenda.target_role === 'FASILITATOR' ? 'Fasil' : item.agenda.target_role === 'SEMUA' ? 'Semua' : 'Etoser'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-teal-950">{item.agenda.name}</h2>
                  <p className="text-xs md:text-sm text-teal-800/70 font-medium mt-0.5">
                    Tema: {item.agenda.theme} &bull; {item.agenda.start_date}
                  </p>
                </div>
                
                <div className="flex gap-4 text-center shrink-0">
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
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                          etoser.hadir ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                          {etoser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-teal-900 text-sm truncate max-w-[150px]" title={etoser.name}>
                            {etoser.name}
                          </h4>
                          <p className="text-xs text-teal-700/60">
                            {etoser.id} &bull; {etoser.role && etoser.role.toUpperCase().includes('FASIL') ? 'Fasil' : 'Etoser'} &bull; {etoser.wilayah}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        {etoser.hadir ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold">Hadir</span>
                            </div>
                            {etoser.hasTakenPostTest ? (
                              <span className="text-[10px] font-black text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded border border-teal-200">
                                Skor: {etoser.postTestScore}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                Belum Kuis
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Alpa</span>
                          </div>
                        )}
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
